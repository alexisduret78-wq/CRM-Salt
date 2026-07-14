/**
 * Import idempotent des données consolidées dans Supabase.
 *
 * Lit `donnees_consolidees.json` (1801 entreprises + contacts) et upsert dans
 * les tables `entreprises` et `contacts`, rattachées à l'utilisateur d'Alexis.
 *
 * Utilise la SERVICE ROLE KEY (admin) → à ne JAMAIS exposer au frontend.
 *
 * Variables (dans .env.local à la racine du projet) :
 *   VITE_SUPABASE_URL           URL du projet Supabase
 *   SUPABASE_SERVICE_ROLE_KEY   clé service_role (admin)
 *   SUPABASE_USER_ID            UID auth d'Alexis  (ou)
 *   SUPABASE_USER_EMAIL         email auth d'Alexis (résolu en UID via l'API admin)
 *   DATA_FILE                   (optionnel) chemin du JSON
 *
 * Lancement :  npm run import          (upsert, idempotent)
 *              npm run import:force    (purge puis ré-importe)
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !SERVICE_KEY) {
  console.error('❌ VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis (.env.local).')
  process.exit(1)
}

const DATA_FILE =
  process.env.DATA_FILE ??
  path.resolve(__dirname, '../../files/extracted/kit_demarrage/donnees_consolidees.json')

const FORCE = process.argv.includes('--force')
const CHUNK = 500

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function resolveUserId(): Promise<string> {
  if (process.env.SUPABASE_USER_ID) return process.env.SUPABASE_USER_ID
  const email = process.env.SUPABASE_USER_EMAIL
  if (!email) {
    console.error('❌ Renseigner SUPABASE_USER_ID ou SUPABASE_USER_EMAIL dans .env.local.')
    process.exit(1)
  }
  // Recherche paginée de l'utilisateur par email
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (user) return user.id
    if (data.users.length < 200) break
  }
  console.error(`❌ Aucun utilisateur Auth avec l'email ${email}.`)
  process.exit(1)
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

async function main() {
  const userId = await resolveUserId()
  console.log(`👤 Utilisateur cible : ${userId}`)

  const raw = JSON.parse(readFileSync(DATA_FILE, 'utf-8')) as {
    entreprises: Record<string, unknown>[]
    contacts: Record<string, unknown>[]
  }
  console.log(`📄 ${raw.entreprises.length} entreprises, ${raw.contacts.length} contacts`)

  const ENT_COLS = [
    'id', 'nom', 'business_uid', 'secteur', 'ville', 'code_postal', 'adresse', 'canton',
    'taille_employes', 'site_web', 'linkedin_url', 'typologie', 'couleur',
    'statut_pamela_origine', 'assignation', 'score_salt', 'priorite', 'pourquoi_cible',
    'echeance_contrat', 'notes_consolidees', 'source_fichier',
  ]
  const CON_COLS = [
    'id', 'entreprise_id', 'prenom', 'nom', 'fonction', 'email', 'telephone', 'linkedin',
    'est_decideur', 'source_fichier',
  ]

  const pick = (o: Record<string, unknown>, cols: string[]) => {
    const r: Record<string, unknown> = { user_id: userId }
    for (const c of cols) r[c] = o[c] ?? null
    return r
  }

  if (FORCE) {
    console.log('🧨 --force : purge des données de cet utilisateur…')
    await admin.from('contacts').delete().eq('user_id', userId)
    await admin.from('entreprises').delete().eq('user_id', userId)
  }

  // Entreprises d'abord (les contacts y font référence)
  const ents = raw.entreprises.map((e) => pick(e, ENT_COLS))
  let done = 0
  for (const batch of chunk(ents, CHUNK)) {
    const { error } = await admin.from('entreprises').upsert(batch, { onConflict: 'id' })
    if (error) throw error
    done += batch.length
    console.log(`  entreprises ${done}/${ents.length}`)
  }

  const contacts = raw.contacts.map((c) => pick(c, CON_COLS))
  done = 0
  for (const batch of chunk(contacts, CHUNK)) {
    const { error } = await admin.from('contacts').upsert(batch, { onConflict: 'id' })
    if (error) throw error
    done += batch.length
    console.log(`  contacts ${done}/${contacts.length}`)
  }

  console.log('✅ Import terminé.')
}

main().catch((err) => {
  console.error('❌ Import échoué :', err)
  process.exit(1)
})
