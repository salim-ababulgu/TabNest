import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Check } from 'lucide-react'
import { ScreenshotFrame } from '@/components/landing/ScreenshotFrame'
import { Eyebrow } from '@/components/landing/Eyebrow'
import { AsciiImage } from '@/components/ui/ascii-image'
import { Reveal } from '@/components/landing/Reveal'
import { useLang } from '@/components/landing/i18n'
import { computeExpiry } from '@/lib/lifetime'
import { REASON_HOURS, REASON_ORDER } from '@/lib/reason'
import type { Reason } from '@/lib/reason'

/** Bandeau défilant des types de pages conservées. */
export function PageTypeMarquee() {
  const trackRef = useRef<HTMLDivElement>(null)
  const { t, list } = useLang()
  const items = list('marquee.items')

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const tween = gsap.to(track, { xPercent: -50, duration: 46, ease: 'none', repeat: -1 })
    return () => {
      tween.kill()
    }
  }, [])

  return (
    <section
      aria-label={t('marquee.label')}
      className="overflow-hidden bg-background py-16 md:py-24"
    >
      <div ref={trackRef} className="flex w-max items-center gap-12 px-6">
        {[...items, ...items].map((label, index) => (
          <span
            key={`${label}-${index}`}
            aria-hidden={index >= items.length}
            className="font-heading text-xl whitespace-nowrap text-foreground/45 md:text-2xl"
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

/** Comment ça marche : trois gestes, puis plus rien à faire. */
export function StepsSection() {
  const { t } = useLang()

  return (
    <section
      id="comment"
      className="mx-auto w-full max-w-[1320px] scroll-mt-24 px-6 py-32 md:px-10 md:py-52"
    >
      <Reveal>
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <Eyebrow>{t('steps.eyebrow')}</Eyebrow>
            <h2 className="mt-4 font-heading text-[clamp(2.1rem,4.4vw,3.9rem)] leading-[1] tracking-[-0.03em]">
              {t('steps.title')}
            </h2>
          </div>
          <p className="max-w-[44ch] text-[1.0625rem] leading-[1.65] text-foreground/70 md:col-span-5">
            {t('steps.sub')}
          </p>
        </div>
      </Reveal>

      <div className="mt-16 grid gap-12 md:mt-28 md:grid-cols-3 md:gap-12">
        {STEPS.map((step, index) => (
          <Reveal key={step.titleKey} delay={index * 90}>
            <h3 className="font-heading text-[1.5rem] leading-snug tracking-[-0.01em]">
              {t(step.titleKey)}
            </h3>
            <p className="mt-4 max-w-[34ch] text-[1rem] leading-[1.7] text-foreground/70">
              {t(step.textKey)}
            </p>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-20 md:mt-32">
        <ScreenshotFrame
          src="/screenshots/dashboard-grid.png"
          alt={t('steps.alt2')}
          tone="light"
        />
      </Reveal>
    </section>
  )
}

const LOCALES: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  es: 'es-ES',
  zh: 'zh-CN',
}

const MAX_DAYS = (REASON_HOURS.remember / 24) || 90

/**
 * Démonstration vivante : on choisit une raison, la page montre
 * la durée de vie que le produit lui donne vraiment (même calcul).
 */
function LifetimeDemo() {
  const { t, lang } = useLang()
  const [reason, setReason] = useState<Reason>('remember')
  // Date figée à l'ouverture de la page : le calcul reste stable entre deux rendus.
  const [now] = useState(() => new Date())
  const days = REASON_HOURS[reason] / 24
  const percent = Math.max(3, Math.round((days / MAX_DAYS) * 100))
  const expires = new Intl.DateTimeFormat(LOCALES[lang] ?? 'fr-FR', {
    day: 'numeric',
    month: 'long',
  }).format(new Date(computeExpiry('normal', 0, now, reason)))

  return (
    <div className="rounded-[1.5rem] bg-card p-6 text-card-foreground sm:p-9">
      <p className="text-sm text-muted-foreground">{t('lifetime.choose')}</p>

      <div role="group" aria-label={t('lifetime.choose')} className="mt-4 flex flex-wrap gap-2">
        {REASON_ORDER.map((item) => {
          const active = item === reason
          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => setReason(item)}
              className={
                'inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors ' +
                (active
                  ? 'bg-lime text-lime-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent')
              }
            >
              {t(`reason.${item}`)}
            </button>
          )
        })}
      </div>

      <p className="mt-6 text-[0.9375rem] leading-relaxed text-foreground/70">
        {t(`lifetime.r.${reason}`)}
      </p>

      <div className="mt-8 flex items-baseline gap-3">
        <span className="font-heading text-[clamp(3rem,7vw,4.75rem)] leading-none tracking-[-0.03em] tabular-nums">
          {days}
        </span>
        <span className="text-base text-foreground/70">{t('lifetime.unit')}</span>
      </div>

      <div
        className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-secondary"
        role="img"
        aria-label={`${days} ${t('lifetime.unit')}`}
      >
        <div
          className="h-full rounded-full bg-lime transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 text-sm">
        <span className="text-foreground/70">
          {t('lifetime.expires')} <span className="text-foreground">{expires}</span>
        </span>
        <span className="text-muted-foreground">{t('lifetime.visits')}</span>
      </div>
    </div>
  )
}

/** Le principe : une durée de vie par page, choisie par la raison de la garder. */
export function LifetimeSection() {
  const { t } = useLang()

  return (
    <section id="principe" className="scroll-mt-24 bg-field text-field-ink">
      <div className="mx-auto w-full max-w-[1320px] px-6 py-32 md:px-10 md:py-52">
        <div className="grid gap-14 md:grid-cols-12 md:items-center md:gap-16">
          <Reveal className="md:col-span-5">
            <Eyebrow onDark>{t('lifetime.eyebrow')}</Eyebrow>
            <h2 className="mt-4 font-heading text-[clamp(1.95rem,3.2vw,3.05rem)] leading-[1.03] tracking-[-0.03em]">
              {t('lifetime.title')}
            </h2>
            <p className="mt-8 max-w-[42ch] text-[1.0625rem] leading-[1.65] text-field-muted">
              {t('lifetime.text')}
            </p>
            <p className="mt-6 max-w-[40ch] text-sm leading-relaxed text-field-muted">
              {t('lifetime.note')}
            </p>
          </Reveal>
          <Reveal delay={120} className="md:col-span-7">
            <LifetimeDemo />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/** Les projets : une page ne vit pas seule, elle appartient à une intention. */
export function ProjectsSection() {
  const { t } = useLang()

  return (
    <section
      id="projets"
      className="mx-auto w-full max-w-[1320px] scroll-mt-24 px-6 py-32 md:px-10 md:py-52"
    >
      <div className="grid gap-14 md:grid-cols-12 md:items-center md:gap-16">
        <Reveal className="md:col-span-5">
          <Eyebrow>{t('split.projects.eyebrow')}</Eyebrow>
          <h2 className="mt-4 font-heading text-[clamp(1.95rem,3.2vw,3.05rem)] leading-[1.03] tracking-[-0.03em]">
            {t('split.projects.title')}
          </h2>
          <p className="mt-8 max-w-[42ch] text-[1.0625rem] leading-[1.65] text-foreground/70">
            {t('split.projects.text')}
          </p>
        </Reveal>
        <Reveal delay={120} className="md:col-span-7">
          <ScreenshotFrame
            src="/screenshots/dashboard-detail.png"
            alt={t('split.detail.alt')}
            crop="center"
          />
        </Reveal>
      </div>
    </section>
  )
}

const EXTENSION_FACTS = ['extension.f1', 'extension.f2', 'extension.f3'] as const

/** L'extension : le geste à faire pour que tout le reste existe. */
export function ExtensionSection() {
  const { t } = useLang()

  return (
    <section id="extension" className="scroll-mt-24 bg-secondary">
      <div className="mx-auto w-full max-w-[1320px] px-6 py-32 md:px-10 md:py-48">
        <div className="grid gap-14 md:grid-cols-12 md:items-center md:gap-16">
          <Reveal className="md:col-span-6">
            <Eyebrow>{t('extension.eyebrow')}</Eyebrow>
            <h2 className="mt-4 font-heading text-[clamp(1.95rem,3.2vw,3.05rem)] leading-[1.03] tracking-[-0.03em]">
              {t('extension.title')}
            </h2>
            <p className="mt-8 max-w-[42ch] text-[1.0625rem] leading-[1.65] text-foreground/75">
              {t('extension.text')}
            </p>

            <ul className="mt-8 space-y-3">
              {EXTENSION_FACTS.map((key) => (
                <li key={key} className="flex items-start gap-3 text-[0.9375rem] leading-relaxed">
                  <Check className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden="true" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <a
                href="/extension"
                className="hidden h-12 items-center justify-center rounded-full bg-primary px-7 text-[0.9375rem] font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:inline-flex"
              >
                {t('extension.cta')}
              </a>
              <span className="text-sm text-foreground/70">{t('extension.note')}</span>
              <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground/75 sm:hidden">
                {t('extension.mobileNote')}
              </p>
            </div>
          </Reveal>

          <Reveal delay={120} className="md:col-span-6">
            <div className="mx-auto w-full max-w-[560px] rounded-[1.5rem] bg-card p-8 sm:p-12">
              <AsciiImage
                src="/screenshots/popup-connected.png"
                alt={t('extension.alt')}
                className="mx-auto block w-full max-w-[360px] rounded-[1.25rem]"
                imgClassName="block w-full rounded-[1.25rem]"
              />
            </div>
            <p className="mt-4 text-center text-sm text-foreground/65">{t('extension.caption')}</p>
          </Reveal>
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
    <section
      id="faq"
      className="mx-auto w-full max-w-[1320px] scroll-mt-24 px-6 py-32 md:px-10 md:py-52"
    >
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-4">
          <Eyebrow>{t('faq.eyebrow')}</Eyebrow>
          <h2 className="mt-4 font-heading text-[clamp(2.1rem,4.4vw,3.9rem)] leading-[1] tracking-[-0.03em]">
            {t('nav.faq')}
          </h2>
        </div>

        <div className="md:col-span-8">
          {FAQ.map((item) => (
            <details key={item.questionKey} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[1.0625rem] font-medium">
                <span>{t(item.questionKey)}</span>
                <span
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-xl leading-none text-foreground/70 transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-[62ch] text-[0.9375rem] leading-[1.7] text-foreground/70">
                {t(item.answerKey)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
