import { useState } from 'react'
import {
  X,
  Globe,
  Link2,
  MapPin,
  Users,
  Building2,
  Mail,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  CalendarCheck,
  RotateCcw,
  Bell,
  Signal,
  Trash2,
  Ban,
  Send,
  ChevronDown,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import type { EntrepriseAvecContacts } from '@/lib/database.types'
import { joursDepuisDernierContact, segmentDe, type ScoreDetail } from '@/lib/scoring'
import { STAGES, stageDe, STAGE_COLUMN } from '@/lib/pipeline'
import {
  lignesEstimees,
  valeurAnnuelle,
  fmtCHF,
  relanceInfo,
  toInputDate,
  isoDepuisInput,
  dansNJours,
} from '@/lib/estimation'
import { infererEmail } from '@/lib/email'
import { classerDecideurs, type RangDecideur } from '@/lib/decideurs'
import { objetEmail, corpsEmail, lienMailto, ecrireA } from '@/lib/mailto'
import { useUpdateEntreprise, useDeleteEntreprises, useUpdateContact } from '@/hooks/useEntreprises'
import { CouleurBadge, TierBadge, UidBadge, SiegeBadge, FlotteBadge } from '@/components/badges'
import { flotteInfo } from '@/lib/flotte'

export function EntrepriseDetail({
  entreprise: e,
  score,
  onClose,
}: {
  entreprise: EntrepriseAvecContacts
  score: ScoreDetail
  onClose: () => void
}) {
  const update = useUpdateEntreprise()
  const supprimer = useDeleteEntreprises()

  function onSupprimer() {
    if (!window.confirm(`Supprimer définitivement « ${e.nom} » et ses décideurs ?`)) return
    supprimer.mutate([e.id], {
      onSuccess: () => {
        toast.success(`« ${e.nom} » supprimée`)
        onClose()
      },
      onError: (err) => toast.error((err as Error).message),
    })
  }
  // Deux décideurs par entreprise, pas plus : un point d'entrée opérationnel
  // et un décideur budgétaire. Le reste passe en contacts secondaires.
  const classes = classerDecideurs(e)
  const principaux = classes.slice(0, 2)
  const secondaires = classes.slice(2)
  const autres = e.contacts.filter((c) => !c.est_decideur)
  const jours = joursDepuisDernierContact(e.date_dernier_contact)
  const seg = segmentDe(e)
  const lignes = lignesEstimees(e)
  const rel = relanceInfo(e)

  return (
    <aside className="flex w-[440px] shrink-0 flex-col border-l bg-[var(--card)] shadow-[var(--shadow-lg)] animate-slidein">
      {/* En-tête */}
      <div className="flex items-start justify-between border-b px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold">{e.nom}</h2>
            <TierBadge tier={score.tier} score={score.score} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
            <CouleurBadge couleur={e.couleur} />
            {e.ville && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {e.ville}
              </span>
            )}
            {e.taille_employes != null && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" /> {e.taille_employes} empl.
              </span>
            )}
            {e.business_uid && <UidBadge uid={e.business_uid} />}
            {seg && (
              <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--foreground)]">
                {seg}
              </span>
            )}
            <SiegeBadge uid={e.business_uid} />
            <FlotteBadge entreprise={e} />
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onSupprimer}
            disabled={supprimer.isPending}
            title="Supprimer cette entreprise"
            className="rounded-md p-1 text-[var(--muted-foreground)] transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-auto px-5 py-4">
        {/* Statut Pamela — action principale, en haut de la fiche */}
        <section className="rounded-xl border border-[var(--border-strong)] bg-[var(--card-2)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground)]">
              <ShieldCheck className="h-3.5 w-3.5" /> Statut Pamela
            </span>
            {e.business_uid && <UidBadge uid={e.business_uid} />}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              disabled={update.isPending}
              onClick={() => update.mutate({ id: e.id, patch: { pamela_valide: true, indisponible: false } })}
              className={
                'flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-semibold transition ' +
                (e.pamela_valide && !e.indisponible
                  ? 'border-[color:rgba(30,215,96,0.6)] bg-[var(--color-salt)] text-[var(--color-salt-ink)] shadow-[0_0_0_1px_rgba(30,215,96,0.3)]'
                  : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[color:rgba(30,215,96,0.4)] hover:text-[var(--color-salt)]')
              }
            >
              <ShieldCheck className="h-4 w-4" />
              Validé
            </button>
            <button
              disabled={update.isPending}
              onClick={() => update.mutate({ id: e.id, patch: { pamela_valide: false, indisponible: false } })}
              className={
                'flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-semibold transition ' +
                (!e.pamela_valide && !e.indisponible
                  ? 'border-[var(--border-strong)] bg-[var(--muted)] text-[var(--foreground)]'
                  : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]')
              }
            >
              <RotateCcw className="h-4 w-4" />
              À valider
            </button>
            <button
              disabled={update.isPending}
              onClick={() => update.mutate({ id: e.id, patch: { pamela_valide: false, indisponible: true } })}
              className={
                'flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-semibold transition ' +
                (e.indisponible
                  ? 'border-red-500/60 bg-red-500/15 text-red-300 shadow-[0_0_0_1px_rgba(239,68,68,0.25)]'
                  : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-red-500/40 hover:text-red-300')
              }
            >
              <Ban className="h-4 w-4" />
              Invalide
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-[var(--muted-foreground)]">
            {e.indisponible
              ? '⛔ Mise de côté — à ne pas contacter.'
              : e.pamela_valide
                ? '✅ Validée — elle est dans « Prêtes à prospecter ».'
                : 'Copie l’UID, vérifie l’entreprise dans Pamela, puis marque le statut.'}
          </p>
        </section>

        {/* Pourquoi prioritaire */}
        {score.raisons.length > 0 && (
          <section>
            <SectionTitle>Pourquoi la contacter</SectionTitle>
            <ul className="space-y-1">
              {score.raisons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-salt)]" />
                  {r}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Potentiel estimé */}
        {lignes > 0 && (
          <section className="rounded-lg border border-[color:rgba(30,215,96,0.3)] bg-[var(--salt-soft)] p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Signal className="h-4 w-4 text-[var(--color-salt)]" />
                <span className="text-xs font-medium text-[var(--muted-foreground)]">
                  Potentiel mobile estimé
                </span>
              </div>
              <span
                className="text-[10px] text-[var(--muted-foreground)]"
                title="Estimation : part d'employés équipés × 35 CHF/mois/ligne. À affiner."
              >
                est.
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular">≈ {lignes}</span>
              <span className="text-sm text-[var(--muted-foreground)]">lignes mobiles</span>
            </div>
            <div className="mt-0.5 text-sm font-medium text-[var(--color-salt)] tabular">
              {fmtCHF(valeurAnnuelle(e))} / an potentiel
            </div>
            <div className="mt-2 flex items-center gap-2 border-t border-[color:rgba(30,215,96,0.2)] pt-2 text-[11px] text-[var(--muted-foreground)]">
              <FlotteBadge entreprise={e} />
              <span>
                {flotteInfo(e).label} · taux d'équipement {Math.round(flotteInfo(e).taux * 100)}% du secteur
              </span>
            </div>
          </section>
        )}

        {/* Infos */}
        <section>
          <SectionTitle>Informations</SectionTitle>
          <dl className="space-y-1.5 text-sm">
            <Info label="Secteur" icon={<Building2 className="h-3.5 w-3.5" />}>
              {e.secteur ?? '—'}
            </Info>
            <Info label="Typologie">{typologieLabel(e.typologie)}</Info>
            {e.adresse && <Info label="Adresse">{e.adresse}</Info>}
            {e.site_web && (
              <Info label="Site" icon={<Globe className="h-3.5 w-3.5" />}>
                <a
                  href={e.site_web}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--color-salt)] hover:underline"
                >
                  {e.site_web.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </Info>
            )}
            {e.linkedin_url && (
              <Info label="LinkedIn" icon={<Link2 className="h-3.5 w-3.5" />}>
                <a
                  href={e.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--color-salt)] hover:underline"
                >
                  Voir la page
                </a>
              </Info>
            )}
            {e.notes_consolidees && <Info label="Notes">{e.notes_consolidees}</Info>}
          </dl>
        </section>

        {/* Suivi commercial */}
        <section className="rounded-lg border bg-[var(--card-2)] p-3">
          <SectionTitle>Suivi commercial</SectionTitle>

          {/* Étape pipeline */}
          <div className="mb-3">
            <div className="mb-1.5 text-xs text-[var(--muted-foreground)]">Étape du pipeline</div>
            <div className="grid grid-cols-2 gap-1.5">
              {STAGES.map((s) => {
                const actif = stageDe(e) === s.key
                return (
                  <button
                    key={s.key}
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: e.id, patch: { [STAGE_COLUMN]: s.key } })}
                    className={
                      'rounded-md border px-2 py-1.5 text-xs font-medium transition ' +
                      (actif
                        ? 'border-[color:rgba(30,215,96,0.5)] bg-[var(--salt-soft)] text-[var(--color-salt)]'
                        : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]')
                    }
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Statut de contact */}
          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-[var(--muted-foreground)]">Dernier contact</span>
              <ContactPill jours={jours} />
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={update.isPending}
                onClick={() =>
                  update.mutate({
                    id: e.id,
                    patch: { date_dernier_contact: new Date().toISOString() },
                  })
                }
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[var(--foreground)] px-3 py-2 text-xs font-medium text-[var(--background)] transition hover:opacity-90"
              >
                <CalendarCheck className="h-3.5 w-3.5" />
                Marquer contactée aujourd'hui
              </button>
              {e.date_dernier_contact && (
                <button
                  disabled={update.isPending}
                  onClick={() => update.mutate({ id: e.id, patch: { date_dernier_contact: null } })}
                  title="Réinitialiser (jamais contactée)"
                  className="rounded-md border bg-[var(--card)] p-2 text-[var(--muted-foreground)] transition hover:text-[var(--color-salt)]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Prochaine relance */}
          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                <Bell className="h-3.5 w-3.5" /> Prochaine relance
              </span>
              {rel.statut !== 'aucune' && rel.date && (
                <span
                  className={
                    'rounded px-1.5 py-0.5 text-[11px] font-medium ' +
                    (rel.statut === 'due'
                      ? 'bg-amber-400/15 text-amber-300'
                      : 'bg-[var(--salt-soft)] text-[var(--color-salt)]')
                  }
                >
                  {rel.statut === 'due'
                    ? rel.jours === 0
                      ? "Aujourd'hui"
                      : `En retard (${Math.abs(rel.jours ?? 0)} j)`
                    : `Dans ${rel.jours} j`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={toInputDate(e.date_prochaine_relance)}
                onChange={(ev) =>
                  update.mutate({
                    id: e.id,
                    patch: { date_prochaine_relance: isoDepuisInput(ev.target.value) },
                  })
                }
                className="flex-1 rounded-md border bg-[var(--card)] px-2.5 py-1.5 text-xs text-[var(--foreground)] outline-none [color-scheme:dark] focus:border-[var(--color-salt)]"
              />
              <button
                onClick={() => update.mutate({ id: e.id, patch: { date_prochaine_relance: dansNJours(7) } })}
                className="rounded-md border bg-[var(--card)] px-2 py-1.5 text-[11px] font-medium text-[var(--muted-foreground)] transition hover:text-[var(--color-salt)]"
              >
                +7 j
              </button>
              <button
                onClick={() => update.mutate({ id: e.id, patch: { date_prochaine_relance: dansNJours(30) } })}
                className="rounded-md border bg-[var(--card)] px-2 py-1.5 text-[11px] font-medium text-[var(--muted-foreground)] transition hover:text-[var(--color-salt)]"
              >
                +30 j
              </button>
              {e.date_prochaine_relance && (
                <button
                  onClick={() => update.mutate({ id: e.id, patch: { date_prochaine_relance: null } })}
                  title="Retirer la relance"
                  className="rounded-md border bg-[var(--card)] p-1.5 text-[var(--muted-foreground)] transition hover:text-[var(--color-salt)]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

        </section>

        {/* Décideurs — classés par pertinence flotte */}
        <section>
          <SectionTitle>
            <span className="inline-flex items-center gap-1.5">
              À contacter
              {principaux.length === 2 ? (
                <span className="rounded bg-[var(--salt-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-salt)]">
                  2 / 2
                </span>
              ) : (
                <span
                  className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300"
                  title="Objectif : deux décideurs par entreprise"
                >
                  {principaux.length} / 2
                </span>
              )}
            </span>
          </SectionTitle>
          {principaux.length === 0 && (
            <p className="rounded-md border border-amber-400/25 bg-amber-400/10 p-2.5 text-xs text-amber-300">
              Aucun décideur identifié. À rechercher (Resp. IT, DAF, office manager) via LinkedIn ou
              le site de l'entreprise.
            </p>
          )}
          <div className="space-y-2">
            {principaux.map((r, i) => (
              <ContactCard key={r.contact.id} rang={r} entreprise={e} position={i + 1} />
            ))}
          </div>
        </section>

        {/* Brouillon de l'email, modifiable et copiable */}
        <EmailDraft entreprise={e} decideur={principaux[0]?.contact ?? null} />

        {/* Décideurs de second rang + contacts non décideurs */}
        {(secondaires.length > 0 || autres.length > 0) && (
          <section>
            <SectionTitle>Autres contacts ({secondaires.length + autres.length})</SectionTitle>
            <div className="space-y-2">
              {secondaires.map((r) => (
                <ContactCard key={r.contact.id} rang={r} entreprise={e} />
              ))}
              {autres.map((c) => (
                <ContactCard key={c.id} rang={{ contact: c, score: 0, categorie: 'inconnu', motif: '' }} entreprise={e} />
              ))}
            </div>
          </section>
        )}
      </div>
    </aside>
  )
}

// --- Sous-composants --------------------------------------------------------

function ContactCard({
  rang,
  entreprise: e,
  position,
}: {
  rang: RangDecideur
  entreprise: EntrepriseAvecContacts
  /** 1 = meilleure cible. Absent pour les contacts de second rang. */
  position?: number
}) {
  const c = rang.contact
  const nomComplet = [c.prenom, c.nom].filter(Boolean).join(' ') || 'Contact'
  const emailInfere = c.email ? null : infererEmail(c.prenom, c.nom, e, e.contacts)
  const mailto = lienMailto(e, c)

  return (
    <div
      className={
        'rounded-md border p-2.5 ' +
        (position === 1
          ? 'border-[color:var(--salt-soft-strong)] bg-[var(--card-2)]'
          : 'bg-[var(--card-2)]')
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {position === 1 && (
              <span className="rounded bg-[var(--salt-soft)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-salt)]">
                1er contact
              </span>
            )}
            <span className="text-sm font-medium">{nomComplet}</span>
          </div>
          {c.fonction && (
            <div className="truncate text-xs text-[var(--muted-foreground)]">{c.fonction}</div>
          )}
          {position != null && rang.motif && (
            <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{rang.motif}</div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {c.linkedin && (
            <a
              href={c.linkedin}
              target="_blank"
              rel="noreferrer"
              title="Profil LinkedIn"
              className="text-[var(--muted-foreground)] hover:text-[var(--color-salt)]"
            >
              <Link2 className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      <EmailEditable contact={c} suggestion={emailInfere} />

      {mailto ? (
        <button
          onClick={async () => {
            await ecrireA(e, c)
            toast.success('Texte copié — colle-le avec Ctrl+V au-dessus de ta signature')
          }}
          className="btn-salt press mt-2 inline-flex w-full items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs"
        >
          <Send className="h-3.5 w-3.5" />
          Écrire à {c.prenom || nomComplet}
        </button>
      ) : (
        <div className="mt-2 rounded-md border border-dashed border-[var(--border-strong)] px-2.5 py-1.5 text-center text-[11px] text-[var(--muted-foreground)]">
          Ajoute l'adresse email pour activer l'envoi
        </div>
      )}
    </div>
  )
}

/**
 * Adresse email d'un contact, corrigeable sur place.
 *
 * Beaucoup d'adresses sont reconstruites à partir d'un format seulement
 * probable : dès qu'on découvre la vraie — un rebond, une réponse, une page
 * équipe — il faut pouvoir la rectifier sans passer par du SQL.
 */
function EmailEditable({
  contact: c,
  suggestion,
}: {
  contact: EntrepriseAvecContacts['contacts'][number]
  suggestion: { email: string; confiance: 'observe' | 'standard' } | null
}) {
  const update = useUpdateContact()
  const [edition, setEdition] = useState(false)
  const [valeur, setValeur] = useState(c.email ?? suggestion?.email ?? '')

  function enregistrer() {
    const v = valeur.trim()
    if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      toast.error('Adresse invalide')
      return
    }
    update.mutate(
      { id: c.id, patch: { email: v || null } },
      {
        onSuccess: () => toast.success(v ? 'Adresse enregistrée' : 'Adresse effacée'),
        onError: (err) => toast.error((err as Error).message),
      }
    )
    setEdition(false)
  }

  if (edition) {
    return (
      <div className="mt-1.5 flex items-center gap-1.5">
        <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
        <input
          autoFocus
          value={valeur}
          onChange={(ev) => setValeur(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter') enregistrer()
            if (ev.key === 'Escape') {
              setValeur(c.email ?? suggestion?.email ?? '')
              setEdition(false)
            }
          }}
          placeholder="prenom.nom@entreprise.ch"
          className="min-w-0 flex-1 rounded border bg-[var(--background)] px-1.5 py-1 text-xs outline-none focus:border-[var(--color-salt)]"
        />
        <button
          onClick={enregistrer}
          title="Enregistrer (Entrée)"
          className="shrink-0 rounded p-1 text-[var(--color-salt)] hover:bg-[var(--muted)]"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            setValeur(c.email ?? suggestion?.email ?? '')
            setEdition(false)
          }}
          title="Annuler (Échap)"
          className="shrink-0 rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  if (!c.email && !suggestion) {
    return (
      <button
        onClick={() => setEdition(true)}
        className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--color-salt)]"
      >
        <Mail className="h-3.5 w-3.5" />
        Ajouter une adresse
      </button>
    )
  }

  return (
    <EmailLigne
      email={c.email ?? suggestion!.email}
      verifie={!!c.email}
      confiance={suggestion?.confiance}
      onEdit={() => setEdition(true)}
    />
  )
}

function EmailLigne({
  email,
  verifie,
  confiance,
  onEdit,
}: {
  email: string
  verifie: boolean
  confiance?: 'observe' | 'standard'
  onEdit?: () => void
}) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <Mail className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
      <a href={`mailto:${email}`} className="text-xs text-[var(--color-salt)] hover:underline">
        {email}
      </a>
      {!verifie && (
        <span
          className="rounded bg-amber-400/10 px-1 py-0.5 text-[10px] font-medium text-amber-300"
          title={
            confiance === 'observe'
              ? "Déduit du format d'email observé dans l'entreprise"
              : 'Format standard supposé (prenom.nom)'
          }
        >
          à confirmer
        </span>
      )}
      <button
        onClick={() => {
          navigator.clipboard.writeText(email)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        }}
        className="ml-auto text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        title="Copier"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-[var(--color-salt)]" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
      {onEdit && (
        <button
          onClick={onEdit}
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          title="Corriger l'adresse"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

function EmailDraft({
  entreprise: e,
  decideur,
}: {
  entreprise: EntrepriseAvecContacts
  decideur: EntrepriseAvecContacts['contacts'][number] | null
}) {
  const [copied, setCopied] = useState(false)
  const [ouvert, setOuvert] = useState(false)
  const objet = objetEmail(e)
  const corps = corpsEmail(e, decideur)

  function copier() {
    navigator.clipboard.writeText(`Objet : ${objet}\n\n${corps}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
    toast.success('Email copié dans le presse-papier')
  }

  return (
    <section>
      <SectionTitle>
        <button
          onClick={() => setOuvert((v) => !v)}
          className="inline-flex items-center gap-1.5 uppercase tracking-wide hover:text-[var(--foreground)]"
        >
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-salt)]" />
          Aperçu de l'email
          <ChevronDown
            className={'h-3.5 w-3.5 transition-transform ' + (ouvert ? 'rotate-180' : '')}
          />
        </button>
      </SectionTitle>
      {!ouvert ? null : (
      <div className="overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--card-2)]">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--card)] px-3 py-2">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Objet</div>
            <div className="truncate text-xs font-medium text-[var(--foreground)]">{objet}</div>
          </div>
          <button
            onClick={copier}
            className="btn-salt press inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 text-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap px-3 py-3 font-sans text-xs leading-relaxed text-[var(--foreground)]">
          {corps}
        </pre>
      </div>
      )}
    </section>
  )
}

function ContactPill({ jours }: { jours: number | null }) {
  if (jours === null) {
    return (
      <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[11px] font-medium text-red-300">
        Jamais contactée
      </span>
    )
  }
  const ancien = jours > 180
  const label =
    jours === 0 ? "Aujourd'hui" : jours < 60 ? `Il y a ${jours} j` : `Il y a ${Math.round(jours / 30)} mois`
  return (
    <span
      className={
        'rounded px-1.5 py-0.5 text-[11px] font-medium ' +
        (ancien ? 'bg-amber-400/10 text-amber-300' : 'bg-[var(--salt-soft)] text-[var(--color-salt)]')
      }
    >
      {label}
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
      {children}
    </h3>
  )
}

function Info({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-2">
      <dt className="flex w-24 shrink-0 items-center gap-1 text-xs text-[var(--muted-foreground)]">
        {icon}
        {label}
      </dt>
      <dd className="min-w-0 flex-1 break-words">{children}</dd>
    </div>
  )
}

// --- Utilitaires ------------------------------------------------------------

function typologieLabel(t: EntrepriseAvecContacts['typologie']): string {
  return {
    prospect_mobile: 'Prospect Mobile',
    prospect_blue: 'Prospect Blue',
    client_existant: 'Client existant',
  }[t]
}
