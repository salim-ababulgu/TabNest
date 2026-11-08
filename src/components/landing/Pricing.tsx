import { Check } from 'lucide-react'
import { BILLING_READY, PLANS } from '@/lib/billing'
import { useLang } from '@/components/landing/i18n'
import { Eyebrow } from '@/components/landing/Eyebrow'
import { Reveal } from '@/components/landing/Reveal'

export function PricingSection() {
  const { t, list } = useLang()
  const free = PLANS.find((plan) => plan.id === 'free')
  const paid = PLANS.filter((plan) => plan.id !== 'free')
  const freeFeatures = list('plans.free.features')

  return (
    <section
      id="tarifs"
      className="mx-auto w-full max-w-[1320px] scroll-mt-24 px-6 py-32 md:px-10 md:py-52"
    >
      <Reveal>
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <Eyebrow>{t('pricing.eyebrow')}</Eyebrow>
            <h2 className="mt-4 font-heading text-[clamp(2.1rem,4.4vw,3.9rem)] leading-[1] tracking-[-0.03em]">
              {t('pricing.title')}
            </h2>
          </div>
          <p className="max-w-[46ch] text-[1.0625rem] leading-[1.65] text-foreground/70 md:col-span-5">
            {t('pricing.sub')}
          </p>
        </div>
      </Reveal>

      <Reveal className="mt-16 md:mt-24">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* La formule disponible aujourd'hui, la seule qui compte pour l'instant. */}
          <div className="rounded-[1.5rem] bg-card p-8 text-card-foreground sm:p-10 lg:col-span-7">
            <h3 className="font-heading text-2xl tracking-[-0.01em]">{t('plans.free.name')}</h3>
            <p className="mt-2 text-[0.9375rem] text-foreground/70">{t('plans.free.desc')}</p>

            <p className="mt-8 flex items-baseline gap-2">
              <span className="font-heading text-5xl leading-none tracking-[-0.03em]">
                {free?.price}
              </span>
              <span className="text-sm text-muted-foreground">{t('plans.free.period')}</span>
            </p>

            <ul className="mt-8 space-y-3 text-[0.9375rem]">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="/"
              className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-[0.9375rem] font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              {t('pricing.cta.free')}
            </a>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5">
            <p className="max-w-[46ch] text-[0.9375rem] leading-[1.7] text-foreground/70">
              {t('pricing.beta')}
            </p>

            {paid.map((plan) => (
              <div key={plan.id} className="rounded-[1.25rem] bg-secondary p-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-heading text-lg">{t(`plans.${plan.id}.name`)}</h3>
                  {BILLING_READY && <span className="text-sm text-foreground/70">{plan.price}</span>}
                </div>
                <p className="mt-1 text-sm text-foreground/65">{t(`plans.${plan.id}.desc`)}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {BILLING_READY ? t('pricing.cta.choose') : t('pricing.coming')}
                </p>
              </div>
            ))}

            <a
              href="mailto:salimababulgu@gmail.com?subject=Filnest%20-%20offres%20payantes"
              className="text-[0.9375rem] font-medium text-foreground underline decoration-foreground/30 underline-offset-[6px] transition-colors hover:decoration-foreground"
            >
              {t('pricing.waitlist')}
            </a>
          </div>
        </div>

        <p className="mt-12 max-w-[80ch] text-xs leading-relaxed text-muted-foreground">
          {BILLING_READY ? t('pricing.noteReady') : t('pricing.note')}
        </p>
      </Reveal>
    </section>
  )
}
