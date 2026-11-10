import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { useLangValue } from '@/components/landing/i18n'
import { cn } from '@/lib/utils'

/** Bascule clair / sombre, disponible dès la page d'accueil. */
export function ThemeToggle({
  className,
  onDark = false,
}: {
  className?: string
  onDark?: boolean
}) {
  const { theme, setTheme } = useTheme()
  const { t } = useLangValue()
  const systemDark =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && systemDark)
  const label = isDark ? t('theme.toLight') : t('theme.toDark')

  return (
    <button
      type="button"
      onClick={(event) =>
        setTheme(isDark ? 'light' : 'dark', { x: event.clientX, y: event.clientY })
      }
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors',
        onDark
          ? 'border-white/15 text-brand-cream/80 hover:text-brand-cream'
          : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </button>
  )
}
