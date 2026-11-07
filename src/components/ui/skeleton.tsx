import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  /** Décalage de la vague, en millisecondes (stagger de grille). */
  delay?: number
}

/** Forme de chargement : une vague miel traverse la surface (voir index.css). */
export function Skeleton({ className, delay = 0, style, ...props }: SkeletonProps) {
  const merged = { ...style, '--sk-delay': `${delay}ms` } as CSSProperties
  return (
    <div
      aria-hidden="true"
      className={cn('skeleton-shimmer rounded-md', className)}
      style={merged}
      {...props}
    />
  )
}
