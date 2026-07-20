import { useState, type FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabaseConfigured } from '@/lib/supabase'
import { SaltLogo } from '@/components/SaltLogo'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) setError(error)
    setBusy(false)
  }

  return (
    <div className="flex h-full items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2.5">
            <SaltLogo className="h-10" />
            <span className="rounded bg-[var(--color-salt)] px-1.5 py-0.5 text-[11px] font-bold uppercase text-[var(--color-salt-ink)]">
              CRM
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Prospection Business — Genève &amp; La Côte
          </p>
        </div>

        {!supabaseConfigured && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
            Connexion à Supabase non configurée. Définir <code>VITE_SUPABASE_URL</code> et{' '}
            <code>VITE_SUPABASE_ANON_KEY</code>.
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3 rounded-xl border bg-[var(--card)] p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:border-[var(--color-salt)] focus:ring-1 focus:ring-[var(--color-salt)]"
              placeholder="alexis@…"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:border-[var(--color-salt)] focus:ring-1 focus:ring-[var(--color-salt)]"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button type="submit" disabled={busy} className="btn-salt w-full px-3 py-2 text-sm disabled:opacity-50">
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
