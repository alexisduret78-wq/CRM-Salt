import { cn } from '@/lib/utils'
import type { Couleur } from '@/lib/database.types'
import type { ScoreDetail } from '@/lib/scoring'

const COULEUR_STYLES: Record<Couleur, { dot: string; label: string }> = {
  blanc: { dot: 'bg-neutral-300', label: 'Blanc' },
  jaune: { dot: 'bg-amber-400', label: 'Jaune' },
  rouge: { dot: 'bg-red-500', label: 'Rouge' },
  vert: { dot: 'bg-[var(--color-salt)]', label: 'Vert' },
}

export function CouleurBadge({ couleur }: { couleur: Couleur }) {
  const s = COULEUR_STYLES[couleur]
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
      <span className={cn('h-2.5 w-2.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

const TIER_STYLES: Record<ScoreDetail['tier'], string> = {
  A: 'bg-[var(--salt-soft)] text-[var(--color-salt)] border-[color:rgba(30,215,96,0.35)]',
  B: 'bg-amber-400/10 text-amber-300 border-amber-400/25',
  C: 'bg-white/5 text-[var(--muted-foreground)] border-white/10',
}

export function TierBadge({ tier, score }: { tier: ScoreDetail['tier']; score: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold',
        TIER_STYLES[tier]
      )}
      title={`Score de priorité : ${score}/100`}
    >
      Prio {tier}
      <span className="font-normal opacity-70 tabular">{score}</span>
    </span>
  )
}

export function PamelaBadge({ valide }: { valide: boolean | null }) {
  if (valide) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-[color:rgba(30,215,96,0.35)] bg-[var(--salt-soft)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-salt)]">
        Pamela ✓ validé
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] font-medium text-[var(--muted-foreground)]">
      Pamela — non validé
    </span>
  )
}
