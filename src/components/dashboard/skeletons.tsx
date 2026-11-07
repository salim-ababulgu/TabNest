import { Skeleton } from '@/components/ui/skeleton'
import {
  CARD_BODY_CLASS,
  CARD_GRID_CLASS,
  CARD_SHELL_CLASS,
  CARD_THUMB_CLASS,
} from '@/components/dashboard/cardLayout'

/**
 * Squelette fidèle : il réutilise la géométrie exacte de la carte réelle
 * (CARD_SHELL_CLASS, CARD_THUMB_CLASS, CARD_BODY_CLASS). Quand le design de la
 * carte évolue, ces constantes évoluent aussi et le squelette suit tout seul.
 */
export function SkeletonCard({ index = 0 }: { index?: number }) {
  const delay = (index % 6) * 60
  return (
    <article className={CARD_SHELL_CLASS}>
      <div className={CARD_THUMB_CLASS}>
        <Skeleton className="absolute inset-0 rounded-none" delay={delay} />
      </div>
      <div className={CARD_BODY_CLASS}>
        <Skeleton className="h-4 w-3/5" delay={delay} />
        <Skeleton className="mt-1.5 h-3 w-4/5" delay={delay} />
        <Skeleton className="mt-2 h-3 w-1/4" delay={delay} />
        <div className="mt-2 flex flex-wrap gap-1">
          <Skeleton className="h-5 w-14 rounded-full" delay={delay} />
          <Skeleton className="h-5 w-12 rounded-full" delay={delay} />
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 sm:pt-3">
          <Skeleton className="h-5 w-16 rounded-full" delay={delay} />
          <Skeleton className="h-6 w-20 rounded-full" delay={delay} />
        </div>
      </div>
    </article>
  )
}

/** Pendant le chargement, la grille garde exactement la même structure. */
export function SkeletonGrid({ count = 9 }: { count?: number }) {
  return (
    <div role="status" aria-busy="true" data-skeleton-grid="" className={CARD_GRID_CLASS}>
      <span className="sr-only">Chargement</span>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} index={index} />
      ))}
    </div>
  )
}

/** Rangée de navigation : icône, libellé, compteur. */
export function SkeletonNavRow({ delay = 0 }: { delay?: number }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2">
      <Skeleton className="size-4 shrink-0" delay={delay} />
      <Skeleton className="h-3.5 flex-1" delay={delay} />
      <Skeleton className="h-3 w-5" delay={delay} />
    </div>
  )
}
