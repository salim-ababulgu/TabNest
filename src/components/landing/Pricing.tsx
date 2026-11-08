import { Check } from 'lucide-react'
import { BILLING_READY, PLANS } from '@/lib/billing'
import { useLang } from '@/components/landing/i18n'

export function PricingSection() {
  const { t, list } = useLang()
  return (
    <section id="tarifs" className="scroll-mt-24 px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="max-w-2xl font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
          {t('pricing.title')}
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/70">
          {t('pricing.sub')}
        </p>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-lime/40 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-relaxed text-foreground/80">{t('pricing.beta')}</p>
          <a
            href="mailto:salimababulgu@gmail.com?subject=TabNest%20-%20offres%20payantes"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-border px-4 text-xs font-medium hover:bg-accent"
          >
            {t('pricing.waitlist')}
          </a>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1.35fr_1fr] md:items-start">
          {PLANS.map((plan) => {
            const features = list(`plans.${plan.id}.features`)
            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-2xl border ${
                  plan.highlight ? 'border-lime bg-card p-7' : 'border-border bg-background p-6'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`font-heading font-medium ${
                      plan.highlight ? 'text-xl' : 'text-lg'
                    }`}
                  >
                    {t(`plans.${plan.id}.name`)}
                  </h3>
                  {plan.highlight && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-foreground/70">
                      <span className="size-1.5 rounded-full bg-lime" aria-hidden="true" />
                      {t('pricing.rec')}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-foreground/70">{t(`plans.${plan.id}.desc`)}</p>

                <p className="mt-5">
                  {plan.id === 'free' || plan.checkoutUrl ? (
                    <>
                      <span
                        className={`font-heading font-medium ${
                          plan.highlight ? 'text-4xl' : 'text-3xl'
                        }`}
                      >
                        {plan.price}
                      </span>{' '}
                      <span className="text-xs text-muted-foreground">
                        {t(`plans.${plan.id}.period`)}
                      </span>
                    </>
                  ) : (
                    <span className="font-heading text-2xl font-medium text-muted-foreground">
                      {t('pricing.coming')}
                    </span>
                  )}
                </p>

                <ul className="mt-5 space-y-2 text-sm text-foreground/75">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  {plan.id === 'free' ? (
                    <a
                      href="/"
                      className="inline-flex h-10 w-full items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
                    >
                      {t('pricing.cta.free')}
                    </a>
                  ) : plan.checkoutUrl ? (
                    <a
                      href={plan.checkoutUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 w-full items-center justify-center rounded-full bg-lime text-sm font-semibold text-lime-foreground transition-colors hover:bg-lime/90"
                    >
                      {t('pricing.cta.choose')}
                    </a>
                  ) : (
                    <span className="flex h-10 w-full items-center justify-center rounded-full border border-dashed border-border text-xs text-muted-foreground">
                      {t('pricing.coming')}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
          {BILLING_READY ? t('pricing.noteReady') : t('pricing.note')}
        </p>
      </div>
    </section>
  )
}
