// =====================================================
// Estimation de potentiel mobile + suivi de relance
// =====================================================
import type { Entreprise } from './database.types'
import { tauxEquipement, lignesFlotte } from './flotte'

// Hypothèse de prix moyen d'une ligne mobile business Salt (CHF/mois).
// Ajustable si besoin.
export const PRIX_LIGNE_MOIS = 35

// Part estimée d'employés équipés d'une ligne mobile pro (taux d'équipement
// par secteur — cf. flotte.ts, source unique de vérité).
export function ratioMobile(e: Entreprise): number {
  return tauxEquipement(e.secteur)
}

export function lignesEstimees(e: Entreprise): number {
  return lignesFlotte(e)
}

export function valeurAnnuelle(e: Entreprise): number {
  return lignesEstimees(e) * PRIX_LIGNE_MOIS * 12
}

// --- Format CHF (séparateur suisse : apostrophe) ---------------------------
function groupe(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '’')
}
export function fmtCHF(n: number): string {
  return 'CHF ' + groupe(n)
}
export function fmtCHFk(n: number): string {
  return n >= 10000 ? 'CHF ' + groupe(Math.round(n / 1000)) + 'k' : 'CHF ' + groupe(n)
}

export function totauxPotentiel(list: { entreprise: Entreprise }[]): {
  lignes: number
  valeur: number
} {
  let lignes = 0
  let valeur = 0
  for (const { entreprise: e } of list) {
    lignes += lignesEstimees(e)
    valeur += valeurAnnuelle(e)
  }
  return { lignes, valeur }
}

// --- Relance ---------------------------------------------------------------
export type RelanceStatut = 'aucune' | 'due' | 'a_venir'

export interface RelanceInfo {
  statut: RelanceStatut
  date: Date | null
  jours: number | null // jours restants (négatif = en retard)
}

export function relanceInfo(e: Entreprise): RelanceInfo {
  const raw = e.date_prochaine_relance
  if (!raw) return { statut: 'aucune', date: null, jours: null }
  const dt = new Date(raw)
  if (Number.isNaN(dt.getTime())) return { statut: 'aucune', date: null, jours: null }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = new Date(dt)
  day.setHours(0, 0, 0, 0)
  const jours = Math.round((day.getTime() - today.getTime()) / 86400000)
  return { statut: jours <= 0 ? 'due' : 'a_venir', date: day, jours }
}

export function fmtDateCourt(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Valeur pour <input type="date"> (YYYY-MM-DD) depuis une valeur stockée.
export function toInputDate(raw: string | null): string {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Date ISO à J+n jours (à minuit), pour les boutons rapides.
export function dansNJours(n: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

// Depuis la valeur d'un <input type="date"> vers ISO stocké.
export function isoDepuisInput(v: string): string | null {
  if (!v) return null
  const d = new Date(v + 'T00:00:00')
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}
