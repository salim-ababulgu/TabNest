import { SUPABASE_URL, SUPABASE_ANON_KEY, MICROLINK_API_KEY } from './config.js'

const IGNORED =
  /^(chrome|edge|about|chrome-extension|devtools|view-source|file|data|blob):/i
const APP_HOSTS = ['localhost:5173', '127.0.0.1:5173', 'tabnest-alb.pages.dev']
const CAPTURE_COOLDOWN_MS = 15000
const lastCaptured = new Map()

const SEARCH_PATTERNS = [
  /^https?:\/\/(www\.)?google\.[a-z.]+\/search/i,
  /^https?:\/\/(www\.)?bing\.com\/search/i,
  /^https?:\/\/duckduckgo\.com\//i,
  /^https?:\/\/search\.yahoo\.com\//i,
  /^https?:\/\/(www\.)?ecosia\.org\/search/i,
  /^https?:\/\/www\.qwant\.com\//i,
  /^https?:\/\/www\.startpage\.com\//i,
  /^https?:\/\/search\.brave\.com\//i,
  /^https?:\/\/yandex\.[a-z.]+\/search/i,
]

function isSearchPage(url) {
  return SEARCH_PATTERNS.some((pattern) => pattern.test(url))
}

function sanitizeUrl(url) {
  return typeof url === 'string' && /^(https?:|data:image)/i.test(url) ? url : ''
}

function sanitizeColor(color) {
  return typeof color === 'string' && /^(#[0-9a-f]{3,8}|rgb|hsl|oklch)/i.test(color.trim())
    ? color.trim()
    : ''
}

const BASE_HOURS = { normal: 72, documentation: 720, ephemeral: 168 }
const REASON_HOURS = { decide: 72, finish: 168, explore: 336, remember: 2160 }

function computeExpiry(kind, visits, reason) {
  const base =
    reason && REASON_HOURS[reason] ? REASON_HOURS[reason] : (BASE_HOURS[kind] ?? BASE_HOURS.normal)
  const ms = base * (1 + Math.max(0, visits) * 0.5) * 60 * 60 * 1000
  return new Date(Date.now() + ms).toISOString()
}

async function getSession() {
  const stored = await chrome.storage.local.get('session')
  const session = stored.session
  if (!session) return null
  if (session.expires_at && session.expires_at * 1000 > Date.now() + 60000) {
    return session
  }
  return refreshSession(session)
}

async function refreshSession(session) {
  if (!session.refresh_token) return null
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    })
    if (!res.ok) {
      console.warn('[TabNest] rafraîchissement de session échoué', res.status)
      await chrome.storage.local.remove('session')
      return null
    }
    const data = await res.json()
    const next = {
      ...session,
      ...data,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    }
    await chrome.storage.local.set({ session: next })
    return next
  } catch (error) {
    console.warn('[TabNest] rafraîchissement de session : erreur réseau', error)
    return null
  }
}

async function rememberTab(tabId, url, title, faviconUrl) {
  const { tabs = {} } = await chrome.storage.session.get('tabs')
  tabs[tabId] = { url, title, faviconUrl }
  await chrome.storage.session.set({ tabs })
}

async function forgetTab(tabId) {
  const { tabs = {} } = await chrome.storage.session.get('tabs')
  delete tabs[tabId]
  await chrome.storage.session.set({ tabs })
}

async function bumpBadge() {
  const { captures = 0 } = await chrome.storage.local.get('captures')
  const next = captures + 1
  await chrome.storage.local.set({ captures: next })
  try {
    await chrome.action.setBadgeBackgroundColor({ color: '#c8f05a' })
    await chrome.action.setBadgeTextColor({ color: '#161613' })
    await chrome.action.setBadgeText({ text: String(next) })
  } catch {
    // badge non critique
  }
}

async function sendPage(url, method, headers, body) {
  let res = await fetch(url, { method, headers, body: JSON.stringify(body) })
  if (!res.ok && ('favicon_url' in body || 'og_image_url' in body || 'theme_color' in body)) {
    const fallback = { ...body }
    delete fallback.favicon_url
    delete fallback.og_image_url
    delete fallback.theme_color
    res = await fetch(url, { method, headers, body: JSON.stringify(fallback) })
  }
  return res
}

const enrichedOnce = new Set()

async function enrichWithMicrolink(url) {
  if (!MICROLINK_API_KEY) return null
  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, {
      headers: { 'x-api-key': MICROLINK_API_KEY },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.data ?? null
  } catch {
    return null
  }
}

async function capture(url, title, faviconUrl, increment = true, ogImageUrl = '', themeColor = '') {
  if (!url || IGNORED.test(url) || isSearchPage(url)) return
  try {
    const parsed = new URL(url)
    if (APP_HOSTS.includes(parsed.host)) return
  } catch {
    return
  }

  const now = Date.now()
  if (increment) {
    const last = lastCaptured.get(url)
    if (last && now - last < CAPTURE_COOLDOWN_MS) return
  }

  const { captureEnabled = true } = await chrome.storage.local.get('captureEnabled')
  if (!captureEnabled) return

  const session = await getSession()
  if (!session?.access_token) return

  let favicon = sanitizeUrl(faviconUrl)
  let ogImage = sanitizeUrl(ogImageUrl)
  let finalTitle = title || ''
  const theme = sanitizeColor(themeColor)
  if (increment) lastCaptured.set(url, now)

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }

  try {
    const existingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/pages?select=id,visit_count,kind,reason,og_image_url&url=eq.${encodeURIComponent(url)}`,
      { headers },
    )
    if (!existingRes.ok) {
      console.warn('[TabNest] lecture de la page échouée', existingRes.status)
      return
    }
    const rows = await existingRes.json()
    const exists = Array.isArray(rows) && rows.length > 0

    const rowMissingImage = !exists || !rows[0]?.og_image_url
    if (rowMissingImage && !enrichedOnce.has(url) && (!ogImage || !favicon || !finalTitle)) {
      enrichedOnce.add(url)
      const enriched = await enrichWithMicrolink(url)
      if (enriched) {
        finalTitle = finalTitle || enriched.title || ''
        const image = sanitizeUrl(enriched.image?.url)
        const logo = sanitizeUrl(enriched.logo?.url)
        if (!favicon && logo) favicon = logo
        if (!ogImage && image) ogImage = image
      }
    }

    if (exists) {
      const page = rows[0]
      const body = {}

      if (increment) {
        const visits = (page.visit_count ?? 0) + 1
        body.visit_count = visits
        body.last_visited_at = new Date().toISOString()
        body.expires_at = computeExpiry(page.kind ?? 'normal', visits, page.reason)
        body.title = finalTitle || null
      } else if (finalTitle) {
        body.title = finalTitle
      }
      if (favicon) body.favicon_url = favicon
      if (ogImage) body.og_image_url = ogImage
      if (theme) body.theme_color = theme
      if (Object.keys(body).length === 0) return

      const updateRes = await sendPage(
        `${SUPABASE_URL}/rest/v1/pages?id=eq.${page.id}`,
        'PATCH',
        headers,
        body,
      )
      if (!updateRes.ok) {
        console.warn('[TabNest] mise à jour de la page échouée', updateRes.status)
        return
      }
    } else {
      const insertRes = await sendPage(
        `${SUPABASE_URL}/rest/v1/pages`,
        'POST',
        { ...headers, Prefer: 'return=minimal' },
        {
          user_id: session.user.id,
          url,
          title: finalTitle || null,
          favicon_url: favicon || null,
          og_image_url: ogImage || null,
          theme_color: theme || null,
          kind: 'normal',
          visit_count: 1,
          last_visited_at: new Date().toISOString(),
          expires_at: computeExpiry('normal', 0),
        },
      )
      if (!insertRes.ok) {
        console.warn('[TabNest] insertion de la page échouée', insertRes.status)
        return
      }
    }

    console.log('[TabNest] capturée', increment ? '(visite)' : '(maj)', url)
    await chrome.storage.local.set({ lastCapture: { url, at: now } })
    await bumpBadge()
  } catch (error) {
    console.warn('[TabNest] capture : erreur réseau', error)
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.url) return
  const isComplete = changeInfo.status === 'complete'
  const hasFavicon = Boolean(changeInfo.favIconUrl)
  if (!isComplete && !hasFavicon) return
  void rememberTab(tabId, tab.url, tab.title ?? '', tab.favIconUrl ?? '')
  void capture(tab.url, tab.title ?? '', tab.favIconUrl ?? '', isComplete)
})

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId)
    if (tab?.url) await rememberTab(tabId, tab.url, tab.title ?? '', tab.favIconUrl ?? '')
  } catch {
    // onglet déjà fermé
  }
})

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const { tabs = {} } = await chrome.storage.session.get('tabs')
  const entry = tabs[tabId]
  await forgetTab(tabId)
  if (entry?.url) {
    void capture(entry.url, entry.title ?? '', entry.faviconUrl ?? '', false)
  }
})

chrome.runtime.onInstalled.addListener(() => {
  console.log('[TabNest] extension installée / mise à jour')
})

/**
 * Connexion Google directement dans l'extension (sans passer par le site).
 * Prérequis Supabase : fournisseur Google activé et URL de redirection
 * `https://<extension-id>.chromiumapp.org/` autorisée dans Authentication → URL Configuration.
 */
async function googleSignIn() {
  const redirectUri = chrome.identity.getRedirectURL()
  const authorizeUrl =
    `${SUPABASE_URL}/auth/v1/authorize?provider=google` +
    `&redirect_to=${encodeURIComponent(redirectUri)}` +
    `&flow_type=implicit`

  return new Promise((resolve) => {
    chrome.identity.launchWebAuthFlow({ url: authorizeUrl, interactive: true }, async (redirected) => {
      if (!redirected) {
        resolve({ ok: false, error: 'Connexion annulée.' })
        return
      }
      try {
        const parsed = new URL(redirected)
        const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''))
        const query = parsed.searchParams
        const pick = (key) => hash.get(key) || query.get(key)
        const errorDescription = pick('error_description')
        if (errorDescription) {
          resolve({ ok: false, error: errorDescription.replace(/\+/g, ' ') })
          return
        }
        const accessToken = pick('access_token')
        const refreshToken = pick('refresh_token')
        if (!accessToken) {
          resolve({
            ok: false,
            error: 'Réponse inattendue de Google (code sans jeton). Utilise l’e-mail et le mot de passe.',
          })
          return
        }
        const expiresIn = Number(pick('expires_in')) || 3600
        let user = null
        try {
          const me = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
          })
          if (me.ok) user = await me.json()
        } catch {
          // profil non critique
        }
        const session = {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'bearer',
          expires_at: Math.floor(Date.now() / 1000) + expiresIn,
          user,
        }
        await chrome.storage.local.set({ session })
        resolve({ ok: true })
      } catch (error) {
        resolve({ ok: false, error: error instanceof Error ? error.message : 'Connexion impossible.' })
      }
    })
  })
}

const authHeaders = (session) => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${session.access_token}`,
  'Content-Type': 'application/json',
})

async function fetchPageRow(session, url) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/pages?select=id,reason,pinned,group_id,title,visit_count,kind` +
      `&url=eq.${encodeURIComponent(url)}&deleted_at=is.null`,
    { headers: authHeaders(session) },
  )
  if (!res.ok) return null
  const rows = await res.json()
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null
}

async function fetchGroups(session) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/groups?select=id,name&order=name.asc`, {
    headers: authHeaders(session),
  })
  if (!res.ok) return []
  return res.json()
}

async function currentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  return tabs[0] ?? null
}

async function pageState() {
  const session = await getSession()
  if (!session) return { connected: false }
  const tab = await currentTab()
  if (!tab?.url) return { connected: true, page: null }
  const [row, groups] = await Promise.all([fetchPageRow(session, tab.url), fetchGroups(session)])
  return {
    connected: true,
    email: session.user?.email ?? null,
    page: row,
    groups,
    tab: { url: tab.url, title: tab.title ?? '', favicon: tab.favIconUrl ?? '' },
  }
}

/** Range la page courante : raison de garder, épingle ou projet. */
async function classify(message) {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Non connecté.' }
  const tab = await currentTab()
  if (!tab?.url) return { ok: false, error: 'Aucune page active.' }

  let row = await fetchPageRow(session, tab.url)
  if (!row) {
    // Deux clics : on capture la page à la volée, puis on la range.
    await capture(tab.url, tab.title ?? '', tab.favIconUrl ?? '', true)
    row = await fetchPageRow(session, tab.url)
  }
  if (!row) {
    return {
      ok: false,
      error: 'Cette page ne peut pas être enregistrée (adresse interne ou recherche).',
    }
  }

  const body = {}
  if (message.reason !== undefined) {
    body.reason = message.reason
    body.expires_at = computeExpiry(row.kind ?? 'normal', row.visit_count ?? 0, message.reason)
  }
  if (message.pinned !== undefined) {
    body.pinned = message.pinned
    if (!message.pinned) {
      body.expires_at = computeExpiry(row.kind ?? 'normal', row.visit_count ?? 0, body.reason ?? row.reason)
    }
  }
  if (message.groupId !== undefined) body.group_id = message.groupId || null
  if (Object.keys(body).length === 0) return { ok: true }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/pages?id=eq.${row.id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(session), Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return { ok: false, error: `Échec de l’enregistrement (${res.status}) ${detail.slice(0, 120)}` }
  }
  return { ok: true }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'google-signin') {
    void googleSignIn().then(sendResponse)
    return true
  }
  if (message?.type === 'page-state') {
    void pageState().then(sendResponse)
    return true
  }
  if (message?.type === 'classify') {
    void classify(message).then(sendResponse)
    return true
  }
  if (message?.type === 'capture-current') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (tab?.url) void capture(tab.url, tab.title ?? '', tab.favIconUrl ?? '', true)
      sendResponse({ ok: true })
    })
    return true
  }
  if (message?.type === 'page-meta') {
    void capture(
      message.url,
      message.title,
      message.favicon,
      false,
      message.ogImage,
      message.themeColor,
    )
    sendResponse({ ok: true })
    return true
  }
  if (message?.type === 'get-status') {
    Promise.all([getSession(), chrome.storage.local.get(['captures', 'lastCapture'])]).then(
      ([session, info]) => {
        sendResponse({
          connected: Boolean(session),
          email: session?.user?.email ?? null,
          captures: info.captures ?? 0,
          lastCapture: info.lastCapture ?? null,
        })
      },
    )
    return true
  }
  return false
})
