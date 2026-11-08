import { BeforeAfter } from '@/components/landing/BeforeAfter'
import { useLang } from '@/components/landing/i18n'

/**
 * Premier écran : l'accroche, les deux actions demandées (installer
 * l'extension, créer un compte) et la preuve, une vraie capture du produit.
 */
export function Hero({ onStart }: { onStart: () => void }) {
  const { t } = useLang()

  return (
    <section className="relative overflow-hidden bg-field text-field-ink">
      <div className="mx-auto w-full max-w-[1240px] px-6 pt-24 md:px-10 md:pt-32">
        <h1 className="max-w-[15ch] font-heading text-[clamp(3rem,7.4vw,6.5rem)] leading-[0.92] tracking-[-0.035em]">
          <span className="block">{t('hero.h1a')}</span>
          <span className="block">{t('hero.h1b')}</span>
        </h1>

        <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-12 md:items-end md:gap-8">
          <p className="max-w-[46ch] text-[1.0625rem] leading-[1.65] text-field-muted md:col-span-6">
            {t('hero.sub')}
          </p>

          <div className="flex flex-col items-start gap-5 md:col-span-6 md:items-end">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/extension"
                className="hidden h-12 items-center justify-center rounded-full bg-lime px-7 text-[0.9375rem] font-semibold text-lime-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:inline-flex"
              >
                {t('hero.ctaInstall')}
              </a>
              <button
                type="button"
                onClick={onStart}
                className="inline-flex h-12 items-center justify-center rounded-full bg-lime px-7 text-[0.9375rem] font-semibold text-lime-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:bg-transparent sm:px-6 sm:font-medium sm:text-field-ink sm:underline sm:decoration-field-ink/30 sm:decoration-1 sm:underline-offset-[6px] sm:hover:translate-y-0 sm:hover:decoration-field-ink"
              >
                {t('hero.ctaSignup')}
              </button>
            </div>
            <p className="text-sm text-field-muted">{t('hero.note')}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-16 w-full max-w-[1240px] px-6 pb-16 md:mt-24 md:px-10 md:pb-24">
        <BeforeAfter />
      </div>
    </section>
  )
}
