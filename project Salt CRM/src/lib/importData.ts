// =====================================================
// Import des données consolidées — côté navigateur, authentifié
// =====================================================
// L'utilisateur sélectionne le fichier `donnees_consolidees.json` depuis son
// ordinateur (fichier privé, jamais embarqué dans l'app publique). L'insertion
// passe par la session Supabase authentifiée → RLS satisfaite (user_id = auth.uid()).
// Idempotent : upsert sur `id`, rejouable sans doublon.

import { supabase } from './supabase'

const ENT_COLS = [
  'id', 'nom', 'business_uid', 'secteur', 'ville', 'code_postal', 'adresse', 'canton',
  'taille_employes', 'site_web', 'linkedin_url', 'typologie', 'couleur',
  'statut_pamela_origine', 'assignation', 'score_salt', 'priorite', 'pourquoi_cible',
  'echeance_contrat', 'notes_consolidees', 'source_fichier',
] as const

const CON_COLS = [
  'id', 'entreprise_id', 'prenom', 'nom', 'fonction', 'email', 'telephone', 'linkedin',
  'est_decideur', 'source_fichier',
] as const

const BATCH = 500

interface RawData {
  entreprises?: Record<string, unknown>[]
  contacts?: Record<string, unknown>[]
}

export interface ImportProgress {
  phase: 'entreprises' | 'contacts' | 'termine'
  done: number
  total: number
}

function pick(o: Record<string, unknown>, cols: readonly string[], userId: string) {
  const r: Record<string, unknown> = { user_id: userId }
  for (const c of cols) r[c] = o[c] ?? null
  return r
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

export async function importDepuisFichier(
  file: File,
  onProgress?: (p: ImportProgress) => void
): Promise<{ entreprises: number; contacts: number }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error('Non authentifié.')

  const text = await file.text()
  let raw: RawData
  try {
    raw = JSON.parse(text) as RawData
  } catch {
    throw new Error('Fichier JSON invalide.')
  }

  const entreprises = raw.entreprises ?? []
  const contacts = raw.contacts ?? []
  if (entreprises.length === 0 && contacts.length === 0) {
    throw new Error("Aucune entreprise ni contact trouvé dans le fichier (format attendu : { entreprises: [...], contacts: [...] }).")
  }

  // Entreprises d'abord (les contacts y font référence)
  let done = 0
  for (const batch of chunk(entreprises, BATCH)) {
    const rows = batch.map((e) => pick(e, ENT_COLS, userId))
    const { error } = await supabase.from('entreprises').upsert(rows, { onConflict: 'id' })
    if (error) throw new Error(`Entreprises : ${error.message}`)
    done += batch.length
    onProgress?.({ phase: 'entreprises', done, total: entreprises.length })
  }

  done = 0
  for (const batch of chunk(contacts, BATCH)) {
    const rows = batch.map((c) => pick(c, CON_COLS, userId))
    const { error } = await supabase.from('contacts').upsert(rows, { onConflict: 'id' })
    if (error) throw new Error(`Contacts : ${error.message}`)
    done += batch.length
    onProgress?.({ phase: 'contacts', done, total: contacts.length })
  }

  onProgress?.({ phase: 'termine', done: contacts.length, total: contacts.length })
  return { entreprises: entreprises.length, contacts: contacts.length }
}
