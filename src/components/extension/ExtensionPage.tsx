import {
  ArrowRight,
  Download,
  EyeOff,
  FolderOpen,
  Link2,
  MousePointerClick,
  Puzzle,
  ShieldCheck,
} from 'lucide-react'
import { useLangValue } from '@/components/landing/i18n'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ExtensionIllustration } from '@/components/extension/Illustration'

const STEPS = [
  { titleKey: 'ext.s1.title', textKey: 'ext.s1.text', icon: Download },
  { titleKey: 'ext.s2.title', textKey: 'ext.s2.text', icon: FolderOpen },
  { titleKey: 'ext.s3.title', textKey: 'ext.s3.text', icon: Link2 },
  { titleKey: 'ext.s4.title', textKey: 'ext.s4.text', icon: MousePointerClick },
] as const

export function ExtensionPage() {
  const { t } = useLangValue()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-lime text-xs font-semibold text-lime-foreground">
              F
            </span>
            <span className="font-heading text-lg font-semibold">Filnest</span>
          </a>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a
              href="/"
              className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {t('ext.back')}
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14">
        <div className="grid items-center gap-10 md:grid-cols-[1fr_320px]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              <Puzzle className="size-3.5" aria-hidden="true" />
              {t('ext.pill')}
            </p>

            <h1 className="mt-5 font-heading text-3xl leading-tight font-medium tracking-tight sm:text-4xl">
              {t('ext.title')}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/75">
              {t('ext.sub')}
            </p>
          </div>

          <ExtensionIllustration className="mx-auto w-full max-w-[320px]" />
        </div>

        <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-medium">{t('ext.download.title')}</h2>
            <p className="mt-1 text-sm leading-relaxed text-foreground/70">
              {t('ext.download.text')}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{t('ext.download.meta')}</p>
          </div>
          <a
            href="/downloads/tabnest-extension.zip"
            download="filnest-extension.zip"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-lime px-5 text-sm font-semibold text-lime-foreground hover:bg-lime/90"
          >
            {t('ext.download.button')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>

        <ol className="mt-12 grid gap-6 sm:grid-cols-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            return (
              <li
                key={step.titleKey}
                className="relative rounded-2xl border border-border bg-background p-5"
              >
                <span
                  aria-hidden="true"
                  className="grid size-9 place-items-center rounded-full bg-lime text-sm font-semibold text-lime-foreground"
                >
                  <Icon className="size-4" />
                </span>
                <h2 className="mt-3 font-heading text-base font-medium">
                  <span className="text-muted-foreground">{index + 1}.</span>{' '}
                  {t(step.titleKey)}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                  {t(step.textKey)}
                </p>
              </li>
            )
          })}
        </ol>

        <div className="mt-10 rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-heading text-base font-medium">
            <ShieldCheck className="size-4 text-lime" aria-hidden="true" />
            {t('ext.sees.title')}
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/70">
            <li className="flex gap-2">
              <EyeOff className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              {t('ext.sees.1')}
            </li>
            <li className="flex gap-2">
              <EyeOff className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              {t('ext.sees.2')}
            </li>
            <li className="flex gap-2">
              <EyeOff className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              {t('ext.sees.3')}
            </li>
          </ul>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">{t('ext.note')}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-lime px-6 text-sm font-semibold text-lime-foreground"
          >
            {t('ext.openApp')}
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <a
            href="/#comment"
            className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium hover:bg-accent"
          >
            {t('hero.how')}
          </a>
        </div>
      </main>
    </div>
  )
}
