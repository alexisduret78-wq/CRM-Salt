import type { ReactNode } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { SaltLogo } from '@/components/SaltLogo'

export function Layout({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth()
  const email = session?.user.email ?? ''
  const initiales = email ? email.slice(0, 2).toUpperCase() : 'AD'

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Barre supérieure premium (pleine largeur, fond noir) */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--sidebar-border)] bg-[var(--sidebar)] px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <SaltLogo className="h-6" />
          <span className="rounded bg-[var(--color-salt)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-salt-ink)]">
            CRM
          </span>
          <span className="ml-1 hidden text-xs text-[var(--sidebar-muted)] sm:inline">
            Prospection Business · Genève
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2.5 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--sidebar-soft)] text-xs font-semibold text-[var(--sidebar-foreground)]">
              {initiales}
            </div>
            <div className="leading-tight">
              <div className="text-xs font-medium text-[var(--sidebar-foreground)]">{email || 'Compte'}</div>
              <div className="text-[10px] text-[var(--sidebar-muted)]">Salt Business</div>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            title="Se déconnecter"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--sidebar-muted)] transition hover:bg-[var(--sidebar-soft)] hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sortir</span>
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
