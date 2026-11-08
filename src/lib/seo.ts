import pages from '@/lib/seo-pages.json'

export type SeoLang = 'fr' | 'en' | 'es' | 'zh'

type PageMeta = { title: string; description: string }

const SITE = pages.site
const DEFAULT_LANG = pages.defaultLang as SeoLang

/** Les pages traduites (elles reçoivent une URL par langue). */
const TRANSLATED = Object.keys(pages.routes)
/** Les pages de contenu fixes, en français uniquement. */
const LEGAL = Object.keys(pages.legal)
/** Les écrans réservés, jamais indexés. */
const PRIVATE = Object.keys(pages.private)

function isTranslated(pathname: string): boolean {
  return TRANSLATED.includes(pathname)
}

/** La langue réellement servie pour cette URL (les pages légales restent en français). */
export function effectiveLang(pathname: string, lang: SeoLang): SeoLang {
  if (LEGAL.includes(pathname)) return 'fr'
  return lang
}

export function metaFor(pathname: string, lang: SeoLang): PageMeta | null {
  const priv = pages.private[pathname as keyof typeof pages.private]
  if (priv) return priv
  if (isTranslated(pathname)) {
    const route = pages.routes[pathname as keyof typeof pages.routes]
    const langs = route.languages as string[]
    const chosen = langs.includes(lang) ? lang : DEFAULT_LANG
    return {
      title: route.title[chosen as SeoLang],
      description: route.description[chosen as SeoLang],
    }
  }
  const legal = pages.legal[pathname as keyof typeof pages.legal]
  return legal ?? null
}

/** URL canonique : la racine pour le français, `?lang=xx` pour les autres versions. */
export function canonicalFor(pathname: string, lang: SeoLang): string {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/'
  const url = `${SITE}${clean === '/' ? '/' : clean}`
  if (!isTranslated(clean) || lang === DEFAULT_LANG) return url
  return `${url}?lang=${lang}`
}

function setMeta(kind: 'name' | 'property', key: string, value: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${kind}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(kind, key)
    document.head.appendChild(element)
  }
  if (element.getAttribute('content') !== value) element.setAttribute('content', value)
}

function setLink(rel: string, href: string): void {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.rel = rel
    document.head.appendChild(element)
  }
  if (element.getAttribute('href') !== href) element.setAttribute('href', href)
}

/**
 * Applique les métadonnées de la page courante : titre, description, adresse
 * canonique, aperçu social, indexation et langue du document.
 * Appelée à chaque changement de route ou de langue.
 */
export function applySeo(pathname: string, lang: SeoLang): void {
  const served = effectiveLang(pathname, lang)
  const meta = metaFor(pathname, served)

  document.documentElement.lang = served

  if (!meta) {
    document.title = 'Filnest'
    setMeta('name', 'robots', 'noindex, nofollow')
    return
  }

  const canonical = canonicalFor(pathname, served)
  const isPrivate = PRIVATE.includes(pathname)

  document.title = meta.title
  setMeta('name', 'description', meta.description)
  setMeta('name', 'robots', isPrivate ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
  setLink('canonical', canonical)

  setMeta('property', 'og:title', meta.title)
  setMeta('property', 'og:description', meta.description)
  setMeta('property', 'og:url', canonical)
  setMeta('name', 'twitter:title', meta.title)
  setMeta('name', 'twitter:description', meta.description)
}
