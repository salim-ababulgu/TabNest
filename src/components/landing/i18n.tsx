import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'
import type { ReactNode } from 'react'
import { detectLang, saveLang } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'
import { lookup } from '@/lib/i18n-dash'

export type LangContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
  list: (key: string) => string[]
}

// Magasin partagé : un seul état de langue pour toute l'application, quel que
// soit le nombre de composants qui appellent useLangValue (landing, dashboard,
// navigation mobile, formulaires…). Changer la langue depuis les paramètres
// met à jour tous les écrans montés.
let currentLang: Lang = detectLang()
const listeners = new Set<() => void>()

// Une URL par langue : la langue choisie s'écrit dans l'adresse des pages
// traduites, pour que le lien partagé ouvre la bonne version.
function syncLangInUrl(next: Lang) {
  if (typeof window === 'undefined') return
  const path = window.location.pathname
  if (path !== '/' && path !== '/extension') return
  try {
    const url = new URL(window.location.href)
    if (next === 'fr') url.searchParams.delete('lang')
    else url.searchParams.set('lang', next)
    window.history.replaceState(window.history.state, '', url)
  } catch {
    // historique indisponible
  }
}

function setGlobalLang(next: Lang) {
  if (next === currentLang) return
  currentLang = next
  saveLang(next)
  syncLangInUrl(next)
  document.documentElement.lang = next
  // Prévient l'extension (synchronisation de la langue dans les deux sens).
  window.dispatchEvent(new CustomEvent('tabnest:lang-changed', { detail: { lang: next } }))
  for (const listener of listeners) listener()
}

// L'extension peut imposer la langue : on l'applique sans recharger la page.
const LANGS: Lang[] = ['fr', 'en', 'es', 'zh']
if (typeof window !== 'undefined') {
  window.addEventListener('tabnest:lang', (event) => {
    const requested = (event as CustomEvent<{ lang?: Lang }>).detail?.lang
    if (requested && LANGS.includes(requested)) setGlobalLang(requested)
  })
}

/** Version autonome (sans fournisseur), partagée entre tous les écrans. */
export function useLangValue(): LangContextValue {
  const lang = useSyncExternalStore(
    (callback) => {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
    () => currentLang,
  )

  const setLang = useCallback((next: Lang) => setGlobalLang(next), [])

  const t = useCallback(
    (key: string) => {
      const entry = lookup(lang, key)
      return typeof entry === 'string' ? entry : (entry ?? []).join(' · ')
    },
    [lang],
  )

  const list = useCallback(
    (key: string) => {
      const entry = lookup(lang, key)
      return Array.isArray(entry) ? entry : []
    },
    [lang],
  )

  return useMemo(() => ({ lang, setLang, t, list }), [lang, setLang, t, list])
}

const LangContext = createContext<LangContextValue>({
  lang: 'fr',
  setLang: () => {},
  t: (key) => key,
  list: () => [],
})

export function LangProvider({ children }: { children: ReactNode }) {
  const value = useLangValue()

  useEffect(() => {
    document.documentElement.lang = value.lang
  }, [value.lang])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): LangContextValue {
  return useContext(LangContext)
}
