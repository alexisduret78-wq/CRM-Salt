// =====================================================
// Inférence d'email des décideurs
// =====================================================
// Déduit l'email probable d'un décideur à partir du format constaté dans
// l'entreprise (si un contact a déjà un email) ou d'un format standard.
// TOUJOURS marqué "à confirmer" : ces adresses sont déduites, pas vérifiées.

import type { Contact, Entreprise } from './database.types'

function sansAccents(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '')
}

export function domaineDepuisSite(siteWeb: string | null): string | null {
  if (!siteWeb) return null
  try {
    const url = siteWeb.startsWith('http') ? siteWeb : `https://${siteWeb}`
    const host = new URL(url).hostname.replace(/^www\./, '')
    return host || null
  } catch {
    return null
  }
}

export type FormatEmail =
  | 'prenom.nom'
  | 'p.nom'
  | 'prenomnom'
  | 'nom.prenom'
  | 'prenom'
  | 'inconnu'

// Détecte le format d'email utilisé dans l'entreprise à partir d'un contact connu.
export function detecterFormat(contacts: Contact[]): { format: FormatEmail; domaine: string | null } {
  for (const c of contacts) {
    if (!c.email || !c.prenom || !c.nom) continue
    const [local, domaine] = c.email.toLowerCase().split('@')
    if (!local || !domaine) continue
    const p = sansAccents(c.prenom)
    const n = sansAccents(c.nom)
    if (!p || !n) continue

    if (local === `${p}.${n}`) return { format: 'prenom.nom', domaine }
    if (local === `${p[0]}.${n}`) return { format: 'p.nom', domaine }
    if (local === `${p}${n}`) return { format: 'prenomnom', domaine }
    if (local === `${n}.${p}`) return { format: 'nom.prenom', domaine }
    if (local === p) return { format: 'prenom', domaine }
  }
  return { format: 'inconnu', domaine: null }
}

export interface EmailInfere {
  email: string
  format: FormatEmail
  confiance: 'observe' | 'standard' // observé dans la boîte, ou format standard supposé
}

// Construit l'email probable d'un décideur.
export function infererEmail(
  prenom: string | null,
  nom: string | null,
  entreprise: Pick<Entreprise, 'site_web'>,
  contactsConnus: Contact[]
): EmailInfere | null {
  if (!prenom || !nom) return null
  const p = sansAccents(prenom)
  const n = sansAccents(nom)
  if (!p || !n) return null

  const detecte = detecterFormat(contactsConnus)
  const domaine = detecte.domaine ?? domaineDepuisSite(entreprise.site_web)
  if (!domaine) return null

  const format: FormatEmail = detecte.format === 'inconnu' ? 'prenom.nom' : detecte.format
  const confiance = detecte.format === 'inconnu' ? 'standard' : 'observe'

  let local: string
  switch (format) {
    case 'p.nom':
      local = `${p[0]}.${n}`
      break
    case 'prenomnom':
      local = `${p}${n}`
      break
    case 'nom.prenom':
      local = `${n}.${p}`
      break
    case 'prenom':
      local = p
      break
    case 'prenom.nom':
    default:
      local = `${p}.${n}`
      break
  }

  return { email: `${local}@${domaine}`, format, confiance }
}
