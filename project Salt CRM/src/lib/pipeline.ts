// =====================================================
// Pipeline commercial (vue Kanban) — Salt Business
// =====================================================
// Le stade du pipeline est persisté dans la colonne texte `priorite`
// (déjà présente en base, non utilisée par ailleurs) → aucune migration.
// Si la valeur est absente, on déduit un stade par défaut à partir des
// données existantes (client / déjà contactée / à contacter).

import type { Entreprise } from './database.types'

export type Stage = 'a_contacter' | 'contactee' | 'rdv' | 'client'

export const STAGES: { key: Stage; label: string; hint: string }[] = [
  { key: 'a_contacter', label: 'À contacter', hint: 'Jamais prospectée' },
  { key: 'contactee', label: 'Contactée', hint: 'Premier contact fait' },
  { key: 'rdv', label: 'RDV obtenu', hint: 'Rendez-vous planifié' },
  { key: 'client', label: 'Client', hint: 'Signé / actif' },
]

const STAGE_KEYS = new Set<string>(STAGES.map((s) => s.key))

// Colonne où l'on persiste le stade (voir en-tête de fichier).
export const STAGE_COLUMN = 'priorite' as const

export function stageDe(e: Entreprise): Stage {
  const raw = e.priorite
  if (raw && STAGE_KEYS.has(raw)) return raw as Stage
  if (e.couleur === 'vert') return 'client'
  if (e.date_dernier_contact) return 'contactee'
  return 'a_contacter'
}

export function stageLabel(s: Stage): string {
  return STAGES.find((x) => x.key === s)?.label ?? s
}
