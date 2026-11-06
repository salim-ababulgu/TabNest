import { Check } from 'lucide-react'
import { ScreenshotFrame } from '@/components/landing/ScreenshotFrame'
import { useLang } from '@/components/landing/i18n'

type UseCase = {
  id: 'c1' | 'c2' | 'c3'
  src: string
  reason: string
  tone: 'light' | 'dark'
  crop?: 'top' | 'center'
  portrait?: boolean
  className?: string
}

const CASES: UseCase[] = [
  {
    id: 'c1',
    src: '/screenshots/dashboard-mobile.png',
    reason: 'finish',
    tone: 'light',
    portrait: true,
    className: 'mx-auto max-w-[240px]',
  },
  {
    id: 'c2',
    src: '/screenshots/dashboard-detail.png',
    reason: 'explore',
    tone: 'dark',
    crop: 'center',
  },
  {
    id: 'c3',
    src: '/screenshots/dashboard-grid.png',
    reason: 'remember',
    tone: 'light',
  },
]

/** Trois histoires d'usage réelles : une raison, une durée, un résultat. */
export function UseCasesSection() {
  const { t, list } = useLang()
  return (
    <section className="px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="max-w-2xl font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl">
          {t('usecase.title')}
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/70">
          {t('usecase.sub')}
        </p>

        <div className="mt-14 space-y-20">
          {CASES.map((item, index) => (
            <div key={item.id} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
              <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/70">
                  <span className="size-1.5 rounded-full bg-lime" aria-hidden="true" />
                  {t(`reason.${item.reason}`)}
                </span>
                <h3 className="mt-3 font-heading text-2xl leading-snug font-medium tracking-tight">
                  {t(`usecase.${item.id}.title`)}
                </h3>
                <ul className="mt-5 space-y-2.5 text-sm leading-relaxed text-foreground/70">
                  {list(`usecase.${item.id}.steps`).map((step) => (
                    <li key={step} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-lime" aria-hidden="true" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <ScreenshotFrame
                src={item.src}
                alt={t(`usecase.${item.id}.alt`)}
                tone={item.tone}
                crop={'crop' in item ? item.crop : 'top'}
                portrait={'portrait' in item ? item.portrait : false}
                className={item.className ?? ''}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
