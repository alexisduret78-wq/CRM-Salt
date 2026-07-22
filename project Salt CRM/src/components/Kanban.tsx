import { useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  MapPin,
  UserX,
  ShieldCheck,
  Sparkles,
  GripVertical,
  Bell,
  Layers,
} from 'lucide-react'
import type { EntrepriseAvecContacts } from '@/lib/database.types'
import type { ScoreDetail } from '@/lib/scoring'
import { estDecouverte } from '@/lib/scoring'
import { STAGES, stageDe, STAGE_COLUMN, type Stage } from '@/lib/pipeline'
import {
  lignesEstimees,
  valeurAnnuelle,
  fmtCHFk,
  relanceInfo,
  fmtDateCourt,
  totauxPotentiel,
} from '@/lib/estimation'
import { useUpdateEntreprise } from '@/hooks/useEntreprises'
import { TierBadge, UidBadge, SiegeBadge } from '@/components/badges'

export interface Item {
  entreprise: EntrepriseAvecContacts
  score: ScoreDetail
}

const MAX_CARTES = 300 // garde-fou de perf pour l'affichage central

const STAGE_DOT: Record<Stage, string> = {
  a_contacter: 'bg-neutral-500',
  contactee: 'bg-sky-400',
  rdv: 'bg-amber-400',
  client: 'bg-[var(--color-salt)]',
}

export function Kanban({
  items,
  selection,
  onSelect,
}: {
  items: Item[]
  selection: string | null
  onSelect: (id: string) => void
}) {
  const update = useUpdateEntreprise()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [etape, setEtape] = useState<Stage | 'toutes'>('toutes')
  const dragged = useRef(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const parStade = useMemo(() => {
    const map: Record<Stage, Item[]> = { a_contacter: [], contactee: [], rdv: [], client: [] }
    for (const it of items) map[stageDe(it.entreprise)].push(it)
    for (const k of Object.keys(map) as Stage[])
      map[k].sort((a, b) => b.score.score - a.score.score)
    return map
  }, [items])

  const totaux = useMemo(() => {
    const t: Record<Stage, { count: number; lignes: number; valeur: number }> = {
      a_contacter: { count: 0, lignes: 0, valeur: 0 },
      contactee: { count: 0, lignes: 0, valeur: 0 },
      rdv: { count: 0, lignes: 0, valeur: 0 },
      client: { count: 0, lignes: 0, valeur: 0 },
    }
    for (const k of Object.keys(parStade) as Stage[]) {
      t[k].count = parStade[k].length
      for (const it of parStade[k]) {
        t[k].lignes += lignesEstimees(it.entreprise)
        t[k].valeur += valeurAnnuelle(it.entreprise)
      }
    }
    return t
  }, [parStade])

  const liste = useMemo(() => {
    if (etape === 'toutes')
      return [...items].sort((a, b) => b.score.score - a.score.score)
    return parStade[etape]
  }, [etape, items, parStade])

  const pot = useMemo(() => totauxPotentiel(liste), [liste])
  const visibles = liste.slice(0, MAX_CARTES)
  const activeItem = activeId ? items.find((i) => i.entreprise.id === activeId) ?? null : null

  function onDragStart(e: DragStartEvent) {
    dragged.current = true
    setActiveId(String(e.active.id))
  }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null)
    setTimeout(() => (dragged.current = false), 50)
    const overId = e.over?.id ? String(e.over.id) : null
    if (!overId) return
    const it = items.find((i) => i.entreprise.id === String(e.active.id))
    if (!it) return
    if (overId === stageDe(it.entreprise)) return
    update.mutate({ id: it.entreprise.id, patch: { [STAGE_COLUMN]: overId } })
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex h-full">
        {/* Rail pipeline (gauche) */}
        <aside className="hidden w-64 shrink-0 flex-col gap-2 overflow-y-auto border-r border-[var(--border)] bg-[var(--card)]/40 p-3 md:flex">
          <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Pipeline
          </div>

          <RailItem
            label="Toutes les étapes"
            count={items.length}
            active={etape === 'toutes'}
            onClick={() => setEtape('toutes')}
            icon={<Layers className="h-4 w-4" />}
          />

          {STAGES.map((s) => (
            <StageRailItem
              key={s.key}
              stage={s.key}
              label={s.label}
              hint={s.hint}
              count={totaux[s.key].count}
              lignes={totaux[s.key].lignes}
              valeur={totaux[s.key].valeur}
              active={etape === s.key}
              onClick={() => setEtape(s.key)}
            />
          ))}
        </aside>

        {/* Colonne centrale : entreprises */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-2.5">
            <div className="text-sm">
              <span className="font-semibold">
                {etape === 'toutes' ? 'Toutes les étapes' : STAGES.find((s) => s.key === etape)?.label}
              </span>
              <span className="ml-2 text-xs text-[var(--muted-foreground)] tabular">
                {liste.length} entreprise(s) · ≈ {pot.lignes} lignes ·{' '}
                <span className="text-[var(--color-salt)]">{fmtCHFk(pot.valeur)}/an</span>
              </span>
            </div>
            <span className="hidden text-[11px] text-[var(--muted-foreground)] sm:inline">
              Glisse une carte vers une étape à gauche pour la déplacer
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {liste.length === 0 ? (
              <div className="py-16 text-center text-sm text-[var(--muted-foreground)]">
                Aucune entreprise dans cette étape.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                {visibles.map((it) => (
                  <Carte
                    key={it.entreprise.id}
                    item={it}
                    active={selection === it.entreprise.id}
                    onOpen={() => {
                      if (!dragged.current) onSelect(it.entreprise.id)
                    }}
                  />
                ))}
              </div>
            )}
            {liste.length > MAX_CARTES && (
              <div className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
                {liste.length - MAX_CARTES} autres non affichées — affine les filtres pour les voir.
              </div>
            )}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? <CarteContenu item={activeItem} dragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}

// --- Rail (gauche) ----------------------------------------------------------

function RailItem({
  label,
  count,
  active,
  onClick,
  icon,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={
        'flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ' +
        (active
          ? 'border-[color:rgba(30,215,96,0.5)] bg-[var(--salt-soft)] text-[var(--foreground)]'
          : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]')
      }
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </span>
      <span className="tabular text-xs font-semibold">{count}</span>
    </button>
  )
}

function StageRailItem({
  stage,
  label,
  hint,
  count,
  lignes,
  valeur,
  active,
  onClick,
}: {
  stage: Stage
  label: string
  hint: string
  count: number
  lignes: number
  valeur: number
  active: boolean
  onClick: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={
        'rounded-xl border p-3 text-left transition ' +
        (isOver
          ? 'border-[color:rgba(30,215,96,0.7)] bg-[var(--salt-soft-strong)] shadow-[var(--shadow-glow)]'
          : active
            ? 'border-[color:rgba(30,215,96,0.45)] bg-[var(--salt-soft)]'
            : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-strong)]')
      }
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className={'h-2 w-2 rounded-full ' + STAGE_DOT[stage]} />
          {label}
        </span>
        <span className="tabular rounded-full bg-white/8 px-1.5 text-[11px] font-semibold text-[var(--muted-foreground)]">
          {count}
        </span>
      </div>
      <div className="mt-1.5 pl-4 text-[11px] text-[var(--muted-foreground)] tabular">
        ≈ {lignes} lignes
      </div>
      <div className="pl-4 text-[11px] font-medium text-[var(--color-salt)] tabular">
        {fmtCHFk(valeur)}/an
      </div>
      {isOver && (
        <div className="mt-1.5 pl-4 text-[10px] font-medium text-[var(--color-salt)]">
          Déposer ici → {hint.toLowerCase()}
        </div>
      )}
    </button>
  )
}

// --- Carte entreprise (centre) ---------------------------------------------

function Carte({ item, active, onOpen }: { item: Item; active: boolean; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.entreprise.id })
  return (
    <div ref={setNodeRef} onClick={onOpen} className={isDragging ? 'opacity-40' : ''} {...attributes}>
      <CarteContenu item={item} active={active} handle={listeners} />
    </div>
  )
}

function CarteContenu({
  item,
  active,
  dragging,
  handle,
}: {
  item: Item
  active?: boolean
  dragging?: boolean
  handle?: Record<string, unknown>
}) {
  const update = useUpdateEntreprise()
  const { entreprise: e, score } = item
  const decideur = e.contacts.find((c) => c.est_decideur)
  const lignes = lignesEstimees(e)
  const rel = relanceInfo(e)
  const stage = stageDe(e)

  return (
    <div
      className={
        'group cursor-pointer rounded-xl border bg-[var(--card-2)] p-3 transition ' +
        (dragging
          ? 'shadow-[var(--shadow-lg)] ring-1 ring-[color:rgba(30,215,96,0.6)]'
          : active
            ? 'border-[color:rgba(30,215,96,0.5)]'
            : 'border-[var(--border)] hover:border-[var(--border-strong)]')
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={'h-2 w-2 shrink-0 rounded-full ' + STAGE_DOT[stage]} />
            <span className="truncate text-sm font-semibold">{e.nom}</span>
            {estDecouverte(e) && <Sparkles className="h-3 w-3 shrink-0 text-[var(--color-salt)]" />}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 pl-3.5 text-[11px] text-[var(--muted-foreground)]">
            {e.ville && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5" />
                {e.ville}
              </span>
            )}
            {e.taille_employes != null && <span className="tabular">· {e.taille_employes} empl.</span>}
            {e.business_uid && <UidBadge uid={e.business_uid} />}
            <SiegeBadge uid={e.business_uid} />
          </div>
        </div>
        <button
          {...(handle ?? {})}
          onClick={(ev) => ev.stopPropagation()}
          className="shrink-0 cursor-grab rounded p-0.5 text-[var(--muted-foreground)] opacity-0 transition group-hover:opacity-100 hover:text-[var(--foreground)] active:cursor-grabbing"
          title="Glisser vers une étape"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <TierBadge tier={score.tier} score={score.score} />
        <span className="text-[11px] font-medium text-[var(--muted-foreground)] tabular">
          ≈ {lignes} lignes · <span className="text-[var(--color-salt)]">{fmtCHFk(valeurAnnuelle(e))}/an</span>
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-2.5 text-[11px]">
        {decideur ? (
          <span className="truncate text-[var(--foreground)]">
            {[decideur.prenom, decideur.nom].filter(Boolean).join(' ')}
            {decideur.fonction && (
              <span className="text-[var(--muted-foreground)]"> · {decideur.fonction}</span>
            )}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-300">
            <UserX className="h-3 w-3" /> décideur à identifier
          </span>
        )}
        <div className="flex shrink-0 items-center gap-1.5">
          {rel.statut !== 'aucune' && rel.date && (
            <span
              className={
                'inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium ' +
                (rel.statut === 'due'
                  ? 'bg-amber-400/15 text-amber-300'
                  : 'bg-white/5 text-[var(--muted-foreground)]')
              }
            >
              <Bell className="h-2.5 w-2.5" />
              {rel.statut === 'due' ? 'relance' : fmtDateCourt(rel.date)}
            </span>
          )}
          <button
            onClick={(ev) => {
              ev.stopPropagation()
              update.mutate({ id: e.id, patch: { pamela_valide: !e.pamela_valide } })
            }}
            title={e.pamela_valide ? 'Pamela validé — cliquer pour retirer' : 'Marquer validé dans Pamela'}
            className={
              'inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium transition ' +
              (e.pamela_valide
                ? 'bg-[var(--salt-soft)] text-[var(--color-salt)] hover:bg-[var(--salt-soft-strong)]'
                : 'bg-white/5 text-[var(--muted-foreground)] hover:text-[var(--color-salt)]')
            }
          >
            <ShieldCheck className="h-2.5 w-2.5" />
            {e.pamela_valide ? 'Validé' : 'Pamela'}
          </button>
        </div>
      </div>
    </div>
  )
}
