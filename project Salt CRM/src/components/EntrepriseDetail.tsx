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
  Hash,
} from 'lucide-react'
import { toast } from 'sonner'
import type { EntrepriseAvecContacts } from '@/lib/database.types'
import { joursDepuisDernierContact, segmentDe, type ScoreDetail } from '@/lib/scoring'
import { STAGES, stageDe, STAGE_COLUMN } from '@/lib/pipeline'
import { infererEmail } from '@/lib/email'
import { useTogglePamela, useUpdateEntreprise } from '@/hooks/useEntreprises'
import { CouleurBadge, TierBadge } from '@/components/badges'

export function EntrepriseDetail({
  entreprise: e,
  score,
  onClose,
}: {
  entreprise: EntrepriseAvecContacts
  score: ScoreDetail
  onClose: () => void
}) {
  const togglePamela = useTogglePamela()
  const update = useUpdateEntreprise()
  const decideurs = e.contacts.filter((c) => c.est_decideur)
  const autres = e.contacts.filter((c) => !c.est_decideur)
  const jours = joursDepuisDernierContact(e.date_dernier_contact)
  const seg = segmentDe(e)

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
            {e.business_uid && (
              <span className="inline-flex items-center gap-1 tabular">
                <Hash className="h-3 w-3" /> {e.business_uid}
              </span>
            )}
            {seg && (
              <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--foreground)]">
                {seg}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-auto px-5 py-4">
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

          {/* Statut Pamela */}
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Statut CRM interne (Pamela)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={togglePamela.isPending}
                onClick={() => togglePamela.mutate({ id: e.id, valide: true })}
                className={
                  'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition ' +
                  (e.pamela_valide
                    ? 'border-[color:rgba(30,215,96,0.5)] bg-[var(--salt-soft)] text-[var(--color-salt)]'
                    : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]')
                }
              >
                ✓ Validé
              </button>
              <button
                disabled={togglePamela.isPending}
                onClick={() => togglePamela.mutate({ id: e.id, valide: false })}
                className={
                  'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition ' +
                  (!e.pamela_valide
                    ? 'border-[var(--border-strong)] bg-[var(--muted)] text-[var(--foreground)]'
                    : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]')
                }
              >
                Non validé
              </button>
            </div>
            {e.statut_pamela_origine && (
              <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                Origine : {e.statut_pamela_origine}
              </p>
            )}
          </div>
        </section>

        {/* Décideurs */}
        <section>
          <SectionTitle>
            Décideurs à contacter {decideurs.length > 0 && `(${decideurs.length})`}
          </SectionTitle>
          {decideurs.length === 0 && (
            <p className="rounded-md border border-amber-400/25 bg-amber-400/10 p-2.5 text-xs text-amber-300">
              Aucun décideur identifié. À rechercher (Directeur, DG, DAF, Resp. IT/Achats) via
              LinkedIn ou le site de l'entreprise.
            </p>
          )}
          <div className="space-y-2">
            {decideurs.map((c) => (
              <ContactCard key={c.id} contact={c} entreprise={e} />
            ))}
          </div>
        </section>

        {/* Email de prise de contact */}
        <EmailDraft entreprise={e} decideur={decideurs[0] ?? null} />

        {/* Autres contacts */}
        {autres.length > 0 && (
          <section>
            <SectionTitle>Autres contacts ({autres.length})</SectionTitle>
            <div className="space-y-2">
              {autres.map((c) => (
                <ContactCard key={c.id} contact={c} entreprise={e} />
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
  contact: c,
  entreprise: e,
}: {
  contact: EntrepriseAvecContacts['contacts'][number]
  entreprise: EntrepriseAvecContacts
}) {
  const nomComplet = [c.prenom, c.nom].filter(Boolean).join(' ') || 'Contact'
  const emailInfere = c.email
    ? null
    : infererEmail(c.prenom, c.nom, e, e.contacts)

  return (
    <div className="rounded-md border bg-[var(--card-2)] p-2.5">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-sm font-medium">{nomComplet}</div>
          {c.fonction && (
            <div className="truncate text-xs text-[var(--muted-foreground)]">{c.fonction}</div>
          )}
        </div>
        {c.linkedin && (
          <a href={c.linkedin} target="_blank" rel="noreferrer" className="text-[var(--muted-foreground)] hover:text-[var(--color-salt)]">
            <Link2 className="h-4 w-4" />
          </a>
        )}
      </div>

      {c.email ? (
        <EmailLigne email={c.email} verifie />
      ) : emailInfere ? (
        <EmailLigne email={emailInfere.email} verifie={false} confiance={emailInfere.confiance} />
      ) : (
        <div className="mt-1.5 text-xs text-[var(--muted-foreground)]">Email inconnu</div>
      )}
    </div>
  )
}

function EmailLigne({
  email,
  verifie,
  confiance,
}: {
  email: string
  verifie: boolean
  confiance?: 'observe' | 'standard'
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
  const prenom = decideur?.prenom ?? ''
  const objet = `Salt Business — optimiser la téléphonie mobile de ${e.nom}`
  const corps = genererEmail(e, prenom)

  function copier() {
    navigator.clipboard.writeText(`Objet : ${objet}\n\n${corps}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
    toast.success('Email copié dans le presse-papier')
  }

  return (
    <section>
      <SectionTitle>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-salt)]" />
          Brouillon email — 1er RDV
        </span>
      </SectionTitle>
      <div className="rounded-md border bg-[var(--card-2)] p-3">
        <div className="mb-1 text-xs font-medium">Objet : {objet}</div>
        <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-[var(--foreground)]">
          {corps}
        </pre>
        <button onClick={copier} className="btn-salt mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          Copier l'email
        </button>
      </div>
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

function genererEmail(e: EntrepriseAvecContacts, prenom: string): string {
  const salutation = prenom ? `Bonjour ${prenom},` : 'Bonjour,'
  const tailleMention =
    e.taille_employes != null
      ? `Avec vos ${e.taille_employes} collaborateurs, `
      : 'Pour une équipe de votre taille, '
  return `${salutation}

Je suis conseiller Business chez Salt à Genève. ${tailleMention}la maîtrise des coûts et de la qualité de la téléphonie mobile est souvent un levier d'économies et de simplicité sous-estimé.

Nous accompagnons les entreprises de la région (Genève et La Côte) sur leurs lignes mobiles professionnelles : forfaits adaptés, couverture, et un interlocuteur dédié.

Seriez-vous disponible pour un court échange de 15 minutes dans les prochains jours ? Je vous propose de vous montrer concrètement ce que cela pourrait représenter pour ${e.nom}.

Bien cordialement,
Alexis Duret
Salt Business — Genève`
}
