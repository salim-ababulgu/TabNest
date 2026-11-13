// Fonction Supabase « enrich » : pour une URL, renvoie l'image d'aperçu
// (og:image) et le favicon, sans jamais embarquer de clé dans l'extension.
// Priorité côté client : capture d'écran (à brancher) > og:image > favicon > rien.
// Exception : un site reconnu comme e-commerce ne renvoie QUE le favicon,
// pour ne pas afficher de produit ou de données personnelles.

const GOOGLE_FAVICON = 'https://www.google.com/s2/favicons'

const ECOMMERCE_DOMAINS =
  /(shop|store|boutique|cart|checkout|amazon|ebay|etsy|fnac|cdiscount|aliexpress|shopify|rakuten|marchand|vente|buy|monoprix|carrefour|leclerc|zalando|asos)/i

function domainOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

function isEcommerceDomain(host: string): boolean {
  return ECOMMERCE_DOMAINS.test(host)
}

function isEcommerceHtml(html: string): boolean {
  return (
    /"@type"\s*:\s*"(Product|OnlineStore|Store|ShoppingCenter)"/.test(html) ||
    /<meta[^>]*property=["']og:type["'][^>]*content=["']product["']/i.test(html)
  )
}

function pickMeta(html: string, names: string[]): string | null {
  for (const name of names) {
    const pattern = new RegExp(
      `<meta[^>]*(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']|<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`,
      'i',
    )
    const match = html.match(pattern)
    if (match) return (match[1] ?? match[2] ?? '').trim() || null
  }
  return null
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'FilnestBot/1.0 (+https://filnest.pages.dev)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return null
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) return null
    return await response.text()
  } catch {
    return null
  }
}

Deno.serve(async (request) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST requis' }), { status: 405, headers })
  }

  try {
    const { url } = await request.json()
    if (!url || !/^https?:\/\//i.test(url)) {
      return new Response(JSON.stringify({ error: 'url invalide' }), { status: 400, headers })
    }
    const host = domainOf(url)
    if (!host) {
      return new Response(JSON.stringify({ error: 'hôte invalide' }), { status: 400, headers })
    }
    // Anti-SSRF : on refuse les adresses locales et privées.
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|\[::1\])/i.test(host)) {
      return new Response(JSON.stringify({ error: 'hôte non autorisé' }), { status: 403, headers })
    }

    const favicon = `${GOOGLE_FAVICON}?domain=${encodeURIComponent(host)}&sz=128`

    if (isEcommerceDomain(host)) {
      return new Response(JSON.stringify({ favicon, ogImage: null, ecommerce: true }), { headers })
    }

    // On lit la page capturée ET la page d'accueil du domaine : ainsi un lien
    // profond (article, tableau de bord) retrouve quand même l'image de la
    // landing, même si l'utilisateur n'y est jamais allé.
    const html = await fetchHtml(url)
    const homeUrl = `https://${host}/`
    const homeHtml = homeUrl === url ? null : await fetchHtml(homeUrl)

    if ((html && isEcommerceHtml(html)) || (homeHtml && isEcommerceHtml(homeHtml))) {
      return new Response(JSON.stringify({ favicon, ogImage: null, ecommerce: true }), { headers })
    }

    const IMAGE_TAGS = ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']
    const pageImage = html ? pickMeta(html, IMAGE_TAGS) : null
    const homeImage = homeHtml ? pickMeta(homeHtml, IMAGE_TAGS) : null
    const ogImage = pageImage || homeImage
    const absolute = ogImage && /^https?:\/\//i.test(ogImage) ? ogImage : null

    return new Response(JSON.stringify({ favicon, ogImage: absolute, ecommerce: false }), { headers })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers })
  }
})
