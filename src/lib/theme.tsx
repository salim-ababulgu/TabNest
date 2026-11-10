import { useCallback, useMemo, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ThemeOrigin = { x: number; y: number } | null

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
 * Applique le thème immédiatement. Renvoie vrai si la luminosité a réellement
 * changé (utile pour ne pas animer au premier rendu).
 */
function commit(theme: Theme): boolean {
  const nextDark = computeDark(theme)
  const changed = appliedDark !== null && appliedDark !== nextDark
  currentDark = nextDark
  document.documentElement.classList.toggle('dark', currentDark)
  document.documentElement.style.colorScheme = currentDark ? 'dark' : 'light'
  appliedDark = nextDark
  return changed
}

/**
 * Repli sans View Transitions : pendant ~300 ms on autorise les couleurs à
 * s'interpoler, puis on retire la classe pour ne pas animer chaque survol.
 */
function startColorTransition() {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const root = document.documentElement
  root.classList.add('theme-switching')
  window.clearTimeout(transitionTimer)
  transitionTimer = window.setTimeout(() => root.classList.remove('theme-switching'), 520)
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> }
}

function apply(theme: Theme, origin: ThemeOrigin = null) {
  const root = document.documentElement
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const doc = document as ViewTransitionDocument
  const nextDark = computeDark(theme)
  const willChange = appliedDark !== null && appliedDark !== nextDark

  // Cercle qui se déploie depuis le bouton cliqué (Chrome / Edge récents).
  if (willChange && origin && !reduced && typeof doc.startViewTransition === 'function') {
    const radius = Math.hypot(
      Math.max(origin.x, window.innerWidth - origin.x),
      Math.max(origin.y, window.innerHeight - origin.y),
    )
    root.style.setProperty('--theme-x', `${origin.x}px`)
    root.style.setProperty('--theme-y', `${origin.y}px`)
    root.style.setProperty('--theme-r', `${radius}px`)
    doc.startViewTransition(() => {
      commit(theme)
    })
    return
  }

  if (willChange) startColorTransition()
  commit(theme)
}

// Appliqué dès le chargement du module, avant le premier rendu (pas de flash).
apply(current)

media?.addEventListener?.('change', () => {
  if (current === 'system') {
    apply(current)
    for (const listener of listeners) listener()
  }
})

export function setTheme(next: Theme, origin: ThemeOrigin = null) {
  if (next === current) return
  current = next
  try {
    window.localStorage.setItem(KEY, next)
  } catch {
    // stockage indisponible
  }
  apply(next, origin)
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

  const set = useCallback((next: Theme, origin?: ThemeOrigin) => setTheme(next, origin), [])

  return useMemo(() => ({ theme, setTheme: set }), [theme, set])
}
