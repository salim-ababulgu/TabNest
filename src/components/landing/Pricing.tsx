import { Check } from 'lucide-react'
import { BILLING_READY, PLANS } from '@/lib/billing'

export function PricingSection() {
  return (
    <section id="tarifs" className="scroll-mt-24 px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="max-w-2xl font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
          Gratuit pour commencer.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/70">
          TabNest reste gratuit pour garder vos pages. Les formules payantes ajouteront du confort,
          jamais l’essentiel.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-2xl border p-6 ${
                  plan.highlight
                    ? 'border-lime bg-card'
                    : 'border-border bg-card/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-heading text-lg font-medium">{plan.name}</h3>
                  {plan.highlight && (
                    <span className="rounded-full bg-lime px-2 py-0.5 text-[10px] font-semibold text-lime-foreground">
                      Recommandé
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-foreground/60">{plan.description}</p>

                <p className="mt-5">
                  <span className="font-heading text-3xl font-medium">{plan.price}</span>{' '}
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                </p>

                <ul className="mt-5 space-y-2 text-sm text-foreground/75">
                  {plan.features.map((feature) => (
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
                      Commencer gratuitement
                    </a>
                  ) : plan.checkoutUrl ? (
                    <a
                      href={plan.checkoutUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 w-full items-center justify-center rounded-full bg-lime text-sm font-semibold text-lime-foreground transition-colors hover:bg-lime/90"
                    >
                      Choisir cette offre
                    </a>
                  ) : (
                    <span className="flex h-10 w-full items-center justify-center rounded-full border border-dashed border-border text-xs text-muted-foreground">
                      Bientôt disponible
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
          {BILLING_READY
            ? 'Paiement sécurisé par Lemon Squeezy, vendeur enregistré. Aucune donnée bancaire n’est stockée par TabNest. Vous pouvez annuler à tout moment.'
            : 'Les paiements ne sont pas encore ouverts : l’activité est en cours d’immatriculation. Les tarifs affichés sont indicatifs et ne constituent pas une offre de vente.'}
        </p>
      </div>
    </section>
  )
}
