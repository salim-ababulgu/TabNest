import { useState } from 'react'
import type { ReactNode } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { Hero } from '@/components/landing/Hero'
import { BentoSection, FaqSection, PageTypeMarquee, PinnedSteps } from '@/components/landing/Sections'
import { ComparisonSection } from '@/components/landing/Comparison'
import { ScreenshotFrame } from '@/components/landing/ScreenshotFrame'
import { UseCasesSection } from '@/components/landing/UseCases'
import { PricingSection } from '@/components/landing/Pricing'
import { LangProvider, useLang } from '@/components/landing/i18n'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { Lang } from '@/lib/i18n'

type LandingProps = { onStart: (email?: string) => void }

function Reveal({
  children,
  className,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return <div className={className}>{children}</div>
}

function PillButton({
  children,
  onClick,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors ' +
        (className ?? '')
      }
    >
      {children}
    </button>
  )
}

function LandingContent({ onStart }: LandingProps) {
  const [email, setEmail] = useState('')
  const { lang, setLang, t } = useLang()

  return (
    <div id="top" className="relative bg-background text-foreground">
      <header className="fixed top-0 right-0 left-0 z-40 px-4 pt-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border border-white/10 bg-brand-ink px-4 py-2.5">
          <a href="#top" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-lime text-lime-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="font-heading text-lg font-semibold text-brand-cream">TabNest</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-brand-cream/60 md:flex">
            <a href="#principe" className="transition-colors hover:text-brand-cream">
              {t('nav.principle')}
            </a>
            <a href="#produit" className="transition-colors hover:text-brand-cream">
              {t('nav.product')}
            </a>
            <a href="#automatisation" className="transition-colors hover:text-brand-cream">
              {t('nav.automation')}
            </a>
            <a href="#projets" className="transition-colors hover:text-brand-cream">
              {t('nav.projects')}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle onDark />
            <select
              value={lang}
              onChange={(event) => setLang(event.target.value as Lang)}
              aria-label={t('nav.langAria')}
              className="h-9 cursor-pointer rounded-full border border-white/15 bg-brand-ink px-2 text-xs font-medium text-brand-cream/80 outline-none hover:text-brand-cream"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="zh">中文</option>
            </select>
            <PillButton onClick={() => onStart()} className="bg-lime text-lime-foreground hover:bg-lime/90">
              {t('nav.try')}
            </PillButton>
          </div>
        </div>
      </header>

      <Hero onStart={() => onStart()} />

      <PageTypeMarquee />

      {/* Comment ça marche */}
      <div id="comment" className="scroll-mt-24">
        <PinnedSteps />
      </div>

      <BentoSection />

      <ComparisonSection />

      <UseCasesSection />

      <PricingSection />

      {/* Le principe */}
      <section id="principe" className="grid md:grid-cols-2">
        <div className="flex items-center bg-background px-8 py-24 md:px-14 md:py-28">
          <Reveal className="w-full">
            <h2 className="font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl">
              {t('split.principle.title')}
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-foreground/60">
              {t('split.principle.text')}
            </p>
          </Reveal>
        </div>
        <div className="flex items-center bg-brand-ink px-8 py-24 text-brand-cream md:px-14 md:py-28">
          <Reveal delay={150} className="w-full">
            <ScreenshotFrame
              src="/screenshots/dashboard-mobile.png"
              alt={t('split.mobile.alt')}
              tone="dark"
              portrait
              className="mx-auto max-w-[240px]"
            />
          </Reveal>
        </div>
      </section>

      {/* Dark centered */}
      <section className="flex items-center bg-brand-ink px-6 py-24 text-center text-brand-cream md:py-32">
        <Reveal className="mx-auto max-w-5xl">
          <h2 className="font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl">
            {t('split.dark')}
          </h2>
        </Reveal>
      </section>

      {/* L'automatisation */}
      <section id="automatisation" className="grid md:grid-cols-2">
        <div className="flex items-center bg-brand-ink px-8 py-24 text-brand-cream md:px-14 md:py-28">
          <Reveal className="w-full">
            <h2 className="font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
              {t('split.auto.title')}
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-brand-cream/55">
              {t('split.auto.text')}
            </p>
          </Reveal>
        </div>
        <div className="flex items-center bg-brand-ink px-8 py-24 md:px-14 md:py-28">
          <Reveal delay={150} className="w-full">
            <ScreenshotFrame
              src="/screenshots/dashboard-detail.png"
              alt={t('split.detail.alt')}
              tone="dark"
              crop="center"
            />
          </Reveal>
        </div>
      </section>

      {/* Les projets */}
      <section id="projets" className="grid md:grid-cols-2">
        <div className="flex items-center bg-background px-8 py-24 md:px-14 md:py-28">
          <Reveal className="w-full">
            <h2 className="font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl">
              {t('split.projects.title')}
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-foreground/60">
              {t('split.projects.text')}
            </p>
          </Reveal>
        </div>
        <div className="flex items-center bg-background px-8 py-24 md:px-14 md:py-28">
          <Reveal delay={150} className="w-full">
            <ScreenshotFrame
              src="/screenshots/dashboard-grid.png"
              alt={t('split.grid.alt')}
              tone="light"
            />
          </Reveal>
        </div>
      </section>

      {/* Espace de travail */}
      <section className="grid md:grid-cols-2">
        <div className="flex items-center bg-brand-ink px-8 py-24 text-brand-cream md:px-14 md:py-28">
          <Reveal className="w-full">
            <h2 className="font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl">
              {t('split.focus.title')}
            </h2>
            <ul className="mt-8 space-y-3 text-sm text-brand-cream/65">
              <li className="flex items-center gap-2">
                <Check className="size-4 text-lime" /> {t('split.focus.l1')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 text-lime" /> {t('split.focus.l2')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 text-lime" /> {t('split.focus.l3')}
              </li>
            </ul>
          </Reveal>
        </div>
        <div className="flex items-center justify-center bg-brand-ink px-8 py-24 md:px-14 md:py-28">
          <Reveal delay={150}>
            <div className="grid size-64 place-items-center rounded-full border border-white/10 sm:size-72">
              <div className="grid size-44 place-items-center rounded-full border border-white/10 sm:size-52">
                <div className="grid size-28 place-items-center rounded-full bg-lime text-center text-lime-foreground sm:size-32">
                  <span>
                    <span className="block font-heading text-3xl">{t('split.focus.number')}</span>
                    <span className="block text-xs">{t('split.focus.badge')}</span>
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <FaqSection />

      {/* CTA final */}
      <section className="flex items-center bg-lime px-6 py-24 text-center text-lime-foreground md:py-32">
        <div className="mx-auto w-full max-w-3xl">
          <Reveal>
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-ink text-lime">
              <Sparkles className="size-5" />
            </span>
            <h2 className="mx-auto mt-4 max-w-4xl font-heading text-3xl leading-[1.02] tracking-tight sm:text-4xl md:text-5xl">
              {t('cta.title')}
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                onStart(email)
              }}
              className="mx-auto mt-10 flex max-w-md items-center gap-2 rounded-full bg-background p-1.5"
            >
              <input
                type="email"
                aria-label={t('cta.email')}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('cta.emailPlaceholder')}
                className="h-10 min-w-0 flex-1 bg-transparent px-4 text-left text-sm text-foreground outline-none placeholder:text-foreground/40"
              />
              <button
                type="submit"
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand-ink px-4 text-sm font-medium text-brand-cream transition-colors hover:bg-brand-ink/90"
              >
                {t('cta.button')}
              </button>
            </form>
            <p className="mt-4 text-xs text-foreground/50">{t('cta.note')}</p>
          </Reveal>
        </div>
      </section>

      {/* Confidentialité */}
      <section id="confidentialite" className="flex items-center bg-background px-6 py-24 md:py-32">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
            {t('privacy.title')}
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-foreground/60">{t('privacy.text')}</p>
        </Reveal>
      </section>

      <footer className="border-t border-border bg-background px-6 py-12 text-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 text-sm sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-lime text-lime-foreground">
                <Sparkles className="size-4" />
              </span>
              <span className="font-heading text-lg font-semibold">TabNest</span>
            </div>
            <p className="mt-3 max-w-[22ch] text-foreground/50">{t('footer.tagline')}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-foreground/45">{t('footer.product')}</p>
            <ul className="mt-3 space-y-2 text-foreground/70">
              <li>
                <a href="#comment" className="hover:text-foreground">
                  {t('hero.how')}
                </a>
              </li>
              <li>
                <a href="#produit" className="hover:text-foreground">
                  {t('nav.product')}
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-foreground">
                  {t('nav.faq')}
                </a>
              </li>
              <li>
                <a href="/extension" className="hover:text-foreground">
                  {t('nav.install')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium text-foreground/45">{t('footer.legal')}</p>
            <ul className="mt-3 space-y-2 text-foreground/70">
              <li>
                <a href="/mentions-legales" className="hover:text-foreground">
                  {t('footer.legalNotice')}
                </a>
              </li>
              <li>
                <a href="/confidentialite" className="hover:text-foreground">
                  {t('footer.privacy')}
                </a>
              </li>
              <li>
                <a href="/cgu" className="hover:text-foreground">
                  {t('footer.terms')}
                </a>
              </li>
              <li>
                <a href="/cookies" className="hover:text-foreground">
                  {t('footer.cookies')}
                </a>
              </li>
              <li>
                <a href="/remboursement" className="hover:text-foreground">
                  {t('footer.refund')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium text-foreground/45">{t('footer.contact')}</p>
            <ul className="mt-3 space-y-2 text-foreground/70">
              <li>
                <a href="mailto:salimababulgu@gmail.com" className="hover:text-foreground">
                  {t('footer.email')}
                </a>
              </li>
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-foreground/40">{t('footer.editor')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export function Landing({ onStart }: LandingProps) {
  return (
    <LangProvider>
      <LandingContent onStart={onStart} />
    </LangProvider>
  )
}
