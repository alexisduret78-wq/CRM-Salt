import { cn } from '@/lib/utils'
import type { Couleur } from '@/lib/database.types'
import type { ScoreDetail } from '@/lib/scoring'

const COULEUR_STYLES: Record<Couleur, { dot: string; label: string }> = {
  blanc: { dot: 'bg-neutral-300', label: 'Blanc' },
  jaune: { dot: 'bg-amber-400', label: 'Jaune' },
  rouge: { dot: 'bg-red-500', label: 'Rouge' },
  vert: { dot: 'bg-green-500', label: 'Vert' },
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
  A: 'bg-red-100 text-red-700 border-red-200',
  B: 'bg-amber-100 text-amber-700 border-amber-200',
  C: 'bg-neutral-100 text-neutral-500 border-neutral-200',
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
      <span className="font-normal opacity-70">{score}</span>
    </span>
  )
}

export function PamelaBadge({ valide }: { valide: boolean | null }) {
  if (valide) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-700">
        Pamela ✓ validé
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[11px] font-medium text-neutral-500">
      Pamela — non validé
    </span>
  )
}
