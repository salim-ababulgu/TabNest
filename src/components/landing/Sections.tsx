import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EyeOff, Pin, Bookmark, Clock, FolderOpen, ShieldCheck } from 'lucide-react'
import { ScreenshotFrame } from '@/components/landing/ScreenshotFrame'
import { useLang } from '@/components/landing/i18n'

gsap.registerPlugin(ScrollTrigger)

/** Bandeau défilant des types de pages conservées. */
export function PageTypeMarquee() {
  const trackRef = useRef<HTMLDivElement>(null)
  const { t, list } = useLang()
  const items = list('marquee.items')

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const tween = gsap.to(track, { xPercent: -50, duration: 32, ease: 'none', repeat: -1 })
    return () => {
      tween.kill()
    }
  }, [])

  return (
    <section
      aria-label={t('marquee.label')}
      className="overflow-hidden border-y border-border bg-card py-5"
    >
      <div ref={trackRef} className="flex w-max items-center gap-10 px-6">
        {[...items, ...items].map((label, index) => (
          <span
            key={`${label}-${index}`}
            aria-hidden={index >= items.length}
            className="font-heading text-lg whitespace-nowrap text-muted-foreground/80"
          >
            {label}
          </span>
        ))}
      </div>
    </section>
  )
}

const STEPS = [
  { titleKey: 'steps.s1.title', textKey: 'steps.s1.text' },
  { titleKey: 'steps.s2.title', textKey: 'steps.s2.text' },
  { titleKey: 'steps.s3.title', textKey: 'steps.s3.text' },
] as const

/** « Comment ça marche » épinglé : la séquence avance avec le scroll. */
export function PinnedSteps() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { t } = useLang()

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
        },
      })

      timeline
        .to('.pinned-progress', { scaleY: 1, duration: 1, ease: 'none' }, 0)
        .to('.pinned-step-0', { opacity: 1, duration: 0.1 }, 0)
        .to('.pinned-step-1', { opacity: 1, duration: 0.1 }, 0.42)
        .to('.pinned-step-2', { opacity: 1, duration: 0.1 }, 0.84)
        .to('.pinned-visual-1', { opacity: 1, duration: 0.15 }, 0.38)
        .to('.pinned-visual-2', { opacity: 1, duration: 0.15 }, 0.8)
    }, wrapper)

    return () => context.revert()
  }, [])

  return (
    <div ref={wrapperRef} className="relative h-[240vh] bg-background">
      <div className="sticky top-0 flex min-h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="max-w-md font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
              {t('steps.title')}
            </h2>
            <div className="relative mt-10 pl-8">
              <span
                aria-hidden="true"
                className="absolute top-1 bottom-1 left-[5px] w-1 rounded-full bg-border"
              />
              <span
                aria-hidden="true"
                className="pinned-progress absolute top-1 bottom-1 left-[5px] w-1 origin-top scale-y-0 rounded-full bg-lime"
              />
              <ol className="space-y-9">
                {STEPS.map((step, index) => (
                  <li
                    key={step.titleKey}
                    className={`pinned-step-${index} relative opacity-35 transition-none`}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute top-1.5 -left-8 size-3.5 rounded-full bg-lime"
                    />
                    <h3 className="font-heading text-xl font-medium">{t(step.titleKey)}</h3>
                    <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-foreground/70">
                      {t(step.textKey)}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="relative hidden h-[380px] md:block">
            <div className="pinned-visual-0 absolute inset-0 flex items-center justify-center">
              <ScreenshotFrame
                src="/screenshots/dashboard-overview.png"
                alt={t('steps.alt1')}
                className="w-full max-w-sm"
              />
            </div>

            <div className="pinned-visual-1 absolute inset-0 flex items-center justify-center opacity-0">
              <ScreenshotFrame
                src="/screenshots/dashboard-grid.png"
                alt={t('steps.alt2')}
                className="w-full max-w-sm"
              />
            </div>

            <div className="pinned-visual-2 absolute inset-0 flex items-center justify-center opacity-0">
              <ScreenshotFrame
                src="/screenshots/dashboard-detail.png"
                alt={t('steps.alt3')}
                crop="center"
                className="w-full max-w-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const BENTO = [
  {
    icon: Clock,
    titleKey: 'bento.b1.title',
    textKey: 'bento.b1.text',
    span: 'sm:col-span-2',
  },
  { icon: Pin, titleKey: 'bento.b2.title', textKey: 'bento.b2.text' },
  { icon: Bookmark, titleKey: 'bento.b3.title', textKey: 'bento.b3.text' },
  { icon: EyeOff, titleKey: 'bento.b4.title', textKey: 'bento.b4.text' },
  { icon: FolderOpen, titleKey: 'bento.b5.title', textKey: 'bento.b5.text' },
  { icon: ShieldCheck, titleKey: 'bento.b6.title', textKey: 'bento.b6.text' },
] as const

/** Bento grid : ce que le produit fait vraiment, avec une entrée orchestrée. */
export function BentoSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { t } = useLang()

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      gsap.from('.bento-card', {
        y: 44,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 78%' },
      })
    }, ref)

    return () => context.revert()
  }, [])

  return (
    <section id="produit" ref={ref} className="scroll-mt-24 px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="max-w-2xl font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
          {t('bento.title')}
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/70">{t('bento.sub')}</p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENTO.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.titleKey}
                className={`bento-card rounded-2xl border border-border bg-card p-6 ${'span' in item ? item.span : ''}`}
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary">
                  <Icon className="size-4" />
                </span>
                <h3 className="mt-4 font-heading text-lg font-medium">{t(item.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                  {t(item.textKey)}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

const FAQ = [
  { questionKey: 'faq.q1', answerKey: 'faq.a1' },
  { questionKey: 'faq.q2', answerKey: 'faq.a2' },
  { questionKey: 'faq.q3', answerKey: 'faq.a3' },
  { questionKey: 'faq.q4', answerKey: 'faq.a4' },
  { questionKey: 'faq.q5', answerKey: 'faq.a5' },
  { questionKey: 'faq.q6', answerKey: 'faq.a6' },
  { questionKey: 'faq.q7', answerKey: 'faq.a7' },
  { questionKey: 'faq.q8', answerKey: 'faq.a8' },
  { questionKey: 'faq.q9', answerKey: 'faq.a9' },
  { questionKey: 'faq.q10', answerKey: 'faq.a10' },
] as const

export function FaqSection() {
  const { t } = useLang()
  return (
    <section id="faq" className="scroll-mt-24 px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto w-full max-w-3xl">
        <h2 className="font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
          {t('nav.faq')}
        </h2>

        <div className="mt-10 divide-y divide-border border-y border-border">
          {FAQ.map((item) => (
            <details key={item.questionKey} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                {t(item.questionKey)}
                <span
                  aria-hidden="true"
                  className="text-muted-foreground transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">{t(item.answerKey)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
