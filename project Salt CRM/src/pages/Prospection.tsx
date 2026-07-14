import { useMemo, useState } from 'react'
import { Search, MapPin, Users, AlertCircle } from 'lucide-react'
import { useEntreprises } from '@/hooks/useEntreprises'
import { estDansZone, scorerEntreprise, type ScoreDetail } from '@/lib/scoring'
import type { EntrepriseAvecContacts } from '@/lib/database.types'
import { CouleurBadge, TierBadge, PamelaBadge } from '@/components/badges'
import { EntrepriseDetail } from '@/components/EntrepriseDetail'

type StatutFiltre = 'tous' | 'jamais' | 'ancien'
type PamelaFiltre = 'tous' | 'valide' | 'non_valide'

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
  const [pamela, setPamela] = useState<PamelaFiltre>('tous')
  const [masquerClients, setMasquerClients] = useState(true)
  const [selection, setSelection] = useState<string | null>(null)

  const scorees = useMemo<EntrepriseScoree[]>(() => {
    if (!data) return []
    return data
      .map((entreprise) => ({ entreprise, score: scorerEntreprise(entreprise) }))
      .sort((a, b) => b.score.score - a.score.score)
  }, [data])

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return scorees.filter(({ entreprise: e, score }) => {
      if (masquerClients && e.couleur === 'vert') return false
      if (zoneUniquement && !estDansZone(e)) return false
      if (e.taille_employes != null && e.taille_employes < tailleMin) return false
      if (tailleMin > 0 && e.taille_employes == null && tailleMin > 0) {
        // les tailles inconnues restent visibles seulement si le seuil est ≤ 50
        if (tailleMin > 50) return false
      }
      if (statut === 'jamais' && score.statutContact !== 'jamais') return false
      if (statut === 'ancien' && score.statutContact !== 'ancien') return false
      if (sansDecideur && score.statutInterlocuteur !== 'aucun') return false
      if (pamela === 'valide' && !e.pamela_valide) return false
      if (pamela === 'non_valide' && e.pamela_valide) return false
      if (q) {
        const hay = `${e.nom} ${e.ville ?? ''} ${e.secteur ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [scorees, recherche, zoneUniquement, tailleMin, statut, sansDecideur, pamela, masquerClients])

  const selectionnee = filtrees.find((f) => f.entreprise.id === selection) ?? null

  return (
    <div className="flex h-full">
      {/* Colonne principale */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre de filtres */}
        <div className="border-b bg-[var(--card)] px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher nom, ville, secteur…"
                className="w-64 rounded-md border bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-[var(--color-salt)]"
              />
            </div>

            <Segmented
              value={statut}
              onChange={(v) => setStatut(v as StatutFiltre)}
              options={[
                { value: 'tous', label: 'Tous' },
                { value: 'jamais', label: 'Jamais contactée' },
                { value: 'ancien', label: 'Contact ancien' },
              ]}
            />

            <label className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
              <Users className="h-4 w-4" />
              ≥
              <input
                type="number"
                value={tailleMin}
                min={0}
                step={10}
                onChange={(e) => setTailleMin(Number(e.target.value) || 0)}
                className="w-16 rounded-md border bg-white px-2 py-1 text-sm outline-none focus:border-[var(--color-salt)]"
              />
              empl.
            </label>

            <Toggle checked={zoneUniquement} onChange={setZoneUniquement} icon={<MapPin className="h-3.5 w-3.5" />}>
              Zone GE + Côte
            </Toggle>
            <Toggle checked={sansDecideur} onChange={setSansDecideur}>
              Sans décideur
            </Toggle>
            <Toggle checked={masquerClients} onChange={setMasquerClients}>
              Masquer clients
            </Toggle>

            <Segmented
              value={pamela}
              onChange={(v) => setPamela(v as PamelaFiltre)}
              options={[
                { value: 'tous', label: 'Pamela : tous' },
                { value: 'valide', label: 'Validé' },
                { value: 'non_valide', label: 'Non validé' },
              ]}
            />
          </div>

          <div className="mt-2 text-xs text-[var(--muted-foreground)]">
            {isLoading ? 'Chargement…' : `${filtrees.length} entreprise(s) — triées par priorité de contact`}
          </div>
        </div>

        {/* Liste */}
        <div className="min-h-0 flex-1 overflow-auto">
          {error && (
            <div className="flex items-center gap-2 p-6 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              Erreur de chargement : {(error as Error).message}
            </div>
          )}

          {!isLoading && !error && filtrees.length === 0 && (
            <div className="p-10 text-center text-sm text-[var(--muted-foreground)]">
              Aucune entreprise ne correspond à ces filtres.
            </div>
          )}

          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-[var(--muted)] text-left text-xs text-[var(--muted-foreground)]">
              <tr>
                <th className="px-5 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Entreprise</th>
                <th className="px-3 py-2 font-medium">Secteur</th>
                <th className="px-3 py-2 font-medium">Empl.</th>
                <th className="px-3 py-2 font-medium">Statut</th>
                <th className="px-3 py-2 font-medium">Décideur</th>
                <th className="px-3 py-2 font-medium">Priorité</th>
              </tr>
            </thead>
            <tbody>
              {filtrees.map(({ entreprise: e, score }, i) => {
                const decideur = e.contacts.find((c) => c.est_decideur)
                const active = e.id === selection
                return (
                  <tr
                    key={e.id}
                    onClick={() => setSelection(e.id)}
                    className={
                      'cursor-pointer border-b transition hover:bg-[var(--muted)] ' +
                      (active ? 'bg-red-50/60' : '')
                    }
                  >
                    <td className="px-5 py-2.5 text-xs text-[var(--muted-foreground)]">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{e.nom}</div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <CouleurBadge couleur={e.couleur} />
                        {e.ville && (
                          <span className="text-xs text-[var(--muted-foreground)]">· {e.ville}</span>
                        )}
                        {e.pamela_valide && <PamelaBadge valide />}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[var(--muted-foreground)]">{e.secteur ?? '—'}</td>
                    <td className="px-3 py-2.5 text-[var(--muted-foreground)]">
                      {e.taille_employes ?? '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatutPill statut={score.statutContact} />
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {decideur ? (
                        <span className="text-[var(--foreground)]">
                          {[decideur.prenom, decideur.nom].filter(Boolean).join(' ')}
                          {decideur.email ? '' : ' (email ?)'}
                        </span>
                      ) : (
                        <span className="text-amber-600">à identifier</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <TierBadge tier={score.tier} score={score.score} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panneau détail */}
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

// --- Petits composants UI ---------------------------------------------------

function StatutPill({ statut }: { statut: ScoreDetail['statutContact'] }) {
  const map = {
    jamais: { label: 'Jamais contactée', cls: 'bg-red-50 text-red-600' },
    ancien: { label: 'Contact ancien', cls: 'bg-amber-50 text-amber-700' },
    recent: { label: 'Contact récent', cls: 'bg-neutral-100 text-neutral-500' },
  }[statut]
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${map.cls}`}>
      {map.label}
    </span>
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
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition ' +
        (checked
          ? 'border-[var(--color-salt)] bg-red-50 text-[var(--color-salt)]'
          : 'bg-white text-[var(--muted-foreground)] hover:bg-[var(--muted)]')
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
    <div className="inline-flex rounded-md border bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            'rounded px-2.5 py-1 text-xs font-medium transition ' +
            (value === o.value
              ? 'bg-[var(--color-salt)] text-white'
              : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]')
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
