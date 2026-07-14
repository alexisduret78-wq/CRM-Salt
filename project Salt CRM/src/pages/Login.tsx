import { useState, type FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabaseConfigured } from '@/lib/supabase'

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
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-salt)] text-lg font-bold text-white">
            S
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Salt CRM</h1>
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
              className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-salt)] focus:ring-1 focus:ring-[var(--color-salt)]"
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
              className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-salt)] focus:ring-1 focus:ring-[var(--color-salt)]"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-[var(--color-salt)] px-3 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-salt-dark)] disabled:opacity-50"
          >
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
