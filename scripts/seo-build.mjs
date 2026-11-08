// Génère, après le build Vite, une page HTML statique par route publique.
//
// Pourquoi : l'application est une SPA. Sans ce passage, toutes les adresses
// (/extension, /cgu…) renverraient le même <head> que l'accueil, et les robots
// qui n'exécutent pas JavaScript (aperçus de liens, messageries, certains
// moteurs) ne verraient qu'une page vide.
//
// Chaque page générée garde le même corps et les mêmes scripts que l'accueil :
// l'application se charge normalement, seule l'en-tête change.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const root = readFileSync(join(DIST, 'index.html'), 'utf8')
const data = JSON.parse(readFileSync('src/lib/seo-pages.json', 'utf8'))

const SITE = data.site
const DEFAULT_LANG = data.defaultLang
const TODAY = new Date().toISOString().slice(0, 10)

const esc = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

// --- Découpage du HTML produit par Vite --------------------------------
const headStart = root.indexOf('<head>') + '<head>'.length
const headEnd = root.indexOf('</head>')
const head = root.slice(headStart, headEnd)
const body = root.slice(root.indexOf('<body>'))

// Les balises injectées par Vite (feuille de style, script, modulepreload)
// arrivent à la fin de l'en-tête : on les recopie telles quelles.
const injectedAt = Math.min(
  ...[head.indexOf('<link rel="stylesheet"'), head.indexOf('<script type="module"')].filter(
    (index) => index >= 0,
  ),
)
const injected = Number.isFinite(injectedAt) ? head.slice(injectedAt) : ''

function alternates(path, langs) {
  if (!langs || langs.length < 2) return ''
  return langs
    .map((lang) => {
      const href = lang === DEFAULT_LANG ? `${SITE}${path}` : `${SITE}${path}?lang=${lang}`
      return `    <link rel="alternate" hreflang="${lang}" href="${href}" />`
    })
    .concat([
      `    <link rel="alternate" hreflang="x-default" href="${SITE}${path}" />`,
    ])
    .join('\n')
}

function headFor({ title, description, canonical, robots, langs, path, jsonLd }) {
  const image = `${SITE}/og-filnest.jpg`
  return `  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta name="robots" content="${robots}" />
    <meta name="theme-color" content="#f6f1e4" />
    <meta name="color-scheme" content="light dark" />
${alternates(path, langs)}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="48x48" href="/icons/tabnest-48.png" />
    <link rel="apple-touch-icon" href="/icons/tabnest-128.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Filnest" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${image}" />
    <link rel="preconnect" href="https://kgrkujedgqsmdlltzyzs.supabase.co" crossorigin />
    <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
    </script>
${injected}
  </head>
`
}

function write(route, html) {
  const clean = route.replace(/^\/+|\/+$/g, '')
  mkdirSync(join(DIST, clean), { recursive: true })
  writeFileSync(join(DIST, clean, 'index.html'), html)
  // Filet de sécurité : certains hébergeurs servent /route depuis route.html.
  writeFileSync(join(DIST, `${clean}.html`), html)
}

function breadcrumb(name, path) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Filnest',
        item: `${SITE}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name,
        item: `${SITE}${path}`,
      },
    ],
  }
}

// --- Pages traduites ----------------------------------------------------
// Une seule page statique par adresse, dans la langue par défaut : la version
// anglaise, espagnole ou chinoise est servie avec `?lang=xx`, et le navigateur
// ajuste l'en-tête au chargement. Les versions linguistiques sont déclarées
// par hreflang ci-dessus et dans le plan du site.
for (const [path, route] of Object.entries(data.routes)) {
  // L'accueil garde l'en-tête écrit à la main dans index.html.
  if (path === '/') continue
  const lang = DEFAULT_LANG
  const canonical = `${SITE}${path}`
  const html = `<!doctype html>
<html lang="${lang}">
${headFor({
  title: route.title[lang],
  description: route.description[lang],
  canonical,
  robots: 'index, follow, max-image-preview:large, max-snippet:-1',
  langs: route.languages,
  path,
  jsonLd: {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        url: `${SITE}/`,
        name: 'Filnest',
        inLanguage: lang,
      },
      {
        '@type': 'WebPage',
        '@id': canonical,
        url: canonical,
        name: route.title[lang],
        description: route.description[lang],
        inLanguage: lang,
        isPartOf: { '@id': `${SITE}/#website` },
      },
    ],
  },
})}
${body}`
  write(path, html)
}

// --- Pages légales (français seulement) ---------------------------------
for (const [path, page] of Object.entries(data.legal)) {
  const canonical = `${SITE}${path}`
  const html = `<!doctype html>
<html lang="fr">
${headFor({
  title: page.title,
  description: page.description,
  canonical,
  robots: 'index, follow',
  path,
  jsonLd: breadcrumb(page.title.replace(' — Filnest', ''), path),
})}
${body}`
  write(path, html)
}

// --- Administration : jamais indexée ------------------------------------
{
  const path = '/admin'
  const html = `<!doctype html>
<html lang="fr">
${headFor({
  title: 'Administration — Filnest',
  description: 'Espace réservé à l’administration de Filnest.',
  canonical: `${SITE}${path}`,
  robots: 'noindex, nofollow',
  path,
  jsonLd: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Administration' },
})}
${body}`
  write(path, html)
}

// --- Page 404 -----------------------------------------------------------
const notFound = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Page introuvable — Filnest</title>
    <meta name="robots" content="noindex, follow" />
    <meta name="theme-color" content="#1f2c25" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: #1f2c25;
        color: #f6f1e4;
        font-family: 'Geist Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      main { max-width: 34rem; }
      p.brand {
        margin: 0 0 40px;
        font-family: 'Fraunces Variable', Georgia, serif;
        font-size: 22px;
        letter-spacing: -0.02em;
      }
      h1 {
        margin: 0;
        font-family: 'Fraunces Variable', Georgia, serif;
        font-size: clamp(2.2rem, 6vw, 3.4rem);
        line-height: 1.02;
        letter-spacing: -0.03em;
      }
      p.text { margin: 20px 0 32px; color: #a9b3a6; line-height: 1.65; }
      a.button {
        display: inline-flex;
        align-items: center;
        height: 46px;
        padding: 0 24px;
        border-radius: 999px;
        background: #e8a13c;
        color: #241a08;
        font-weight: 600;
        text-decoration: none;
      }
      a.second { margin-left: 18px; color: #f6f1e4; }
    </style>
  </head>
  <body>
    <main>
      <p class="brand">Filnest</p>
      <h1>Cette page n’existe pas.</h1>
      <p class="text">
        Le lien est peut-être ancien, ou l’adresse comporte une faute. Vos pages gardées, elles,
        sont toujours dans votre compte.
      </p>
      <a class="button" href="/">Revenir à l’accueil</a>
      <a class="second" href="/extension">Installer l’extension</a>
    </main>
  </body>
</html>
`
writeFileSync(join(DIST, '404.html'), notFound)

// --- Plan du site -------------------------------------------------------
function sitemapEntry(path, { langs, priority, changefreq }, lang) {
  const loc = lang && lang !== DEFAULT_LANG ? `${SITE}${path}?lang=${lang}` : `${SITE}${path}`
  const links =
    langs && langs.length > 1
      ? langs
          .map((item) => {
            const href = item === DEFAULT_LANG ? `${SITE}${path}` : `${SITE}${path}?lang=${item}`
            return `    <xhtml:link rel="alternate" hreflang="${item}" href="${href}" />`
          })
          .concat([`    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${path}" />`])
          .join('\n')
      : ''
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${links}
  </url>`
}

const entries = []
for (const [path, route] of Object.entries(data.routes)) {
  for (const lang of route.languages) {
    entries.push(sitemapEntry(path, { langs: route.languages, priority: path === '/' ? '1.0' : '0.8', changefreq: 'weekly' }, lang))
  }
}
for (const path of Object.keys(data.legal)) {
  entries.push(sitemapEntry(path, { priority: '0.3', changefreq: 'yearly' }))
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`
writeFileSync(join(DIST, 'sitemap.xml'), sitemap)

console.log(
  `SEO : ${Object.keys(data.routes).length + Object.keys(data.legal).length + 1} pages générées, sitemap et 404 prêts.`,
)
