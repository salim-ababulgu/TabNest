import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Petit sur-titre éditorial au-dessus des grands titres de section :
 * une pastille miel + un libellé court. Jamais en majuscules espacées.
 */
export function Eyebrow({
  children,
  onDark = false,
  className,
}: {
  children: ReactNode
  onDark?: boolean
  className?: string
}) {
  return (
    <p
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium',
        onDark ? 'text-field-muted' : 'text-foreground/65',
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-lime" />
      {children}
    </p>
  )
}
