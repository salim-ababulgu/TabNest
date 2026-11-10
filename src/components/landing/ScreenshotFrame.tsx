import { cn } from '@/lib/utils'
import { AsciiImage } from '@/components/ui/ascii-image'

/**
 * Cadre autour d'une vraie capture d'écran de l'application.
 * Le contenu est réel : seuls le contour et la barre d'adresse sont décoratifs.
 */
export function ScreenshotFrame({
  src,
  alt,
  tone = 'light',
  crop = 'top',
  portrait = false,
  eager = false,
  className,
}: {
  src: string
  alt: string
  tone?: 'light' | 'dark'
  crop?: 'top' | 'center'
  portrait?: boolean
  eager?: boolean
  width?: number
  height?: number
  className?: string
}) {
  const dark = tone === 'dark'
  return (
    <figure
      className={cn(
        'overflow-hidden rounded-[1.25rem]',
        dark ? 'bg-field text-field-ink' : 'bg-card text-foreground',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'flex items-center gap-2 px-4 py-2.5',
          dark ? 'bg-white/[0.06]' : 'bg-secondary',
        )}
      >
        <span className={cn('size-2 rounded-full', dark ? 'bg-white/25' : 'bg-foreground/20')} />
        <span className={cn('size-2 rounded-full', dark ? 'bg-white/25' : 'bg-foreground/20')} />
        <span className={cn('size-2 rounded-full', dark ? 'bg-white/25' : 'bg-foreground/20')} />
        <span
          className={cn(
            'mx-auto w-1/2 truncate rounded-full px-3 py-1 text-center text-[11px]',
            dark ? 'bg-white/[0.06] text-field-muted' : 'bg-card text-muted-foreground',
          )}
        >
          filnest.pages.dev
        </span>
      </div>
      <AsciiImage
        src={src}
        alt={alt}
        eager={eager}
        className="block w-full"
        imgClassName={cn(
          'block w-full object-cover',
          crop === 'top' ? 'object-top' : 'object-center',
          portrait ? 'aspect-auto' : 'aspect-[16/10]',
        )}
      />
    </figure>
  )
}
