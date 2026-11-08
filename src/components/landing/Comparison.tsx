import { useLang } from '@/components/landing/i18n'

const ROWS = ['r1', 'r2', 'r3', 'r4', 'r5'] as const

/**
 * Comparatif honnête avec les extensions locales de gestion d'onglets et de favoris.
 * On ne nomme aucun concurrent : on décrit une catégorie de produit.
 */
export function ComparisonSection() {
  const { t } = useLang()
  return (
    <section className="px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto w-full max-w-5xl">
        <h2 className="max-w-2xl font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl">
          {t('comparison.title')}
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/70">
          {t('comparison.sub')}
        </p>

        <table className="mt-10 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="w-1/4 py-3 pr-4 font-medium" />
              <th scope="col" className="py-3 pr-4 font-medium text-foreground/70">
                {t('comparison.local')}
              </th>
              <th scope="col" className="py-3 font-medium">
                {t('comparison.tabnest')}
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row} className="border-b border-border align-top">
                <th scope="row" className="py-4 pr-4 font-medium">
                  {t(`comparison.${row}.label`)}
                </th>
                <td className="py-4 pr-4 leading-relaxed text-foreground/70">
                  {t(`comparison.${row}.local`)}
                </td>
                <td className="py-4 leading-relaxed">{t(`comparison.${row}.tabnest`)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {t('comparison.note')}
        </p>
      </div>
    </section>
  )
}
