import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { useLangValue } from '@/components/landing/i18n'
import type { Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const LANGS: { id: Lang; code: string; label: string }[] = [
  { id: 'fr', code: 'FR', label: 'Français' },
  { id: 'en', code: 'EN', label: 'English' },
  { id: 'es', code: 'ES', label: 'Español' },
  { id: 'zh', code: '中文', label: '中文（简体）' },
]

/**
 * Sélecteur de langue personnalisé : un bouton compact (code + globe) qui
 * ouvre un menu avec les noms complets et la langue active cochée.
 */
export function LanguageSelector({
  onDark = false,
  className,
}: {
  onDark?: boolean
  className?: string
}) {
  const { lang, setLang } = useLangValue()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LANGS.find((item) => item.id === lang) ?? LANGS[0]

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Changer de langue"
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors',
          onDark
            ? 'border-white/15 bg-white/[0.06] text-field-ink hover:bg-white/[0.12]'
            : 'border-border text-foreground hover:bg-accent',
        )}
      >
        <Globe className="size-3.5" aria-hidden="true" />
        {current.code}
        <ChevronDown
          className={cn('size-3.5 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Langues"
          className={cn(
            'absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border p-1',
            onDark
              ? 'border-white/15 bg-field text-field-ink'
              : 'border-border bg-popover text-popover-foreground',
          )}
        >
          {LANGS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={item.id === lang}
                onClick={() => {
                  setLang(item.id)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors',
                  item.id === lang ? 'bg-accent font-medium' : 'hover:bg-accent/60',
                )}
              >
                {item.label}
                {item.id === lang && <Check className="size-3.5 text-lime" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
