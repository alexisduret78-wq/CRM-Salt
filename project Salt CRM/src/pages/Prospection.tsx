import { useMemo, useState } from 'react'
import {
  Search,
  MapPin,
  Users,
  AlertCircle,
  Sparkles,
  FolderOpen,
  Layers,
  ShieldCheck,
  UserX,
  Flame,
  X,
  SlidersHorizontal,
  Rows3,
  Columns3,
  Bell,
} from 'lucide-react'
import { useEntreprises, useUpdateEntreprise } from '@/hooks/useEntreprises'
import { estDansZone, estDecouverte, scorerEntreprise, segmentDe, type ScoreDetail } from '@/lib/scoring'
import { relanceInfo, totauxPotentiel, fmtCHFk, fmtDateCourt } from '@/lib/estimation'
import type { EntrepriseAvecContacts } from '@/lib/database.types'
import { TierBadge } from '@/components/badges'
import { EntrepriseDetail } from '@/components/EntrepriseDetail'
import { ImportBanner } from '@/components/ImportBanner'
import { Kanban } from '@/components/Kanban'

type StatutFiltre = 'tous' | 'jamais' | 'ancien' | 'recent'
type PamelaFiltre = 'tous' | 'valide' | 'non_valide'
type SourceFiltre = 'toutes' | 'fichiers' | 'claude'
type TierFiltre = 'tous' | 'A' | 'B' | 'C'
type Tri = 'priorite' | 'taille' | 'nom'
type Vue = 'liste' | 'kanban'

export interface EntrepriseScoree {
  entreprise: EntrepriseAvecContacts
  score: ScoreDetail
}

export default function Prospection() {
  const { data, isLoading, error } = useEntreprises()

  const [recherche, setRecherche] = useState('')
  const [zoneUniquement, setZoneUniquement] = useState(true)
  const [tailleMin, setTailleMin] = useState(50)
  const [statut, setStatut] = useState<StatutFiltre>('tous')
  const [sansDecideur, setSansDecideur] = useState(false)
  const [relanceDue, setRelanceDue] = useState(false)
  const [pamela, setPamela] = useState<PamelaFiltre>('tous')
  const [source, setSource] = useState<SourceFiltre>('claude')
  const [segment, setSegment] = useState<string>('tous')
  const [canton, setCanton] = useState<string>('tous')
  const [tier, setTier] = useState<TierFiltre>('tous')
  const [masquerClients, setMasquerClients] = useState(true)
  const [tri, setTri] = useState<Tri>('priorite')
  const [vue, setVue] = useState<Vue>('liste')
  const [plusDeFiltres, setPlusDeFiltres] = useState(false)
  const [selection, setSelection] = useState<string | null>(null)

  const scorees = useMemo<EntrepriseScoree[]>(() => {
    if (!data) return []
    return data.map((entreprise) => ({ entreprise, score: scorerEntreprise(entreprise) }))
  }, [data])

  const scope = useMemo(() => {
    return scorees.filter(({ entreprise: e }) => {
      if (source === 'claude' && !estDecouverte(e)) return false
      if (source === 'fichiers' && estDecouverte(e)) return false
      if (masquerClients && e.couleur === 'vert') return false
      if (zoneUniquement && !estDansZone(e)) return false
      return true
    })
  }, [scorees, source, masquerClients, zoneUniquement])

  const segments = useMemo(() => {
    const s = new Set<string>()
    for (const { entreprise: e } of scope) {
      const seg = segmentDe(e)
      if (seg) s.add(seg)
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [scope])

  const cantons = useMemo(() => {
    const c = new Set<string>()
    for (const { entreprise: e } of scope) if (e.canton) c.add(e.canton.trim().toUpperCase())
    return [...c].sort()
  }, [scope])

  const compteSource = useMemo(() => {
    const base = scorees.filter(({ entreprise: e }) => {
      if (masquerClients && e.couleur === 'vert') return false
      if (zoneUniquement && !estDansZone(e)) return false
      return true
    })
    let claude = 0
    for (const { entreprise: e } of base) if (estDecouverte(e)) claude++
    return { claude, fichiers: base.length - claude, toutes: base.length }
  }, [scorees, masquerClients, zoneUniquement])

  const kpis = useMemo(
    () => ({
      total: scope.length,
      prioA: scope.filter((s) => s.score.tier === 'A').length,
      sansDecideur: scope.filter((s) => s.score.statutInterlocuteur === 'aucun').length,
      aRelancer: scope.filter((s) => relanceInfo(s.entreprise).statut === 'due').length,
      pamelaAValider: scope.filter((s) => !s.entreprise.pamela_valide).length,
    }),
    [scope]
  )

  // Base : tous les filtres SAUF le statut de contact (utilisée par le Kanban).
  const filtreesBase = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    const list = scope.filter(({ entreprise: e, score }) => {
      if (segment !== 'tous' && segmentDe(e) !== segment) return false
      if (canton !== 'tous' && (e.canton ?? '').trim().toUpperCase() !== canton) return false
      if (tier !== 'tous' && score.tier !== tier) return false
      if (e.taille_employes != null && e.taille_employes < tailleMin) return false
      if (e.taille_employes == null && tailleMin > 50) return false
      if (sansDecideur && score.statutInterlocuteur !== 'aucun') return false
      if (relanceDue && relanceInfo(e).statut !== 'due') return false
      if (pamela === 'valide' && !e.pamela_valide) return false
      if (pamela === 'non_valide' && e.pamela_valide) return false
      if (q) {
        const seg = segmentDe(e) ?? ''
        const hay = `${e.nom} ${e.ville ?? ''} ${e.secteur ?? ''} ${seg}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    return list.sort((a, b) => {
      if (tri === 'taille')
        return (b.entreprise.taille_employes ?? 0) - (a.entreprise.taille_employes ?? 0)
      if (tri === 'nom') return a.entreprise.nom.localeCompare(b.entreprise.nom, 'fr')
      return b.score.score - a.score.score
    })
  }, [scope, recherche, segment, canton, tier, tailleMin, sansDecideur, relanceDue, pamela, tri])

  const potentiel = useMemo(() => totauxPotentiel(filtreesBase), [filtreesBase])

  // Liste : on applique en plus le statut de contact.
  const filtreesListe = useMemo(
    () =>
      statut === 'tous'
        ? filtreesBase
        : filtreesBase.filter((f) => f.score.statutContact === statut),
    [filtreesBase, statut]
  )

  const selectionnee = filtreesBase.find((f) => f.entreprise.id === selection) ?? null

  const nbFiltresActifs =
    (segment !== 'tous' ? 1 : 0) +
    (canton !== 'tous' ? 1 : 0) +
    (tier !== 'tous' ? 1 : 0) +
    (statut !== 'tous' ? 1 : 0) +
    (pamela !== 'tous' ? 1 : 0) +
    (sansDecideur ? 1 : 0) +
    (relanceDue ? 1 : 0)

  function reset() {
    setSegment('tous')
    setCanton('tous')
    setTier('tous')
    setStatut('tous')
    setPamela('tous')
    setSansDecideur(false)
    setRelanceDue(false)
    setRecherche('')
  }

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* En-tête */}
        <div className="border-b bg-[var(--card)] px-6 pt-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                {source === 'claude' ? (
                  <>
                    <Sparkles className="h-5 w-5 text-[var(--color-salt)]" />
                    Découvertes — nouvelles cibles
                  </>
                ) : source === 'fichiers' ? (
                  <>
                    <FolderOpen className="h-5 w-5" />
                    Mes fichiers
                  </>
                ) : (
                  'Prospection'
                )}
              </h1>
              <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                {source === 'claude'
                  ? 'Entreprises jamais contactées, ≥ 20 lignes mobiles potentielles, zone GE + La Côte.'
                  : source === 'fichiers'
                    ? 'Tes comptes déjà en portefeuille, reclassés par priorité.'
                    : 'Toutes les cibles, classées par priorité de contact.'}
              </p>
            </div>
            {!isLoading && scorees.length > 0 && <ImportBanner vide={false} />}
          </div>

          {/* Source + vue */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <SourceTab
                active={source === 'claude'}
                onClick={() => setSource('claude')}
                icon={<Sparkles className="h-4 w-4" />}
                count={compteSource.claude}
              >
                Découvertes
              </SourceTab>
              <SourceTab
                active={source === 'fichiers'}
                onClick={() => setSource('fichiers')}
                icon={<FolderOpen className="h-4 w-4" />}
                count={compteSource.fichiers}
              >
                Mes fichiers
              </SourceTab>
              <SourceTab
                active={source === 'toutes'}
                onClick={() => setSource('toutes')}
                icon={<Layers className="h-4 w-4" />}
                count={compteSource.toutes}
              >
                Toutes
              </SourceTab>
            </div>

            <div className="inline-flex rounded-full border bg-[var(--card)] p-0.5">
              <VueBtn active={vue === 'liste'} onClick={() => setVue('liste')} icon={<Rows3 className="h-4 w-4" />}>
                Liste
              </VueBtn>
              <VueBtn active={vue === 'kanban'} onClick={() => setVue('kanban')} icon={<Columns3 className="h-4 w-4" />}>
                Kanban
              </VueBtn>
            </div>
          </div>

          {/* KPI */}
          <div className="mt-4 grid grid-cols-2 gap-3 pb-4 md:grid-cols-3 lg:grid-cols-5">
            <Kpi label="Cibles en zone" value={kpis.total} icon={<Layers className="h-4 w-4" />} onClick={reset} />
            <Kpi
              label="Priorité A"
              value={kpis.prioA}
              icon={<Flame className="h-4 w-4" />}
              tone="salt"
              active={tier === 'A'}
              onClick={() => setTier(tier === 'A' ? 'tous' : 'A')}
            />
            <Kpi
              label="À relancer"
              value={kpis.aRelancer}
              icon={<Bell className="h-4 w-4" />}
              tone="amber"
              active={relanceDue}
              onClick={() => setRelanceDue(!relanceDue)}
            />
            <Kpi
              label="Sans décideur"
              value={kpis.sansDecideur}
              icon={<UserX className="h-4 w-4" />}
              tone="amber"
              active={sansDecideur}
              onClick={() => setSansDecideur(!sansDecideur)}
            />
            <Kpi
              label="Pamela à valider"
              value={kpis.pamelaAValider}
              icon={<ShieldCheck className="h-4 w-4" />}
              tone="salt"
              active={pamela === 'non_valide'}
              onClick={() => setPamela(pamela === 'non_valide' ? 'tous' : 'non_valide')}
            />
          </div>
        </div>

        {/* Filtres */}
        <div className="border-b bg-[var(--card)] px-6 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher nom, ville, secteur, segment…"
                className="w-72 rounded-lg border bg-[var(--background)] py-2 pl-8 pr-3 text-sm outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--color-salt)] focus:ring-2 focus:ring-[color:var(--salt-soft-strong)]"
              />
            </div>

            {segments.length > 0 && (
              <Select value={segment} onChange={setSegment} label="Segment">
                <option value="tous">Tous les segments</option>
                {segments.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            )}

            {cantons.length > 1 && (
              <Select value={canton} onChange={setCanton} label="Canton">
                <option value="tous">GE + VD (Côte)</option>
                {cantons.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            )}

            <label className="inline-flex items-center gap-1.5 rounded-lg border bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--muted-foreground)]">
              <Users className="h-4 w-4" />≥
              <input
                type="number"
                value={tailleMin}
                min={0}
                step={10}
                onChange={(e) => setTailleMin(Number(e.target.value) || 0)}
                className="w-14 bg-transparent text-sm text-[var(--foreground)] outline-none tabular"
              />
              empl.
            </label>

            <button
              type="button"
              onClick={() => setPlusDeFiltres((v) => !v)}
              className={
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-sm font-medium transition ' +
                (plusDeFiltres || nbFiltresActifs > 0
                  ? 'border-[color:rgba(30,215,96,0.4)] bg-[var(--salt-soft)] text-[var(--color-salt)]'
                  : 'bg-[var(--background)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]')
              }
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
              {nbFiltresActifs > 0 && (
                <span className="rounded-full bg-[var(--color-salt)] px-1.5 text-[10px] font-bold text-[var(--color-salt-ink)]">
                  {nbFiltresActifs}
                </span>
              )}
            </button>

            <div className="ml-auto">
              <Select value={tri} onChange={(v) => setTri(v as Tri)} label="Trier">
                <option value="priorite">Priorité ↓</option>
                <option value="taille">Effectif ↓</option>
                <option value="nom">Nom A→Z</option>
              </Select>
            </div>
          </div>

          {plusDeFiltres && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3 animate-fadein">
              <Segmented
                value={tier}
                onChange={(v) => setTier(v as TierFiltre)}
                options={[
                  { value: 'tous', label: 'Toutes prio' },
                  { value: 'A', label: 'A' },
                  { value: 'B', label: 'B' },
                  { value: 'C', label: 'C' },
                ]}
              />
              {vue === 'liste' && (
                <Segmented
                  value={statut}
                  onChange={(v) => setStatut(v as StatutFiltre)}
                  options={[
                    { value: 'tous', label: 'Tout contact' },
                    { value: 'jamais', label: 'Jamais contactée' },
                    { value: 'ancien', label: 'Contact ancien' },
                    { value: 'recent', label: 'Contact récent' },
                  ]}
                />
              )}
              <Segmented
                value={pamela}
                onChange={(v) => setPamela(v as PamelaFiltre)}
                options={[
                  { value: 'tous', label: 'Pamela : tout' },
                  { value: 'valide', label: 'Validé' },
                  { value: 'non_valide', label: 'À valider' },
                ]}
              />
              <Toggle checked={sansDecideur} onChange={setSansDecideur}>
                Sans décideur
              </Toggle>
              <Toggle checked={relanceDue} onChange={setRelanceDue} icon={<Bell className="h-3.5 w-3.5" />}>
                À relancer
              </Toggle>
              <Toggle checked={zoneUniquement} onChange={setZoneUniquement} icon={<MapPin className="h-3.5 w-3.5" />}>
                Zone GE + Côte
              </Toggle>
              <Toggle checked={masquerClients} onChange={setMasquerClients}>
                Masquer clients
              </Toggle>
              {nbFiltresActifs > 0 && (
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--color-salt)]"
                >
                  <X className="h-3.5 w-3.5" /> Réinitialiser
                </button>
              )}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-[var(--muted-foreground)]">
            <span>
              {isLoading
                ? 'Chargement…'
                : vue === 'kanban'
                  ? `${filtreesBase.length} entreprise(s) · glisse les cartes pour faire avancer le pipeline`
                  : `${filtreesListe.length} entreprise(s) · triées par ${triLabel(tri)}`}
            </span>
            {!isLoading && potentiel.lignes > 0 && (
              <span className="tabular">
                · potentiel ≈ {potentiel.lignes} lignes ·{' '}
                <span className="font-medium text-[var(--color-salt)]">
                  {fmtCHFk(potentiel.valeur)}/an
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Contenu */}
        <div className="min-h-0 flex-1 overflow-hidden bg-[var(--background)]">
          {error && (
            <div className="flex items-center gap-2 p-6 text-sm text-red-400">
              <AlertCircle className="h-4 w-4" />
              Erreur de chargement : {(error as Error).message}
            </div>
          )}

          {!isLoading && !error && scorees.length === 0 && (
            <div className="p-10">
              <ImportBanner vide />
            </div>
          )}

          {!isLoading && !error && scorees.length > 0 && vue === 'kanban' && (
            <Kanban items={filtreesBase} selection={selection} onSelect={setSelection} />
          )}

          {!isLoading && !error && scorees.length > 0 && vue === 'liste' && (
            <div className="h-full overflow-auto">
              {filtreesListe.length === 0 ? (
                <EmptyState onReset={reset} showReset={nbFiltresActifs > 0} />
              ) : (
                <table className="w-full border-separate border-spacing-0 text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                      <Th className="w-10 pl-6">#</Th>
                      <Th>Entreprise</Th>
                      <Th className="hidden lg:table-cell">Secteur / segment</Th>
                      <Th className="w-20 text-right">Empl.</Th>
                      <Th className="hidden md:table-cell">Décideur</Th>
                      <Th className="w-28">Priorité</Th>
                      <Th className="w-28 pr-6">Pamela</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtreesListe.map(({ entreprise: e, score }, i) => (
                      <Ligne
                        key={e.id}
                        e={e}
                        score={score}
                        rang={i + 1}
                        active={e.id === selection}
                        onClick={() => setSelection(e.id)}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {selectionnee && (
        <EntrepriseDetail
          entreprise={selectionnee.entreprise}
          score={selectionnee.score}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  )
}

// --- Ligne de tableau -------------------------------------------------------

function Ligne({
  e,
  score,
  rang,
  active,
  onClick,
}: {
  e: EntrepriseAvecContacts
  score: ScoreDetail
  rang: number
  active: boolean
  onClick: () => void
}) {
  const update = useUpdateEntreprise()
  const decideur = e.contacts.find((c) => c.est_decideur)
  const seg = segmentDe(e)
  const rel = relanceInfo(e)

  return (
    <tr
      onClick={onClick}
      className={
        'group cursor-pointer transition ' + (active ? 'bg-[var(--salt-soft)]' : 'hover:bg-[var(--card)]')
      }
    >
      <Td className="pl-6 text-xs text-[var(--muted-foreground)] tabular">{rang}</Td>
      <Td>
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--foreground)]">{e.nom}</span>
          {estDecouverte(e) && (
            <span className="inline-flex items-center gap-0.5 rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300">
              <Sparkles className="h-2.5 w-2.5" /> Découverte
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          {e.ville && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {e.ville}
            </span>
          )}
          {e.business_uid && <span className="tabular opacity-70">· {e.business_uid}</span>}
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
              {rel.statut === 'due' ? 'à relancer' : fmtDateCourt(rel.date)}
            </span>
          )}
        </div>
      </Td>
      <Td className="hidden lg:table-cell">
        <div className="text-xs text-[var(--muted-foreground)]">{e.secteur ?? '—'}</div>
        {seg && (
          <span className="mt-0.5 inline-block rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--foreground)]">
            {seg}
          </span>
        )}
      </Td>
      <Td className="text-right tabular text-[var(--muted-foreground)]">{e.taille_employes ?? '—'}</Td>
      <Td className="hidden text-xs md:table-cell">
        {decideur ? (
          <div>
            <div className="font-medium text-[var(--foreground)]">
              {[decideur.prenom, decideur.nom].filter(Boolean).join(' ')}
            </div>
            {decideur.fonction && (
              <div className="truncate text-[var(--muted-foreground)]">{decideur.fonction}</div>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 rounded bg-amber-400/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-300">
            <UserX className="h-3 w-3" /> à identifier
          </span>
        )}
      </Td>
      <Td>
        <PrioriteBar tier={score.tier} score={score.score} />
      </Td>
      <Td className="pr-6">
        <button
          onClick={(ev) => {
            ev.stopPropagation()
            update.mutate({ id: e.id, patch: { pamela_valide: !e.pamela_valide } })
          }}
          className={
            'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition ' +
            (e.pamela_valide
              ? 'border-[color:rgba(30,215,96,0.4)] bg-[var(--salt-soft)] text-[var(--color-salt)] hover:bg-[var(--salt-soft-strong)]'
              : 'border-[var(--border-strong)] bg-[var(--background)] text-[var(--muted-foreground)] hover:border-[color:rgba(30,215,96,0.4)] hover:text-[var(--color-salt)]')
          }
          title={e.pamela_valide ? 'Validé dans Pamela — cliquer pour retirer' : 'Marquer comme validé dans Pamela'}
        >
          <ShieldCheck className="h-3 w-3" />
          {e.pamela_valide ? 'Validé' : 'À valider'}
        </button>
      </Td>
    </tr>
  )
}

// --- Sous-composants --------------------------------------------------------

function EmptyState({ onReset, showReset }: { onReset: () => void; showReset: boolean }) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)]">
        <Search className="h-5 w-5 text-[var(--muted-foreground)]" />
      </div>
      <p className="text-sm font-medium">Aucune entreprise ne correspond</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">Essaie d'élargir les filtres.</p>
      {showReset && (
        <button onClick={onReset} className="btn-salt mt-3 px-3 py-1.5 text-xs">
          Réinitialiser les filtres
        </button>
      )}
    </div>
  )
}

function PrioriteBar({ tier, score }: { tier: ScoreDetail['tier']; score: number }) {
  const color = tier === 'A' ? 'var(--color-salt)' : tier === 'B' ? '#fbbf24' : '#71717a'
  return (
    <div className="flex items-center gap-2" title={`Score ${score}/100`}>
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <TierBadge tier={tier} score={score} />
    </div>
  )
}

function Kpi({
  label,
  value,
  icon,
  onClick,
  active,
  tone = 'neutral',
}: {
  label: string
  value: number
  icon: React.ReactNode
  onClick?: () => void
  active?: boolean
  tone?: 'neutral' | 'salt' | 'amber'
}) {
  const toneRing = {
    neutral: 'ring-[var(--border-strong)]',
    salt: 'ring-[color:rgba(30,215,96,0.6)]',
    amber: 'ring-amber-400/60',
  }[tone]
  const iconTone = {
    neutral: 'bg-white/5 text-[var(--muted-foreground)]',
    salt: 'bg-[var(--salt-soft)] text-[var(--color-salt)]',
    amber: 'bg-amber-400/10 text-amber-300',
  }[tone]
  return (
    <button
      onClick={onClick}
      className={
        'card-elevated flex items-center gap-3 px-4 py-3 text-left transition hover:border-[var(--border-strong)] ' +
        (active ? `ring-2 ${toneRing}` : '')
      }
    >
      <div className={'flex h-9 w-9 items-center justify-center rounded-lg ' + iconTone}>{icon}</div>
      <div>
        <div className="text-xl font-semibold leading-none tabular">{value}</div>
        <div className="mt-1 text-[11px] font-medium text-[var(--muted-foreground)]">{label}</div>
      </div>
    </button>
  )
}

function SourceTab({
  children,
  active,
  onClick,
  icon,
  count,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      className={
        'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ' +
        (active
          ? 'bg-[var(--color-salt)] text-[var(--color-salt-ink)]'
          : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]')
      }
    >
      {icon}
      {children}
      {count != null && (
        <span
          className={
            'rounded-full px-1.5 text-[11px] font-semibold tabular ' +
            (active ? 'bg-black/15 text-[var(--color-salt-ink)]' : 'bg-white/8 text-[var(--muted-foreground)]')
          }
        >
          {count}
        </span>
      )}
    </button>
  )
}

function VueBtn({
  children,
  active,
  onClick,
  icon,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ' +
        (active ? 'bg-[var(--foreground)] text-[var(--background)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]')
      }
    >
      {icon}
      {children}
    </button>
  )
}

function Select({
  value,
  onChange,
  children,
  label,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  label?: string
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border bg-[var(--background)] px-2.5 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--color-salt)]"
    >
      {children}
    </select>
  )
}

function Toggle({
  checked,
  onChange,
  children,
  icon,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={
        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ' +
        (checked
          ? 'border-[color:rgba(30,215,96,0.4)] bg-[var(--salt-soft)] text-[var(--color-salt)]'
          : 'bg-[var(--background)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]')
      }
    >
      {icon}
      {children}
    </button>
  )
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="inline-flex rounded-lg border bg-[var(--background)] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            'rounded-md px-2.5 py-1 text-xs font-medium transition ' +
            (value === o.value
              ? 'bg-[var(--color-salt)] text-[var(--color-salt-ink)]'
              : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]')
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={'border-b bg-[var(--card)] px-3 py-2.5 font-medium ' + className}>{children}</th>
  )
}

function Td({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <td className={'border-b border-[var(--border)] px-3 py-3 align-middle ' + className}>
      {children}
    </td>
  )
}

function triLabel(t: Tri): string {
  return t === 'taille' ? 'effectif' : t === 'nom' ? 'nom' : 'priorité de contact'
}
