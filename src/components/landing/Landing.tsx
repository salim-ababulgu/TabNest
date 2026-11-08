import { Hero } from '@/components/landing/Hero'
import {
  ExtensionSection,
  FaqSection,
  LifetimeSection,
  PageTypeMarquee,
  ProjectsSection,
  StepsSection,
} from '@/components/landing/Sections'
import { ComparisonSection } from '@/components/landing/Comparison'
import { PricingSection } from '@/components/landing/Pricing'
import { Reveal } from '@/components/landing/Reveal'
import { LangProvider, useLang } from '@/components/landing/i18n'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSelector } from '@/components/LanguageSelector'

type LandingProps = { onStart: (email?: string) => void }

const NAV = [
  { href: '#comment', key: 'steps.nav' },
  { href: '#principe', key: 'nav.principle' },
  { href: '#tarifs', key: 'pricing.nav' },
  { href: '#faq', key: 'nav.faq' },
] as const

function LandingContent({ onStart }: LandingProps) {
  const { t } = useLang()

  return (
    <div id="top" className="relative bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-field text-field-ink">
        <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between gap-4 px-6 md:h-[4.5rem] md:px-10">
          <a
            href="#top"
            className="font-heading text-[1.35rem] leading-none tracking-[-0.02em]"
            aria-label="Filnest"
          >
            Filnest
          </a>

          <nav className="hidden items-center gap-8 text-sm text-field-muted md:flex">
            {NAV.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-field-ink">
                {t(link.key)}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle onDark />
            <LanguageSelector onDark />
            <a
              href="/extension"
              className="inline-flex h-10 items-center rounded-full bg-lime px-4 text-sm font-semibold text-lime-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:px-5"
            >
              {t('nav.installShort')}
            </a>
          </div>
        </div>
      </header>

      <main>
        <Hero onStart={() => onStart()} />

        <PageTypeMarquee />

        <StepsSection />

        <LifetimeSection />

        <ProjectsSection />

        <ExtensionSection />

        <ComparisonSection />

        <PricingSection />

        <FaqSection />

        {/* CTA final */}
        <section className="bg-field text-field-ink">
          <div className="mx-auto w-full max-w-[1240px] px-6 py-24 md:px-10 md:py-36">
            <Reveal>
              <h2 className="mx-auto max-w-[18ch] text-center font-heading text-[clamp(2.4rem,5.6vw,4.75rem)] leading-[0.98] tracking-[-0.03em]">
                <span className="block">{t('cta.titlea')}</span>
                <span className="block">{t('cta.titleb')}</span>
              </h2>
              <p className="mx-auto mt-6 max-w-[46ch] text-center text-[1.0625rem] leading-[1.65] text-field-muted">
                {t('cta.sub')}
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="/extension"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-lime px-7 text-[0.9375rem] font-semibold text-lime-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {t('cta.install')}
                </a>
                <button
                  type="button"
                  onClick={() => onStart()}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-field-ink px-7 text-[0.9375rem] font-semibold text-field transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {t('cta.signup')}
                </button>
              </div>
              <p className="mt-6 text-center text-sm text-field-muted">{t('cta.note')}</p>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="bg-background px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto grid w-full max-w-[1240px] gap-12 text-sm sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-1">
            <p className="font-heading text-[1.35rem] leading-none tracking-[-0.02em]">Filnest</p>
            <p className="mt-4 max-w-[22ch] text-foreground/65">{t('footer.tagline')}</p>
          </div>

          <div>
            <p className="text-foreground/65">{t('footer.product')}</p>
            <ul className="mt-4 space-y-3 text-foreground/75">
              <li>
                <a href="#comment" className="hover:text-foreground">
                  {t('steps.nav')}
                </a>
              </li>
              <li>
                <a href="#principe" className="hover:text-foreground">
                  {t('nav.principle')}
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
            <p className="text-foreground/65">{t('footer.legal')}</p>
            <ul className="mt-4 space-y-3 text-foreground/75">
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
            <p className="text-foreground/65">{t('footer.contact')}</p>
            <ul className="mt-4 space-y-3 text-foreground/75">
              <li>
                <a href="mailto:salimababulgu@gmail.com" className="hover:text-foreground">
                  {t('footer.email')}
                </a>
              </li>
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-foreground/60">{t('footer.editor')}</p>
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
