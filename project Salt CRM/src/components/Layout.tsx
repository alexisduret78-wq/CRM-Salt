import type { ReactNode } from 'react'
import { Target, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function Layout({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth()

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b bg-[var(--card)] px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-salt)] text-sm font-bold text-white">
            S
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Salt CRM</div>
            <div className="text-[11px] text-[var(--muted-foreground)]">Prospection Business</div>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          <span className="flex items-center gap-1.5 rounded-md bg-[var(--muted)] px-3 py-1.5 text-sm font-medium">
            <Target className="h-4 w-4 text-[var(--color-salt)]" />
            Prospection
          </span>
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-[var(--muted-foreground)] sm:inline">
            {session?.user.email}
          </span>
          <button
            onClick={() => signOut()}
            title="Se déconnecter"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sortir
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
