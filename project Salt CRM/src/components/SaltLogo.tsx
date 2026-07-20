import { cn } from '@/lib/utils'

// Logotype « salt » (minuscules, extrabold, tracking serré).
// Reproduit le wordmark Salt. Pour un rendu 1:1 avec le SVG officiel,
// dépose le fichier dans public/ et remplace ce composant par une <img>.
export function SaltLogo({ className = '' }: { className?: string }) {
  return (
    <span
      className={cn('font-extrabold lowercase leading-none tracking-[-0.04em] select-none', className)}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      aria-label="Salt"
    >
      salt
    </span>
  )
}

// Lockup complet : « salt » + pastille CRM.
export function SaltLockup({
  size = 'md',
  subtitle,
}: {
  size?: 'sm' | 'md' | 'lg'
  subtitle?: string
}) {
  const wordmark = size === 'lg' ? 'text-[30px]' : size === 'sm' ? 'text-lg' : 'text-[26px]'
  const chip = size === 'sm' ? 'text-[9px] px-1 py-0.5' : 'text-[10px] px-1.5 py-0.5'
  return (
    <div>
      <div className="flex items-baseline gap-1.5">
        <SaltLogo className={cn(wordmark, 'text-white')} />
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
      {subtitle && (
        <div className="mt-1 text-[11px] text-[var(--sidebar-muted)]">{subtitle}</div>
      )}
    </div>
  )
}
