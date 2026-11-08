import { useLang } from '@/components/landing/i18n'
import { Reveal } from '@/components/landing/Reveal'

const ROWS = ['r1', 'r2', 'r3', 'r4', 'r5'] as const

/**
 * Comparatif honnête avec les extensions locales de gestion d'onglets et de favoris.
 * On ne nomme aucun concurrent : on décrit une catégorie de produit.
 */
export function ComparisonSection() {
  const { t } = useLang()

  return (
    <section className="mx-auto w-full max-w-[1240px] px-6 py-24 md:px-10 md:py-40">
      <Reveal>
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <h2 className="font-heading text-[clamp(1.95rem,3.2vw,3.05rem)] leading-[1.03] tracking-[-0.03em] md:col-span-7">
            {t('comparison.title')}
          </h2>
          <p className="max-w-[46ch] text-[1.0625rem] leading-[1.65] text-foreground/70 md:col-span-5">
            {t('comparison.sub')}
          </p>
        </div>
      </Reveal>

      <Reveal className="mt-16 md:mt-24">
        {/* Tableau lisible à partir de la tablette. */}
        <table className="hidden w-full border-collapse text-left text-[0.9375rem] md:table">
          <thead>
            <tr>
              <th scope="col" className="w-[22%] pb-6 font-normal" />
              <th scope="col" className="pb-6 pr-8 font-medium text-foreground/65">
                {t('comparison.local')}
              </th>
              <th scope="col" className="pb-6 font-medium">
                {t('comparison.tabnest')}
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row} className="align-top">
                <th scope="row" className="w-[22%] py-6 pr-8 font-medium">
                  {t(`comparison.${row}.label`)}
                </th>
                <td className="w-[39%] py-6 pr-8 leading-[1.6] text-foreground/65">
                  {t(`comparison.${row}.local`)}
                </td>
                <td className="w-[39%] py-6 leading-[1.6]">{t(`comparison.${row}.tabnest`)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Téléphone : une fiche par ligne, plus lisible qu'un tableau écrasé. */}
        <div className="space-y-10 md:hidden">
          {ROWS.map((row) => (
            <div key={row}>
              <p className="font-medium">{t(`comparison.${row}.label`)}</p>
              <p className="mt-3 leading-[1.6] text-foreground/65">
                <span className="block text-xs text-foreground/50">{t('comparison.local')}</span>
                {t(`comparison.${row}.local`)}
              </p>
              <p className="mt-3 leading-[1.6]">
                <span className="block text-xs text-foreground/50">{t('comparison.tabnest')}</span>
                {t(`comparison.${row}.tabnest`)}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-12 max-w-[70ch] text-xs leading-relaxed text-muted-foreground">
          {t('comparison.note')}
        </p>
      </Reveal>
    </section>
  )
}
