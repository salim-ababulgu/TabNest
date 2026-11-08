import { useLang } from '@/components/landing/i18n'
import { Reveal } from '@/components/landing/Reveal'

const FACTS = ['1', '2', '3', '4'] as const

/**
 * Bandeau de faits réels du produit (aucune preuve sociale inventée) :
 * quatre grands chiffres, un par promesse vérifiable.
 */
export function FactBand() {
  const { t } = useLang()
  return (
    <section className="border-y border-border bg-background">
      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-2 gap-x-6 gap-y-12 px-6 py-16 md:grid-cols-4 md:px-10 md:py-24">
        {FACTS.map((index, position) => (
          <Reveal key={index} delay={position * 70}>
            <p className="font-heading text-[clamp(2.5rem,5.5vw,4.25rem)] leading-none tracking-[-0.03em]">
              {t(`facts.v${index}`)}
            </p>
            <p className="mt-4 max-w-[26ch] text-sm leading-relaxed text-foreground/70">
              {t(`facts.l${index}`)}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
