import type { ReactNode } from 'react'
import { Target, LogOut, Sparkles, FolderOpen } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { SaltLockup, SaltLogo } from '@/components/SaltLogo'

export function Layout({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth()
  const email = session?.user.email ?? ''
  const initiales = email ? email.slice(0, 2).toUpperCase() : 'AD'

  return (
    <div className="flex h-full bg-[var(--background)]">
      {/* Rail latéral sombre */}
      <aside className="hidden w-[236px] shrink-0 flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)] md:flex">
        <div className="px-5 py-5">
          <SaltLockup size="md" subtitle="Prospection Business · Genève" />
        </div>

        <div className="px-3 pt-2">
          <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--sidebar-muted)]">
            Pipeline
          </div>
          <NavItem active icon={<Target className="h-4 w-4" />}>
            Prospection
          </NavItem>
          <NavItem icon={<Sparkles className="h-4 w-4 text-[var(--color-salt)]" />}>
            Découvertes
          </NavItem>
          <NavItem icon={<FolderOpen className="h-4 w-4" />}>Mes fichiers</NavItem>
        </div>

        <div className="mt-auto border-t border-[var(--sidebar-border)] p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--sidebar-soft)] text-xs font-semibold">
              {initiales}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-xs font-medium">{email || 'Compte'}</div>
              <div className="text-[10px] text-[var(--sidebar-muted)]">Salt Business · Genève</div>
            </div>
            <button
              onClick={() => signOut()}
              title="Se déconnecter"
              className="rounded-md p-1.5 text-[var(--sidebar-muted)] transition hover:bg-[var(--sidebar-soft)] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Barre mobile */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-[var(--card)] px-4 py-2.5 md:hidden">
          <div className="flex items-center gap-2">
            <SaltLogo className="h-6" />
            <span className="rounded bg-[var(--color-salt)] px-1 py-0.5 text-[9px] font-bold uppercase text-[var(--color-salt-ink)]">
              CRM
            </span>
          </div>
          <button
            onClick={() => signOut()}
            className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}

function NavItem({
  children,
  icon,
  active,
}: {
  children: ReactNode
  icon: ReactNode
  active?: boolean
}) {
  return (
    <div
      className={
        'mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition ' +
        (active
          ? 'bg-[var(--sidebar-soft)] text-white'
          : 'text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-soft)] hover:text-white')
      }
    >
      {icon}
      {children}
    </div>
  )
}
