// =====================================================
// Moteur de priorisation Prospection — Salt Business Mobile
// =====================================================
// Objectif : faire remonter en tête les entreprises à fort potentiel
// pour des lignes mobiles Salt Business, en priorisant celles qui sont :
//   1. pas encore prospectées,
//   2. prospectées il y a longtemps,
//   3. sans les bons interlocuteurs (décideurs) identifiés.
// Zone cible : Genève + périphérie + côte lémanique jusqu'à Morges.

import type { Entreprise, EntrepriseAvecContacts } from './database.types'

// --- Zone géographique cible ------------------------------------------------

// Communes vaudoises de la côte (La Côte, Genève → Morges) acceptées en plus du canton GE.
const VILLES_COTE_VD = new Set(
  [
    'morges',
    'nyon',
    'gland',
    'rolle',
    'coppet',
    'founex',
    'commugny',
    'mies',
    'tannay',
    'crans-pres-celigny',
    'prangins',
    'aubonne',
    'begnins',
    'gilly',
    'bursins',
    'vich',
    'duillier',
    'signy',
    'signy-avenex',
    'chavannes-de-bogis',
    'chavannes-des-bois',
    'borex',
    'crassier',
    'eysins',
    'grens',
    'trelex',
    'genolier',
    'saint-cergue',
    'arzier',
    'bogis-bossey',
    'cheserex',
    'givrins',
    'gingins',
    'la rippe',
    'saint-prex',
    'lonay',
    'preverenges',
    'echichens',
    'tolochenaz',
    'lully',
    'denens',
    'vufflens-le-chateau',
  ].map((v) => v)
)

function normalise(v: string | null | undefined): string {
  if (!v) return ''
  return v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // enlève les accents
    .trim()
}

export function estDansZone(e: { ville: string | null; canton: string | null }): boolean {
  const canton = normalise(e.canton)
  if (canton === 'ge' || canton === 'geneve' || canton === 'ge (geneve)') return true
  const ville = normalise(e.ville)
  if (!ville) return false
  if (VILLES_COTE_VD.has(ville)) return true
  // tolérance : "Carouge GE", "Genève", "Geneva"...
  return ville.includes('geneva') || ville.includes('geneve')
}

// --- Besoin de téléphonie mobile d'entreprise (par secteur) -----------------

// Secteurs à forte main-d'œuvre mobile / terrain → besoin élevé en lignes mobiles.
const SECTEURS_MOBILITE_FORTE = [
  'construction',
  'real estate',
  'immob',
  'logistic',
  'transport',
  'retail',
  'wholesale',
  'hospitality',
  'hotel',
  'restaurant',
  'food',
  'security',
  'facility',
  'cleaning',
  'health',
  'medical',
  'pharma',
  'automotive',
  'energy',
  'utilities',
  'manufacturing',
  'industrial',
  'engineering',
  'field',
  'trades',
  'event',
]

// Secteurs plutôt sédentaires (bureau) → besoin plus modéré.
const SECTEURS_MOBILITE_MODEREE = [
  'finance',
  'bank',
  'insurance',
  'legal',
  'law',
  'accounting',
  'consulting',
  'software',
  'it ',
  'information technology',
  'marketing',
  'media',
]

export type NiveauMobilite = 'fort' | 'modere' | 'inconnu'

export function niveauMobilite(secteur: string | null): NiveauMobilite {
  const s = normalise(secteur)
  if (!s) return 'inconnu'
  if (SECTEURS_MOBILITE_FORTE.some((k) => s.includes(k))) return 'fort'
  if (SECTEURS_MOBILITE_MODEREE.some((k) => s.includes(k))) return 'modere'
  return 'inconnu'
}

// --- Statut de contact ------------------------------------------------------

export type StatutContact = 'jamais' | 'ancien' | 'recent'

const JOURS_ANCIEN = 180

export function joursDepuisDernierContact(dateDernierContact: string | null): number | null {
  if (!dateDernierContact) return null
  const d = new Date(dateDernierContact)
  if (Number.isNaN(d.getTime())) return null
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function statutContact(e: EntrepriseAvecContacts): StatutContact {
  const jours = joursDepuisDernierContact(e.date_dernier_contact)
  if (jours === null) return 'jamais'
  return jours > JOURS_ANCIEN ? 'ancien' : 'recent'
}

// --- Interlocuteurs (décideurs) --------------------------------------------

export type StatutInterlocuteur = 'aucun' | 'sans_email' | 'complet'

export function statutInterlocuteur(e: EntrepriseAvecContacts): StatutInterlocuteur {
  const decideurs = e.contacts.filter((c) => c.est_decideur)
  if (decideurs.length === 0) return 'aucun'
  if (decideurs.some((c) => c.email)) return 'complet'
  return 'sans_email'
}

// --- Score global -----------------------------------------------------------

export interface ScoreDetail {
  score: number // 0-100
  tier: 'A' | 'B' | 'C'
  raisons: string[] // libellés courts expliquant la priorité
  statutContact: StatutContact
  statutInterlocuteur: StatutInterlocuteur
  mobilite: NiveauMobilite
}

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n))

// --- Découverte Claude ------------------------------------------------------
// Une entreprise est une "découverte" si son origine est 'claude' OU si son
// `source_fichier` commence par "Découverte Claude" (robustesse : certains
// imports n'ont pas renseigné la colonne origine).
export function estDecouverte(e: Entreprise): boolean {
  if (e.origine === 'claude') return true
  // Robustesse : certains imports n'ont pas renseigné `origine`. On reconnaît
  // alors la découverte via ses autres marqueurs "Découverte Claude".
  const hay = `${e.source_fichier ?? ''} ${e.statut_pamela_origine ?? ''} ${e.notes_consolidees ?? ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // enlève accents
  return hay.includes('decouverte claude')
}

// --- Segment / famille de découverte ---------------------------------------
// Les découvertes Claude portent leur famille dans `source_fichier`
// (ex. "Découverte Claude v4 — Pharma & Biotech"). On l'extrait pour filtrer.
export function segmentDe(e: Entreprise): string | null {
  const sf = e.source_fichier ?? ''
  // On sépare uniquement sur un tiret/point médian ENTOURÉ d'espaces
  // (sinon "sous-traitance" serait coupé sur son trait d'union interne).
  const m = sf.split(/\s+[—–·-]\s+/).map((s) => s.trim()).filter(Boolean)
  if (estDecouverte(e) && m.length > 1) {
    const last = m[m.length - 1]
    // évite de retourner "v4" ou "Claude v4"
    if (last && !/^v?\d+$/i.test(last) && !/claude/i.test(last)) return last
  }
  return null
}

export function scorerEntreprise(e: EntrepriseAvecContacts): ScoreDetail {
  const raisons: string[] = []
  let score = 0

  // 1) Potentiel taille (les lignes mobiles se vendent au volume d'employés)
  const taille = e.taille_employes
  if (taille != null) {
    if (taille >= 250) {
      score += 30
      raisons.push(`${taille} employés (grand compte)`)
    } else if (taille >= 100) {
      score += 25
      raisons.push(`${taille} employés`)
    } else if (taille >= 50) {
      score += 18
      raisons.push(`${taille} employés`)
    } else {
      score += 4
    }
  } else {
    score += 8 // inconnu : ni pénalisé, ni favorisé
  }

  // 2) Statut de contact — cœur de la demande
  const sc = statutContact(e)
  if (sc === 'jamais') {
    score += 30
    raisons.push('Jamais prospectée')
  } else if (sc === 'ancien') {
    const j = joursDepuisDernierContact(e.date_dernier_contact)
    score += 20
    raisons.push(`Contact ancien (${j ? Math.round(j / 30) : '?'} mois)`)
  }

  // 3) Interlocuteurs — "pas les bons interlocuteurs"
  const si = statutInterlocuteur(e)
  if (si === 'aucun') {
    score += 16
    raisons.push('Aucun décideur identifié')
  } else if (si === 'sans_email') {
    score += 9
    raisons.push('Décideur sans email')
  }

  // 4) Besoin mobile par secteur
  const mob = niveauMobilite(e.secteur)
  if (mob === 'fort') {
    score += 15
    raisons.push('Secteur à forte mobilité')
  } else if (mob === 'modere') {
    score += 8
  } else {
    score += 4
  }

  // 5) Typologie / couleur
  if (e.typologie === 'prospect_mobile') score += 10
  switch (e.couleur) {
    case 'rouge':
      score += 5
      break
    case 'jaune':
      score += 3
      break
    case 'blanc':
      score += 6
      break
    case 'vert':
      // déjà client / gagné → hors logique de nouvelle prospection
      score -= 20
      raisons.push('Déjà client (vert)')
      break
  }

  score = clamp(score)

  const tier: ScoreDetail['tier'] = score >= 65 ? 'A' : score >= 45 ? 'B' : 'C'

  return {
    score,
    tier,
    raisons,
    statutContact: sc,
    statutInterlocuteur: si,
    mobilite: mob,
  }
}
