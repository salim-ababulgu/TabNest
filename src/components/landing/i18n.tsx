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

function setGlobalLang(next: Lang) {
  if (next === currentLang) return
  currentLang = next
  saveLang(next)
  document.documentElement.lang = next
  for (const listener of listeners) listener()
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
