import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import gsap from 'gsap'
import { Check } from 'lucide-react'
import { useLangValue } from '@/components/landing/i18n'
import type { Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const LANGS: { id: Lang; label: string }[] = [
  { id: 'fr', label: 'FR' },
  { id: 'en', label: 'EN' },
  { id: 'es', label: 'ES' },
  { id: 'zh', label: '中文' },
]

/**
 * Mise en page de l'écran d'authentification : panneau produit à gauche
 * (texte, aperçu réel, fond animé discret) et formulaire à droite.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useLangValue()
  const previewRef = useRef<HTMLDivElement>(null)

  // Parallaxe très légère de l'aperçu produit.
  useEffect(() => {
    const panel = previewRef.current
    if (!panel) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const moveX = gsap.quickTo(panel, 'x', { duration: 0.6, ease: 'power2.out' })
    const moveY = gsap.quickTo(panel, 'y', { duration: 0.6, ease: 'power2.out' })
    function onMove(event: PointerEvent) {
      const rect = panel!.getBoundingClientRect()
      const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width
      const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height
      moveX(dx * 10)
      moveY(dy * 8)
    }
    function onLeave() {
      moveX(0)
      moveY(0)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  // Fond vivant : trame de points qui dérive lentement (transform only).
  return (
    <div className="relative min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink px-10 py-8 text-cream lg:flex">
        <div aria-hidden="true" className="auth-dots" />

        <div className="relative flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-lime text-sm font-semibold text-lime-foreground">
            T
          </span>
          <span className="font-heading text-lg font-semibold">TabNest</span>
        </div>

        <div className="relative max-w-lg">
          <h1 className="font-heading text-[2.1rem] leading-[1.15] font-semibold">
            {t('auth.sideTitle')}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/65">{t('auth.sideText')}</p>

          <div ref={previewRef} className="mt-7 overflow-hidden rounded-xl border border-cream/15">
            <div className="flex items-center gap-1.5 border-b border-cream/10 bg-black/20 px-3 py-2">
              <span className="size-1.5 rounded-full bg-cream/25" />
              <span className="size-1.5 rounded-full bg-cream/25" />
              <span className="size-1.5 rounded-full bg-cream/25" />
              <span className="ml-2 text-[10px] text-cream/40">tabnest-alb.pages.dev</span>
            </div>
            <img
              src="/screenshots/dashboard-overview.png"
              alt=""
              className="block w-full"
              loading="lazy"
            />
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-cream/70">
            {[t('auth.side1'), t('auth.side2'), t('auth.side3')].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-3.5 text-lime" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-cream/40">{t('auth.sideFooter')}</p>
      </aside>

      <main className="flex min-h-screen flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 lg:hidden">
            <span className="grid size-7 place-items-center rounded-md bg-lime text-xs font-semibold text-lime-foreground">
              T
            </span>
            <span className="font-heading text-base font-semibold">TabNest</span>
          </span>

          <div className="ml-auto flex items-center gap-1" role="group" aria-label="Langue">
            {LANGS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLang(item.id)}
                aria-pressed={lang === item.id}
                className={cn(
                  'rounded-md px-2 py-1 text-[11px] transition-colors',
                  lang === item.id
                    ? 'bg-ink text-cream'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </div>
      </main>
    </div>
  )
}
