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
  Rows3,
  Columns3,
  Bell,
} from 'lucide-react'
import { useEntreprises, useUpdateEntreprise } from '@/hooks/useEntreprises'
import { estDansZone, estDecouverte, scorerEntreprise, segmentDe, type ScoreDetail } from '@/lib/scoring'
import { relanceInfo, totauxPotentiel, fmtCHFk, fmtDateCourt } from '@/lib/estimation'
import { siegeHorsRomandie } from '@/lib/siege'
import { flotteInfo } from '@/lib/flotte'
import type { EntrepriseAvecContacts } from '@/lib/database.types'
import { TierBadge, UidBadge, SiegeBadge, FlotteBadge } from '@/components/badges'
import { EntrepriseDetail } from '@/components/EntrepriseDetail'
import { ImportBanner } from '@/components/ImportBanner'
import { Kanban } from '@/components/Kanban'

type StatutFiltre = 'tous' | 'jamais' | 'ancien' | 'recent'
type PamelaFiltre = 'tous' | 'valide' | 'non_valide'
type SourceFiltre = 'toutes' | 'fichiers' | 'claude'
type TierFiltre = 'tous' | 'A' | 'B' | 'C'
type FlotteFiltre = 'tous' | 'cible' | 'qualifier' | 'faible'
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
  const [romandieStricte, setRomandieStricte] = useState(false)
  const [pamela, setPamela] = useState<PamelaFiltre>('tous')
  const [source, setSource] = useState<SourceFiltre>('claude')
  const [segment, setSegment] = useState<string>('tous')
  const [canton, setCanton] = useState<string>('tous')
  const [tier, setTier] = useState<TierFiltre>('tous')
  const [flotte, setFlotte] = useState<FlotteFiltre>('tous')
  const [masquerClients, setMasquerClients] = useState(true)
  const [tri, setTri] = useState<Tri>('priorite')
  const [vue, setVue] = useState<Vue>('liste')
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
      if (romandieStricte && siegeHorsRomandie(e.business_uid)) return false
      if (flotte !== 'tous') {
        const v = flotteInfo(e).verdict
        if (flotte === 'cible' && !(v === 'fort' || v === 'ok')) return false
        if (flotte === 'qualifier' && v !== 'qualifier') return false
        if (flotte === 'faible' && v !== 'faible') return false
      }
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
  }, [scope, recherche, segment, canton, tier, flotte, tailleMin, sansDecideur, relanceDue, romandieStricte, pamela, tri])

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
    (flotte !== 'tous' ? 1 : 0) +
    (statut !== 'tous' ? 1 : 0) +
    (pamela !== 'tous' ? 1 : 0) +
    (sansDecideur ? 1 : 0) +
    (relanceDue ? 1 : 0) +
    (romandieStricte ? 1 : 0)

  function reset() {
    setSegment('tous')
    setCanton('tous')
    setTier('tous')
    setFlotte('tous')
    setStatut('tous')
    setPamela('tous')
    setSansDecideur(false)
    setRelanceDue(false)
    setRomandieStricte(false)
    setRecherche('')
  }

  const nbAffichees = vue === 'kanban' ? filtreesBase.length : filtreesListe.length

  return (
    <div className="flex h-full">
      {/* Rail latéral : tous les contrôles — la liste occupe toute la hauteur à droite */}
      <aside className="flex w-64 shrink-0 flex-col border-r bg-[var(--card)]">
        <div className="flex-1 space-y-4 overflow-y-auto p-3">
          {/* Vue */}
          <div className="grid grid-cols-2 gap-1 rounded-full border bg-[var(--background)] p-0.5">
            {(['liste', 'kanban'] as Vue[]).map((v) => (
              <button
                key={v}
                onClick={() => setVue(v)}
                className={
                  'inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ' +
                  (vue === v
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]')
                }
              >
                {v === 'liste' ? <Rows3 className="h-4 w-4" /> : <Columns3 className="h-4 w-4" />}
                {v === 'liste' ? 'Liste' : 'Kanban'}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher…"
              className="w-full rounded-lg border bg-[var(--background)] py-2 pl-8 pr-3 text-sm outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--color-salt)] focus:ring-2 focus:ring-[color:var(--salt-soft-strong)]"
            />
          </div>

          {/* Source */}
          <div className="space-y-1.5">
            <SideLabel>Source</SideLabel>
            {(
              [
                { key: 'claude', label: 'Découvertes', icon: <Sparkles className="h-4 w-4" />, count: compteSource.claude },
                { key: 'fichiers', label: 'Mes fichiers', icon: <FolderOpen className="h-4 w-4" />, count: compteSource.fichiers },
                { key: 'toutes', label: 'Toutes', icon: <Layers className="h-4 w-4" />, count: compteSource.toutes },
              ] as { key: SourceFiltre; label: string; icon: React.ReactNode; count: number }[]
            ).map((s) => (
              <button
                key={s.key}
                onClick={() => setSource(s.key)}
                className={
                  'flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-sm font-medium transition ' +
                  (source === s.key
                    ? 'border-[color:rgba(30,215,96,0.4)] bg-[var(--salt-soft)] text-[var(--color-salt)]'
                    : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:border-[var(--border-strong)]')
                }
              >
                {s.icon}
                <span className="flex-1 text-left">{s.label}</span>
                <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold tabular">{s.count}</span>
              </button>
            ))}
          </div>

          {/* Raccourcis (KPI cliquables) */}
          <div className="space-y-1.5">
            <SideLabel>Raccourcis</SideLabel>
            <SideKpi label="Cibles en zone" value={kpis.total} icon={<Layers className="h-4 w-4" />} onClick={reset} />
            <SideKpi label="Priorité A" value={kpis.prioA} icon={<Flame className="h-4 w-4" />} tone="salt" active={tier === 'A'} onClick={() => setTier(tier === 'A' ? 'tous' : 'A')} />
            <SideKpi label="À relancer" value={kpis.aRelancer} icon={<Bell className="h-4 w-4" />} tone="amber" active={relanceDue} onClick={() => setRelanceDue(!relanceDue)} />
            <SideKpi label="Sans décideur" value={kpis.sansDecideur} icon={<UserX className="h-4 w-4" />} tone="amber" active={sansDecideur} onClick={() => setSansDecideur(!sansDecideur)} />
            <SideKpi label="Pamela à valider" value={kpis.pamelaAValider} icon={<ShieldCheck className="h-4 w-4" />} tone="salt" active={pamela === 'non_valide'} onClick={() => setPamela(pamela === 'non_valide' ? 'tous' : 'non_valide')} />
          </div>

          {/* Filtres */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <SideLabel>Filtres</SideLabel>
              {nbFiltresActifs > 0 && (
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--muted-foreground)] hover:text-[var(--color-salt)]"
                >
                  <X className="h-3 w-3" /> Réinitialiser
                </button>
              )}
            </div>

            {segments.length > 0 && (
              <Select className="w-full" value={segment} onChange={setSegment} label="Segment">
                <option value="tous">Tous les segments</option>
                {segments.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            )}
            {cantons.length > 1 && (
              <Select className="w-full" value={canton} onChange={setCanton} label="Canton">
                <option value="tous">GE + VD (Côte)</option>
                {cantons.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            )}
            <Select className="w-full" value={flotte} onChange={(v) => setFlotte(v as FlotteFiltre)} label="Potentiel flotte">
              <option value="tous">Flotte : toutes</option>
              <option value="cible">Cible 20+ lignes</option>
              <option value="qualifier">À qualifier</option>
              <option value="faible">Faible</option>
            </Select>
            <Select className="w-full" value={tier} onChange={(v) => setTier(v as TierFiltre)} label="Priorité">
              <option value="tous">Priorité : toutes</option>
              <option value="A">Priorité A</option>
              <option value="B">Priorité B</option>
              <option value="C">Priorité C</option>
            </Select>
            {vue === 'liste' && (
              <Select className="w-full" value={statut} onChange={(v) => setStatut(v as StatutFiltre)} label="Contact">
                <option value="tous">Contact : tout</option>
                <option value="jamais">Jamais contactée</option>
                <option value="ancien">Contact ancien</option>
                <option value="recent">Contact récent</option>
              </Select>
            )}
            <Select className="w-full" value={pamela} onChange={(v) => setPamela(v as PamelaFiltre)} label="Pamela">
              <option value="tous">Pamela : tout</option>
              <option value="valide">Validé</option>
              <option value="non_valide">À valider</option>
            </Select>

            <label className="flex items-center gap-1.5 rounded-lg border bg-[var(--background)] px-2.5 py-2 text-sm text-[var(--muted-foreground)]">
              <Users className="h-4 w-4" /> ≥
              <input
                type="number"
                value={tailleMin}
                min={0}
                step={10}
                onChange={(e) => setTailleMin(Number(e.target.value) || 0)}
                className="w-14 bg-transparent text-sm text-[var(--foreground)] outline-none tabular"
              />
              employés
            </label>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <Toggle checked={sansDecideur} onChange={setSansDecideur}>
                Sans décideur
              </Toggle>
              <Toggle checked={relanceDue} onChange={setRelanceDue} icon={<Bell className="h-3.5 w-3.5" />}>
                À relancer
              </Toggle>
              <Toggle checked={romandieStricte} onChange={setRomandieStricte}>
                Siège Romandie (RC)
              </Toggle>
              <Toggle checked={zoneUniquement} onChange={setZoneUniquement} icon={<MapPin className="h-3.5 w-3.5" />}>
                Zone GE + Côte
              </Toggle>
              <Toggle checked={masquerClients} onChange={setMasquerClients}>
                Masquer clients
              </Toggle>
            </div>
          </div>
        </div>

        {/* Import collé en bas du rail */}
        {!isLoading && scorees.length > 0 && (
          <div className="border-t border-[var(--border)] p-3">
            <ImportBanner vide={false} />
          </div>
        )}
      </aside>

      {/* Colonne principale : barre fine + liste/kanban pleine hauteur */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b bg-[var(--card)] px-6 py-2.5">
          <div className="flex flex-wrap items-center gap-x-2 text-xs text-[var(--muted-foreground)]">
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {isLoading ? 'Chargement…' : `${nbAffichees} entreprise${nbAffichees > 1 ? 's' : ''}`}
            </span>
            {!isLoading && vue === 'kanban' && (
              <span className="hidden sm:inline">· glisse les cartes pour faire avancer le pipeline</span>
            )}
            {!isLoading && potentiel.lignes > 0 && (
              <span className="tabular">
                · potentiel ≈ {potentiel.lignes} lignes ·{' '}
                <span className="font-medium text-[var(--color-salt)]">{fmtCHFk(potentiel.valeur)}/an</span>
              </span>
            )}
          </div>
          <Select value={tri} onChange={(v) => setTri(v as Tri)} label="Trier">
            <option value="priorite">Priorité ↓</option>
            <option value="taille">Effectif ↓</option>
            <option value="nom">Nom A→Z</option>
          </Select>
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
          <SiegeBadge uid={e.business_uid} />
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          {e.ville && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {e.ville}
            </span>
          )}
          {e.business_uid && <UidBadge uid={e.business_uid} />}
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
      <Td className="text-right">
        <div className="flex flex-col items-end gap-1">
          <span className="tabular text-[var(--muted-foreground)]">{e.taille_employes ?? '—'}</span>
          <FlotteBadge entreprise={e} />
        </div>
      </Td>
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

// Intitulé de section du rail latéral.
function SideLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
      {children}
    </div>
  )
}

// Raccourci KPI plein-largeur (rail latéral) : libellé + valeur, cliquable = filtre.
function SideKpi({
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
  const cls = {
    neutral: active
      ? 'border-[var(--border-strong)] bg-[var(--muted)] text-[var(--foreground)]'
      : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:border-[var(--border-strong)]',
    salt: active
      ? 'border-[color:rgba(30,215,96,0.5)] bg-[var(--salt-soft)] text-[var(--color-salt)]'
      : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:border-[color:rgba(30,215,96,0.4)] hover:text-[var(--color-salt)]',
    amber: active
      ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
      : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:border-amber-400/40 hover:text-amber-300',
  }[tone]
  return (
    <button
      onClick={onClick}
      className={'flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ' + cls}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      <span className="text-sm font-semibold leading-none tabular">{value}</span>
    </button>
  )
}

function Select({
  value,
  onChange,
  children,
  label,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  label?: string
  className?: string
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        'rounded-lg border bg-[var(--background)] px-2.5 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--color-salt)] ' +
        className
      }
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

