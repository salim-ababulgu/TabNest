import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Clock, CornerDownLeft, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLangValue } from '@/components/landing/i18n'

export type SearchItem = {
  key: string
  title: string
  meta: string
  href?: string
  onSelect: () => void
}

/**
 * Barre de recherche « intelligente » : elle s'ouvre comme une palette.
 * - vide : les pages récentes, pour reprendre là où on s'est arrêté ;
 * - en cours de saisie : les meilleurs résultats, navigables au clavier.
 */
export function SearchPalette({
  query,
  onQueryChange,
  recents,
  results,
  inputRef,
  onOpen,
  scopeLabel,
  onToggleScope,
}: {
  query: string
  onQueryChange: (value: string) => void
  recents: SearchItem[]
  results: SearchItem[]
  inputRef: RefObject<HTMLInputElement | null>
  onOpen?: () => void
  scopeLabel: string
  onToggleScope: () => void
}) {
  const { t } = useLangValue()
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)

  const searching = query.trim().length > 0
  const items = searching ? results : recents
  const showList = open && items.length > 0

  useEffect(() => {
    setHighlight(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  function activate(item: SearchItem) {
    item.onSelect()
    setOpen(false)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      if (query) onQueryChange('')
      else setOpen(false)
      return
    }
    if (!showList) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight((current) => (current + 1) % items.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((current) => (current - 1 + items.length) % items.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = items[highlight] ?? items[0]
      if (item) activate(item)
    }
  }

  return (
    <div className="relative flex-1" ref={wrapRef} data-search-palette="">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            setOpen(true)
            onOpen?.()
          }}
          onKeyDown={onKeyDown}
          placeholder={t('dash.searchPlaceholder')}
          aria-label={t('dash.searchAria')}
          aria-expanded={showList}
          aria-controls="search-palette-list"
          autoComplete="off"
          className="h-11 w-full rounded-lg border border-border bg-background pr-20 pl-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              onQueryChange('')
              inputRef.current?.focus()
            }}
            aria-label={t('dash.searchClear')}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleScope}
        aria-pressed={!searching}
        className="absolute top-1/2 right-11 hidden h-8 -translate-y-1/2 items-center rounded-full border border-border px-2.5 text-[11px] font-medium text-foreground/70 hover:bg-accent sm:inline-flex"
        title={t('dash.searchScope')}
      >
        {scopeLabel}
      </button>

      {showList && (
        <div
          id="search-palette-list"
          role="listbox"
          aria-label={searching ? t('dash.searchResultsShort') : t('dash.recents')}
          className="absolute inset-x-0 top-[calc(100%+0.4rem)] z-50 overflow-hidden rounded-xl border border-border bg-popover shadow-none"
        >
          <p className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-[11px] font-medium text-foreground/60">
            {!searching && <Clock className="size-3.5" aria-hidden="true" />}
            {searching ? t('dash.searchResultsShort') : t('dash.recents')}
          </p>
          <ul className="max-h-80 overflow-y-auto py-1">
            {items.map((item, index) => (
              <li key={item.key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === highlight}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => activate(item)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                    index === highlight ? 'bg-accent' : 'hover:bg-accent/60',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-foreground/65">
                      {item.meta}
                    </span>
                  </span>
                  {index === highlight && (
                    <CornerDownLeft
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
          {searching && results.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              {t('dash.searchNoResultShort')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
