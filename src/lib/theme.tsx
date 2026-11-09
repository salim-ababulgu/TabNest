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
let appliedDark: boolean | null = null
let transitionTimer = 0
const listeners = new Set<() => void>()

function computeDark(theme: Theme): boolean {
  return theme === 'dark' || (theme === 'system' && (media?.matches ?? false))
}

/**
 * Pendant ~300 ms, on autorise les couleurs à s'interpoler : le passage
 * clair/sombre glisse au lieu de « claquer ». La classe est retirée ensuite
 * pour ne pas transformer chaque survol en animation.
 */
function startColorTransition() {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const root = document.documentElement
  root.classList.add('theme-switching')
  window.clearTimeout(transitionTimer)
  transitionTimer = window.setTimeout(() => root.classList.remove('theme-switching'), 520)
}

function apply(theme: Theme) {
  const nextDark = computeDark(theme)
  // Aucune transition au tout premier rendu (évite un flash au chargement).
  if (appliedDark !== null && appliedDark !== nextDark) startColorTransition()
  currentDark = nextDark
  document.documentElement.classList.toggle('dark', currentDark)
  document.documentElement.style.colorScheme = currentDark ? 'dark' : 'light'
  appliedDark = nextDark
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
