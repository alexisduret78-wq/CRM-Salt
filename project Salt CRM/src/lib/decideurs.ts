// =====================================================
// Classement des décideurs — pertinence « flotte mobile »
// =====================================================
// Tous les contacts d'une entreprise ne se valent pas pour vendre des lignes
// mobiles. Celui qui décide n'est presque jamais le président du conseil
// d'administration : c'est le responsable IT (il gère les SIM et les
// terminaux), le directeur financier (il voit la facture) ou l'office manager
// (il gère les contrats au quotidien).
//
// Ce module attribue un score à chaque contact d'après sa fonction, et ne
// remonte que les meilleurs. Exception importante : dans une petite structure,
// il n'y a ni DSI ni DAF — le patron décide lui-même, donc on le fait remonter.

import type { EntrepriseAvecContacts } from './database.types'

type Contact = EntrepriseAvecContacts['contacts'][number]

export type CategorieDecideur =
  | 'it'
  | 'finance'
  | 'admin'
  | 'achats'
  | 'rh'
  | 'exploitation'
  | 'direction'
  | 'mandat'
  | 'inconnu'

interface Regle {
  cat: CategorieDecideur
  score: number
  kw: string[]
}

// Ordre important : la première règle qui correspond gagne. Les fonctions les
// plus spécifiques (IT, finance) sont testées avant les plus génériques
// (direction, mandat), sinon « Directeur informatique » tomberait dans
// « direction ».
const REGLES: Regle[] = [
  {
    cat: 'it',
    score: 100,
    kw: [
      'informatique', 'systeme d information', 'systemes d information',
      'cto', 'cio', 'dsi', ' it ', 'it manager', 'head of it', 'it service',
      'digital', 'numerique', 'technology', 'cyber', 'reseau',
      'responsable technique', 'directeur technique',
    ],
  },
  {
    cat: 'finance',
    score: 92,
    kw: [
      'cfo', 'financier', 'financiere', 'finance', 'daf', 'comptab',
      'controle de gestion', 'controleur', 'controlling', 'tresorerie',
    ],
  },
  {
    cat: 'admin',
    score: 86,
    kw: [
      'administratif', 'administrative', 'administration', 'office manager',
      'services generaux', 'secretaire de direction', 'assistante de direction',
      'assistant de direction', 'adjoint de direction', 'adjointe de direction',
    ],
  },
  { cat: 'achats', score: 84, kw: ['achat', 'approvisionnement', 'procurement'] },
  {
    cat: 'rh',
    score: 76,
    kw: ['ressources humaines', 'drh', ' rh ', 'human resources', 'personnel', 'talent'],
  },
  {
    cat: 'exploitation',
    score: 70,
    kw: [
      'exploitation', 'operations', 'operationnel', 'coo', 'flotte', 'parc',
      'logistique', 'chantier', 'production', 'qse',
    ],
  },
  {
    cat: 'direction',
    score: 64,
    kw: [
      'ceo', 'directeur general', 'directrice generale', 'direction generale',
      'administrateur delegue', 'patron', 'proprietaire', 'gerant', 'gerante',
      'fondateur', 'fondatrice', 'codirecteur', 'managing partner', 'directeur',
      'directrice', 'president directeur',
    ],
  },
  {
    cat: 'mandat',
    score: 30,
    kw: [
      'president du ca', 'presidente du ca', 'president du conseil',
      'vice-president', 'membre du ca', 'membre du conseil', 'administrateur',
      'administratrice', 'fonde de pouvoir', 'fondee de pouvoir',
      'fonde de procuration', 'fondee de procuration', 'secretaire', 'associe',
    ],
  },
]

function normalise(v: string | null | undefined): string {
  if (!v) return ''
  return ` ${v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `
}

// En dessous de ce seuil, il n'existe ni service IT ni direction financière :
// le patron gère la téléphonie lui-même.
const SEUIL_PETITE_STRUCTURE = 30

export interface RangDecideur {
  contact: Contact
  score: number
  categorie: CategorieDecideur
  motif: string
}

const LIBELLES: Record<CategorieDecideur, string> = {
  it: 'Gère les SIM et les terminaux',
  finance: 'Voit la facture',
  admin: 'Gère les contrats au quotidien',
  achats: 'Négocie les contrats',
  rh: 'Téléphone = avantage collaborateur',
  exploitation: 'Équipe les équipes terrain',
  direction: 'Décide',
  mandat: 'Mandat légal — utile en escalade',
  inconnu: 'Fonction inconnue',
}

function evalue(c: Contact): { score: number; cat: CategorieDecideur } {
  const f = normalise(c.fonction)
  if (!f.trim()) return { score: 20, cat: 'inconnu' }
  for (const r of REGLES) {
    if (r.kw.some((k) => f.includes(k.trim() ? ` ${k.trim()} ` : k) || f.includes(k))) {
      return { score: r.score, cat: r.cat }
    }
  }
  return { score: 25, cat: 'inconnu' }
}

/**
 * Classe les décideurs d'une entreprise du plus au moins pertinent pour une
 * offre de flotte mobile. Un contact avec une adresse email connue remonte
 * légèrement — à pertinence égale, autant écrire à quelqu'un qu'on peut joindre.
 */
export function classerDecideurs(e: EntrepriseAvecContacts): RangDecideur[] {
  const petite = e.taille_employes != null && e.taille_employes < SEUIL_PETITE_STRUCTURE

  return e.contacts
    .filter((c) => c.est_decideur)
    .map((c) => {
      const { score, cat } = evalue(c)
      let s = score
      // Petite structure : le patron est le seul décideur réel.
      if (petite && cat === 'direction') s = 105
      // Une adresse connue vaut mieux qu'une adresse à trouver.
      if (c.email) s += 3
      return { contact: c, score: s, categorie: cat, motif: LIBELLES[cat] }
    })
    .sort((a, b) => b.score - a.score)
}

/** Les 2 contacts à réellement travailler. */
export function meilleursDecideurs(e: EntrepriseAvecContacts, max = 2): RangDecideur[] {
  return classerDecideurs(e).slice(0, max)
}
