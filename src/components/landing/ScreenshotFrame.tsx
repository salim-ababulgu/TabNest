import { cn } from '@/lib/utils'

/**
 * Cadre de navigateur autour d'une vraie capture d'écran de l'application.
 * Le contenu est réel : seuls le contour et la barre d'adresse sont décoratifs.
 */
export function ScreenshotFrame({
  src,
  alt,
  tone = 'light',
  crop = 'top',
  portrait = false,
  className,
}: {
  src: string
  alt: string
  tone?: 'light' | 'dark'
  crop?: 'top' | 'center'
  portrait?: boolean
  className?: string
}) {
  const dark = tone === 'dark'
  const dot = dark ? 'bg-white/15' : 'bg-border'
  return (
    <figure
      className={cn(
        'overflow-hidden rounded-2xl border',
        dark ? 'border-white/10 bg-white/[0.03]' : 'border-border bg-card',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn('flex items-center gap-1.5 border-b px-3 py-2', dark ? 'border-white/10' : 'border-border')}
      >
        <span className={cn('size-2 rounded-full', dot)} />
        <span className={cn('size-2 rounded-full', dot)} />
        <span className={cn('size-2 rounded-full', dot)} />
        <span
          className={cn(
            'ml-2 flex-1 truncate rounded-full border px-3 py-1 text-[10px]',
            dark
              ? 'border-white/10 bg-white/[0.05] text-brand-cream/50'
              : 'border-border bg-background text-muted-foreground',
          )}
        >
          tabnest-alb.pages.dev
        </span>
      </div>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn(
          'block w-full object-cover',
          crop === 'top' ? 'object-top' : 'object-center',
          portrait ? 'aspect-auto' : 'aspect-[16/10]',
        )}
      />
    </figure>
  )
}
