import { useCallback, useMemo, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const KEY = 'tabnest-theme'

const media =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

function readSaved(): Theme {
  try {
    const saved = window.localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch {
    // stockage indisponible
  }
  return 'system'
}

let current: Theme = readSaved()
let currentDark = false
const listeners = new Set<() => void>()

function computeDark(theme: Theme): boolean {
  return theme === 'dark' || (theme === 'system' && (media?.matches ?? false))
}

function apply(theme: Theme) {
  currentDark = computeDark(theme)
  document.documentElement.classList.toggle('dark', currentDark)
  document.documentElement.style.colorScheme = currentDark ? 'dark' : 'light'
}

// Appliqué dès le chargement du module, avant le premier rendu (pas de flash).
apply(current)

media?.addEventListener?.('change', () => {
  if (current === 'system') {
    apply(current)
    for (const listener of listeners) listener()
  }
})

export function setTheme(next: Theme) {
  if (next === current) return
  current = next
  try {
    window.localStorage.setItem(KEY, next)
  } catch {
    // stockage indisponible
  }
  apply(next)
  for (const listener of listeners) listener()
}

/** État de thème partagé dans toute l'application. */
export function useTheme() {
  const theme = useSyncExternalStore(
    (callback) => {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
    () => current,
  )

  const set = useCallback((next: Theme) => setTheme(next), [])

  return useMemo(() => ({ theme, setTheme: set }), [theme, set])
}
