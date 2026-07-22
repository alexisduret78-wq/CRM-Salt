// =====================================================
// Potentiel « flotte mobile » — audit qualité par secteur
// =====================================================
// Le nombre de lignes mobiles vendables ne dépend pas de l'effectif brut mais
// de la part d'employés qui portent réellement une ligne pro : élevée pour les
// métiers de terrain/route/interventions, faible pour l'atelier / le bureau /
// le personnel sur site. On estime : lignes ≈ effectif × taux d'équipement.
import type { Entreprise } from './database.types'

function strip(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

// Règles secteur → taux d'équipement mobile pro. Ordre = priorité (1er match).
const REGLES: Array<{ kw: string[]; taux: number }> = [
  { kw: ['securite', 'intervention rapide', 'surveillance', 'gardiennage'], taux: 0.6 },
  { kw: ['soin a domicile', 'soins a domicile', 'spitex'], taux: 0.55 },
  {
    kw: ['transport', 'demenagement', 'messagerie', 'logistique', 'taxi', 'limousine',
      'autocar', 'convois', 'frigorifique', 'transitaire', 'fret', 'chantier'],
    taux: 0.6,
  },
  { kw: ['courtage', 'courtier'], taux: 0.45 },
  { kw: ['regie', 'gerance', 'promotion immobiliere', 'immobilier'], taux: 0.5 },
  {
    kw: ['maconnerie', 'genie civil', 'serrurerie', 'metallique', 'gypserie', 'platrerie',
      'peinture', 'carrelage', 'etancheite', 'menuiserie', 'charpente', 'couverture',
      'echafaud', 'terrassement', 'travaux routiers', 'cvc', 'ventilation', 'chauffage',
      'sanitaire', 'electricite', 'electrique', 'ascenseur', 'multi-technique',
      'technique du batiment', 'facade', 'fenetre', 'renovation', 'tuyauterie', 'installation'],
    taux: 0.55,
  },
  {
    kw: ['ingenier', 'architecture', 'urbanisme', 'geometr', 'geomatique', 'bim', 'structures',
      'bureau d'],
    taux: 0.5,
  },
  { kw: ['paysag', 'horticulture', 'jardin', 'elagage', 'amenagement exterieur'], taux: 0.5 },
  { kw: ['distribution', 'commerce de gros', 'negoce', 'grossiste'], taux: 0.5 },
  { kw: ['viticulture', 'vins', 'torrefaction', 'cafe'], taux: 0.4 },
  {
    kw: ['gerant de fortune', 'gestion de fortune', 'banque', 'asset', 'wealth', 'fintech',
      'fonds', 'financ'],
    taux: 0.5,
  },
  { kw: ['fiduciaire', 'audit', 'fiscalite', 'revision', 'expertise comptable', 'conseil'], taux: 0.35 },
  { kw: ['assurance'], taux: 0.3 },
  {
    kw: ['informatique', 'esn', 'infogerance', 'managed', 'integrateur', 'ict', 'reseau',
      'telecom', 'it &', 'logiciel', 'audiovisuel'],
    taux: 0.45,
  },
  {
    kw: ['cadran', 'boite', 'bracelet', 'habillage', 'horloger', 'joaillerie', 'manufacture',
      'sertissage', 'galvano', 'microtechni'],
    taux: 0.2,
  },
  {
    kw: ['machines-outils', 'electroniqu', 'connecteur', 'capteur', 'medtech', 'dispositif',
      'cdmo', 'biotech', 'pharma', 'diagnostic', 'imagerie'],
    taux: 0.3,
  },
  { kw: ['travail temporaire', 'recrutement', 'placement', 'interim', 'emploi', 'careerplus'], taux: 0.4 },
  { kw: ['grand magasin'], taux: 0.2 },
  { kw: ['hotel', 'hotelier', 'pensionnat'], taux: 0.15 },
  { kw: ['ecole', 'institut', 'pension', 'education'], taux: 0.15 },
  { kw: ['hopital', 'clinique', 'ems', 'dentaire', 'laboratoire', 'analyses medicales'], taux: 0.18 },
  { kw: ['imprimerie', 'packaging', 'grand format'], taux: 0.3 },
  {
    kw: ['media', 'television', 'presse', 'edition', 'regie publicitaire', 'affichage', 'ooh', 'production'],
    taux: 0.35,
  },
  { kw: ['voyage', 'agence de voyages'], taux: 0.35 },
  { kw: ['traiteur', 'evenement', 'location mobilier', 'stand', 'reception'], taux: 0.3 },
  { kw: ['nettoyage', 'facility', 'proprete', 'multiservices'], taux: 0.25 },
]

const TAUX_DEFAUT = 0.35

// Part estimée d'employés équipés d'une ligne mobile pro (0-1), selon le secteur.
export function tauxEquipement(secteur: string | null): number {
  const s = strip(secteur)
  if (!s) return TAUX_DEFAUT
  for (const r of REGLES) {
    if (r.kw.some((k) => s.includes(k))) return r.taux
  }
  return TAUX_DEFAUT
}

// Nombre de lignes mobiles estimées (0 si effectif inconnu).
export function lignesFlotte(e: Entreprise): number {
  if (e.taille_employes == null) return 0
  return Math.max(0, Math.round(e.taille_employes * tauxEquipement(e.secteur)))
}

// --- Verdict potentiel flotte (cible Salt : 20+ lignes) --------------------
export type VerdictFlotte = 'fort' | 'ok' | 'qualifier' | 'faible' | 'inconnu'

export interface FlotteInfo {
  verdict: VerdictFlotte
  lignes: number
  taux: number
  label: string
}

const LABELS: Record<VerdictFlotte, string> = {
  fort: 'Potentiel fort',
  ok: 'Dans la cible',
  qualifier: 'À qualifier',
  faible: 'Faible',
  inconnu: 'Effectif inconnu',
}

export function flotteInfo(e: Entreprise): FlotteInfo {
  const taux = tauxEquipement(e.secteur)
  if (e.taille_employes == null) {
    return { verdict: 'inconnu', lignes: 0, taux, label: LABELS.inconnu }
  }
  const lignes = lignesFlotte(e)
  const verdict: VerdictFlotte =
    lignes >= 25 ? 'fort' : lignes >= 18 ? 'ok' : lignes >= 12 ? 'qualifier' : 'faible'
  return { verdict, lignes, taux, label: LABELS[verdict] }
}

export const VERDICTS_FLOTTE: VerdictFlotte[] = ['fort', 'ok', 'qualifier', 'faible', 'inconnu']
