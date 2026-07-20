import { cn } from '@/lib/utils'

// Logo officiel Salt (wordmark blanc, transparent) — fourni dans public/.
// La taille se contrôle via une classe de hauteur (ex. h-7).
export function SaltLogo({ className = '' }: { className?: string }) {
  return (
    <img
      src="/salt_logo_white-big.png"
      alt="Salt"
      className={cn('w-auto select-none', className)}
      draggable={false}
    />
  )
}

// Lockup : logo Salt + pastille CRM.
export function SaltLockup({
  size = 'md',
  subtitle,
}: {
  size?: 'sm' | 'md' | 'lg'
  subtitle?: string
}) {
  const h = size === 'lg' ? 'h-9' : size === 'sm' ? 'h-5' : 'h-7'
  const chip = size === 'sm' ? 'text-[9px] px-1 py-0.5' : 'text-[10px] px-1.5 py-0.5'
  return (
    <div>
      <div className="flex items-center gap-2">
        <SaltLogo className={h} />
        <span
          className={cn(
            'rounded font-bold uppercase tracking-wide text-[var(--color-salt-ink)]',
            chip
          )}
          style={{ background: 'var(--color-salt)' }}
        >
          CRM
        </span>
      </div>
      {subtitle && <div className="mt-1.5 text-[11px] text-[var(--sidebar-muted)]">{subtitle}</div>}
    </div>
  )
}
