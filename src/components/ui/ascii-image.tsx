import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import { AsciiReveal, AsciiSkeleton } from 'ascii-reveal'
import { cn } from '@/lib/utils'

/**
 * Image avec chargement « intelligent » :
 * - tant que l'image n'est pas prête : squelette ASCII à sa place (aucun saut) ;
 * - quand elle arrive : décodage ASCII vers l'image réelle ;
 * - si elle est bloquée par le site source : on le signale et le parent garde
 *   son propre repli (lettre du domaine, fond coloré…).
 */
export function AsciiImage({
  src,
  alt,
  className,
  imgClassName,
  eager = false,
  skeletonRows = 4,
  skeletonCircle = false,
  onError,
}: {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  eager?: boolean
  skeletonRows?: number
  skeletonCircle?: boolean
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void
}) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  return (
    <span className={cn('relative block overflow-hidden', className)} data-ascii="media">
      {status === 'loading' && (
        <AsciiSkeleton
          variant="dither"
          rows={skeletonRows}
          circle={skeletonCircle}
          aria-hidden="true"
          className="absolute inset-0 block"
          animate
        />
      )}
      {status !== 'error' && (
        <AsciiReveal
          loading={status === 'loading'}
          preset="dither"
          duration="fast"
          lazy={false}
          revealOnMount={false}
          className="block h-full w-full"
        >
          <img
            src={src}
            alt={alt}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={eager ? 'high' : 'auto'}
            onLoad={() => setStatus('loaded')}
            onError={(event) => {
              setStatus('error')
              onError?.(event)
            }}
            className={imgClassName}
          />
        </AsciiReveal>
      )}
    </span>
  )
}
