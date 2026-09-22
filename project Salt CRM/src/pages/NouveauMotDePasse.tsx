import { useState, type FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { SaltLogo } from '@/components/SaltLogo'

const CHAMP =
  'w-full rounded-lg border bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--color-salt)] focus:ring-2 focus:ring-[color:var(--salt-soft-strong)]'

/**
 * Écran affiché à l'arrivée d'un lien « mot de passe oublié ». Le lien crée
 * déjà une session valide côté Supabase : sans cet écran, on entrerait
 * directement dans l'app sans jamais avoir fixé le nouveau mot de passe, et le
 * problème se reposerait à la connexion suivante.
 */
export default function NouveauMotDePasse() {
  const { changerMotDePasse } = useAuth()
  const [mdp, setMdp] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (mdp !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.')
      return
    }
    if (mdp.length < 8) {
      setErreur('8 caractères minimum.')
      return
    }
    setBusy(true)
    setErreur(null)
    const { error } = await changerMotDePasse(mdp)
    setBusy(false)
    if (error) setErreur(error)
    // Succès : `recovery` repasse à false et l'app affiche la prospection.
  }

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-[var(--background)] px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(30,215,96,0.18), transparent 70%)' }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-9 text-center">
          <div className="mb-3 flex items-center justify-center gap-2.5">
            <SaltLogo className="h-10" />
            <span className="rounded bg-[var(--color-salt)] px-1.5 py-0.5 text-[11px] font-bold uppercase text-[var(--color-salt-ink)]">
              CRM
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Choisis un nouveau mot de passe</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="glow-salt space-y-4 rounded-2xl border border-[var(--border-strong)] bg-[var(--card)] p-7"
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              required
              autoFocus
              autoComplete="new-password"
              value={mdp}
              onChange={(e) => setMdp(e.target.value)}
              className={CHAMP}
              placeholder="8 caractères minimum"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
              Confirmation
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className={CHAMP}
              placeholder="••••••••"
            />
          </div>

          {erreur && (
            <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-salt press w-full px-3 py-2.5 text-sm disabled:opacity-50"
          >
            {busy ? 'Enregistrement…' : 'Enregistrer et entrer'}
          </button>
        </form>
      </div>
    </div>
  )
}
