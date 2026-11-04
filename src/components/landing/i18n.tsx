import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { DICT, detectLang, saveLang } from '@/lib/i18n'
import type { Lang } from '@/lib/i18n'

type LangContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
  list: (key: string) => string[]
}

const LangContext = createContext<LangContextValue>({
  lang: 'fr',
  setLang: () => {},
  t: (key) => key,
  list: () => [],
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    saveLang(next)
  }, [])

  const t = useCallback(
    (key: string) => {
      const entry = DICT[lang][key] ?? DICT.fr[key]
      return typeof entry === 'string' ? entry : (entry ?? []).join(' · ')
    },
    [lang],
  )

  const list = useCallback(
    (key: string) => {
      const entry = DICT[lang][key] ?? DICT.fr[key]
      return Array.isArray(entry) ? entry : []
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t, list }), [lang, setLang, t, list])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): LangContextValue {
  return useContext(LangContext)
}
