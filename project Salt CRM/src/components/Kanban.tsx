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
import { MapPin, UserX, ShieldCheck, Sparkles, GripVertical, Bell } from 'lucide-react'
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
} from '@/lib/estimation'
import { useUpdateEntreprise } from '@/hooks/useEntreprises'
import { TierBadge } from '@/components/badges'

export interface Item {
  entreprise: EntrepriseAvecContacts
  score: ScoreDetail
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
    const t: Record<Stage, { lignes: number; valeur: number }> = {
      a_contacter: { lignes: 0, valeur: 0 },
      contactee: { lignes: 0, valeur: 0 },
      rdv: { lignes: 0, valeur: 0 },
      client: { lignes: 0, valeur: 0 },
    }
    for (const k of Object.keys(parStade) as Stage[])
      for (const it of parStade[k]) {
        t[k].lignes += lignesEstimees(it.entreprise)
        t[k].valeur += valeurAnnuelle(it.entreprise)
      }
    return t
  }, [parStade])

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
    const from = stageDe(it.entreprise)
    if (overId === from) return
    update.mutate({ id: it.entreprise.id, patch: { [STAGE_COLUMN]: overId } })
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex h-full gap-3 overflow-x-auto px-6 py-4">
        {STAGES.map((s) => (
          <Colonne
            key={s.key}
            stage={s.key}
            label={s.label}
            hint={s.hint}
            count={parStade[s.key].length}
            lignes={totaux[s.key].lignes}
            valeur={totaux[s.key].valeur}
          >
            {parStade[s.key].map((it) => (
              <Carte
                key={it.entreprise.id}
                item={it}
                active={selection === it.entreprise.id}
                onOpen={() => {
                  if (!dragged.current) onSelect(it.entreprise.id)
                }}
              />
            ))}
          </Colonne>
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? <CarteContenu item={activeItem} dragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function Colonne({
  stage,
  label,
  hint,
  count,
  lignes,
  valeur,
  children,
}: {
  stage: Stage
  label: string
  hint: string
  count: number
  lignes: number
  valeur: number
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  return (
    <div className="flex w-[300px] shrink-0 flex-col">
      <div className="mb-2 px-1">
        <div className="flex items-center gap-2">
          <span
            className={
              'h-2 w-2 rounded-full ' +
              (stage === 'client'
                ? 'bg-[var(--color-salt)]'
                : stage === 'rdv'
                  ? 'bg-amber-400'
                  : stage === 'contactee'
                    ? 'bg-sky-400'
                    : 'bg-neutral-500')
            }
          />
          <span className="text-sm font-semibold">{label}</span>
          <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[11px] font-medium text-[var(--muted-foreground)] tabular">
            {count}
          </span>
        </div>
        <div className="mt-1 pl-4 text-[11px] text-[var(--muted-foreground)] tabular">
          ≈ {lignes} lignes · <span className="text-[var(--color-salt)]">{fmtCHFk(valeur)}/an</span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={
          'flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-xl border p-2 transition ' +
          (isOver
            ? 'border-[color:rgba(30,215,96,0.5)] bg-[var(--salt-soft)]'
            : 'border-[var(--border)] bg-[var(--card)]/40')
        }
      >
        {count === 0 && (
          <div className="px-2 py-6 text-center text-[11px] text-[var(--muted-foreground)]">{hint}</div>
        )}
        {children}
      </div>
    </div>
  )
}

function Carte({ item, active, onOpen }: { item: Item; active: boolean; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.entreprise.id })
  return (
    <div
      ref={setNodeRef}
      onClick={onOpen}
      className={isDragging ? 'opacity-40' : ''}
      {...attributes}
    >
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
  const { entreprise: e, score } = item
  const decideur = e.contacts.find((c) => c.est_decideur)
  const lignes = lignesEstimees(e)
  const rel = relanceInfo(e)
  return (
    <div
      className={
        'cursor-pointer rounded-lg border bg-[var(--card-2)] p-2.5 transition ' +
        (dragging
          ? 'shadow-[var(--shadow-lg)] ring-1 ring-[color:rgba(30,215,96,0.5)]'
          : active
            ? 'border-[color:rgba(30,215,96,0.5)]'
            : 'border-[var(--border)] hover:border-[var(--border-strong)]')
      }
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{e.nom}</span>
            {estDecouverte(e) && (
              <Sparkles className="h-3 w-3 shrink-0 text-[var(--color-salt)]" />
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
            {e.ville && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5" />
                {e.ville}
              </span>
            )}
            {e.taille_employes != null && <span className="tabular">· {e.taille_employes} empl.</span>}
          </div>
        </div>
        <button
          {...(handle ?? {})}
          onClick={(ev) => ev.stopPropagation()}
          className="shrink-0 cursor-grab rounded p-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] active:cursor-grabbing"
          title="Glisser pour déplacer"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <TierBadge tier={score.tier} score={score.score} />
        {lignes > 0 && (
          <span className="text-[10px] font-medium text-[var(--muted-foreground)] tabular">
            ≈ {lignes} lignes
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-2 text-[11px]">
        {decideur ? (
          <span className="truncate text-[var(--foreground)]">
            {[decideur.prenom, decideur.nom].filter(Boolean).join(' ')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-300">
            <UserX className="h-3 w-3" /> à identifier
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
              title={rel.statut === 'due' ? 'Relance due' : 'Relance à venir'}
            >
              <Bell className="h-2.5 w-2.5" />
              {fmtDateCourt(rel.date)}
            </span>
          )}
          {e.pamela_valide && <ShieldCheck className="h-3 w-3 text-[var(--color-salt)]" />}
        </div>
      </div>
    </div>
  )
}
