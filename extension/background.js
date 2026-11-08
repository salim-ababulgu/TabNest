import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'

const IGNORED =
  /^(chrome|edge|about|chrome-extension|devtools|view-source|file|data|blob):/i
const APP_HOSTS = ['localhost:5173', '127.0.0.1:5173', 'filnest.pages.dev']
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
      console.warn('[Filnest] rafraîchissement de session échoué', res.status)
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
    console.warn('[Filnest] rafraîchissement de session : erreur réseau', error)
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

/**
 * L'enrichissement (image de partage) est prévu côté serveur : aucune clé
 * tierce n'est embarquée dans l'extension. On garde les métadonnées de la page.
 */
async function enrichWithServer() {
  return null
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

  const { captureEnabled = true, paused = false } = await chrome.storage.local.get([
    'captureEnabled',
    'paused',
  ])
  if (!captureEnabled || paused) return

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
      console.warn('[Filnest] lecture de la page échouée', existingRes.status)
      return
    }
    const rows = await existingRes.json()
    const exists = Array.isArray(rows) && rows.length > 0

    const rowMissingImage = !exists || !rows[0]?.og_image_url
    if (rowMissingImage && !enrichedOnce.has(url) && (!ogImage || !favicon || !finalTitle)) {
      enrichedOnce.add(url)
      const enriched = await enrichWithServer()
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
        console.warn('[Filnest] mise à jour de la page échouée', updateRes.status)
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
        console.warn('[Filnest] insertion de la page échouée', insertRes.status)
        return
      }
    }

    console.log('[Filnest] capturée', increment ? '(visite)' : '(maj)', url)
    await chrome.storage.local.set({ lastCapture: { url, at: now } })
    await bumpBadge()
  } catch (error) {
    console.warn('[Filnest] capture : erreur réseau', error)
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
  console.log('[Filnest] extension installée / mise à jour')
  void syncAutoCloseAlarm()
  void updateBadge()
})

/**
 * Connexion Google directement dans l'extension (sans passer par le site).
 * Prérequis Supabase : fournisseur Google activé et URL de redirection
 * `https://<extension-id>.chromiumapp.org/` autorisée dans Authentication → URL Configuration.
 *
 * Le flux « implicit » est refusé par Google depuis 2025 : on utilise PKCE
 * (code + vérificateur), le flux recommandé pour les extensions.
 */
function base64UrlEncode(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function generateCodeChallenge() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(48))
  const verifier = base64UrlEncode(verifierBytes)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return { verifier, challenge: base64UrlEncode(new Uint8Array(digest)) }
}

async function googleSignIn() {
  const redirectUri = chrome.identity.getRedirectURL()
  const { verifier, challenge } = await generateCodeChallenge()
  const authorizeUrl =
    `${SUPABASE_URL}/auth/v1/authorize?provider=google` +
    `&redirect_to=${encodeURIComponent(redirectUri)}` +
    `&code_challenge=${encodeURIComponent(challenge)}` +
    `&code_challenge_method=S256`

  return new Promise((resolve) => {
    chrome.identity.launchWebAuthFlow({ url: authorizeUrl, interactive: true }, async (redirected) => {
      const runtimeError = chrome.runtime.lastError?.message
      if (runtimeError) {
        resolve({ ok: false, error: runtimeError })
        return
      }
      if (!redirected) {
        resolve({ ok: false, error: 'Connexion annulée.' })
        return
      }
      try {
        const parsed = new URL(redirected)
        const errorDescription = parsed.searchParams.get('error_description')
        if (errorDescription) {
          resolve({
            ok: false,
            error: decodeURIComponent(errorDescription).replace(/\+/g, ' '),
          })
          return
        }
        const code = parsed.searchParams.get('code')
        if (!code) {
          resolve({
            ok: false,
            error: 'Réponse inattendue de Google (aucun code reçu). Réessaie, ou utilise l’e-mail et le mot de passe.',
          })
          return
        }
        const tokenResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
        })
        if (!tokenResponse.ok) {
          const data = await tokenResponse.json().catch(() => ({}))
          resolve({
            ok: false,
            error: data.error_description || data.msg || `Échange refusé (${tokenResponse.status}).`,
          })
          return
        }
        const tokens = await tokenResponse.json()
        let user = null
        try {
          const me = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${tokens.access_token}` },
          })
          if (me.ok) user = await me.json()
        } catch {
          // profil non critique
        }
        const session = {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? null,
          token_type: 'bearer',
          expires_at:
            tokens.expires_at ?? Math.floor(Date.now() / 1000) + (tokens.expires_in ?? 3600),
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
    `${SUPABASE_URL}/rest/v1/pages?select=id,reason,pinned,group_id,title,visit_count,kind,deleted_at` +
      `&url=eq.${encodeURIComponent(url)}`,
    { headers: authHeaders(session) },
  )
  if (!res.ok) return null
  const rows = await res.json()
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null
}

/** Retire la page de Filnest (archivage doux, réversible). */
async function removePageByUrl() {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Non connecté.' }
  const tab = await currentTab()
  if (!tab?.url) return { ok: false, error: 'Aucune page active.' }
  const row = await fetchPageRow(session, tab.url)
  if (!row) return { ok: false, error: 'Cette page n’est pas enregistrée.' }
  if (row.deleted_at) return { ok: true, alreadyRemoved: true }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/pages?id=eq.${row.id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(session), Prefer: 'return=minimal' },
    body: JSON.stringify({ deleted_at: new Date().toISOString() }),
  })
  if (!res.ok) return { ok: false, error: `Suppression impossible (${res.status})` }
  return { ok: true }
}

/** Remet en service une page archivée depuis l'extension. */
async function restorePageByUrl() {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Non connecté.' }
  const tab = await currentTab()
  if (!tab?.url) return { ok: false, error: 'Aucune page active.' }
  const row = await fetchPageRow(session, tab.url)
  if (!row) return { ok: false, error: 'Cette page n’est pas enregistrée.' }
  if (!row.deleted_at) return { ok: true, alreadyActive: true }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/pages?id=eq.${row.id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(session), Prefer: 'return=minimal' },
    body: JSON.stringify({
      deleted_at: null,
      expires_at: computeExpiry(row.kind ?? 'normal', row.visit_count ?? 0, row.reason),
    }),
  })
  if (!res.ok) return { ok: false, error: `Restauration impossible (${res.status})` }
  return { ok: true }
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
  const { paused = false } = await chrome.storage.local.get('paused')
  return {
    connected: true,
    paused,
    email: session.user?.email ?? null,
    page: row && !row.deleted_at ? row : null,
    archived: Boolean(row?.deleted_at),
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
  if (row?.deleted_at) {
    return { ok: false, error: 'Page retirée de Filnest : restaure-la d’abord.' }
  }
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

const IMPORT_LIMIT = 400
const AUTO_CLOSE_ALARM = 'tabnest-close-expired'

async function allExistingUrls(session) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/pages?select=url&limit=5000`, {
    headers: authHeaders(session),
  })
  if (!res.ok) return new Set()
  const rows = await res.json()
  return new Set(rows.map((row) => row.url))
}

function isImportable(url) {
  if (!url || IGNORED.test(url) || isSearchPage(url)) return false
  try {
    const host = new URL(url).host
    return !APP_HOSTS.includes(host)
  } catch {
    return false
  }
}

/** Enregistre une liste de pages (historique ou favoris) sans doublon. */
async function importUrls(entries) {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Non connecté.' }

  const seen = new Set()
  const unique = []
  for (const entry of entries) {
    if (!isImportable(entry.url)) continue
    if (seen.has(entry.url)) continue
    seen.add(entry.url)
    unique.push(entry)
    if (unique.length >= IMPORT_LIMIT) break
  }
  if (unique.length === 0) return { ok: true, imported: 0, skipped: 0 }

  const existing = await allExistingUrls(session)
  const missing = unique.filter((entry) => !existing.has(entry.url))
  const headers = { ...authHeaders(session), Prefer: 'return=minimal' }

  let imported = 0
  for (let i = 0; i < missing.length; i += 50) {
    const batch = missing.slice(i, i + 50).map((entry) => {
      const visits = Math.min(Math.max(entry.visits ?? 1, 1), 20)
      const last = entry.lastVisit ? new Date(entry.lastVisit) : new Date()
      return {
        user_id: session.user.id,
        url: entry.url,
        title: entry.title || null,
        kind: 'normal',
        visit_count: visits,
        last_visited_at: last.toISOString(),
        expires_at: computeExpiry('normal', visits, null),
      }
    })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(batch),
    })
    if (res.ok) imported += batch.length
    else console.warn('[Filnest] import de pages échoué', res.status)
  }

  await chrome.storage.local.set({
    lastImport: { at: Date.now(), imported, total: unique.length },
  })
  return { ok: true, imported, skipped: unique.length - missing.length }
}

async function ensurePermission(name) {
  if (!chrome.permissions) return true
  return new Promise((resolve) => {
    chrome.permissions.request({ permissions: [name] }, (granted) => resolve(granted))
  })
}

async function importHistory(days = 30) {
  if (!(await ensurePermission('history'))) {
    return { ok: false, error: 'Import de l’historique refusé.' }
  }
  if (!chrome.history?.search) return { ok: false, error: 'Historique indisponible.' }
  const startTime = Date.now() - days * 24 * 60 * 60 * 1000
  const items = await chrome.history.search({ text: '', startTime, maxResults: 2000 })
  const entries = items
    .filter((item) => item.url)
    .map((item) => ({
      url: item.url,
      title: item.title || '',
      visits: item.visitCount || 1,
      lastVisit: item.lastVisitTime,
    }))
  return importUrls(entries)
}

async function importBookmarks() {
  if (!(await ensurePermission('bookmarks'))) {
    return { ok: false, error: 'Import des favoris refusé.' }
  }
  if (!chrome.bookmarks?.getTree) return { ok: false, error: 'Favoris indisponibles.' }
  const tree = await chrome.bookmarks.getTree()
  const entries = []
  const walk = (nodes) => {
    for (const node of nodes) {
      if (node.url) {
        entries.push({
          url: node.url,
          title: node.title || '',
          visits: 1,
          lastVisit: node.dateAdded ?? Date.now(),
        })
      }
      if (node.children) walk(node.children)
    }
  }
  walk(tree)
  return importUrls(entries)
}

/** Ferme les onglets dont la page a expiré (jamais l'onglet actif, épinglé ou audible). */
async function closeExpiredTabs() {
  const { paused = false } = await chrome.storage.local.get('paused')
  if (paused) return { ok: true, closed: 0, paused: true }
  const session = await getSession()
  if (!session) return { ok: false, closed: 0 }
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/pages?select=url&pinned=eq.false` +
      `&expires_at=lt.${encodeURIComponent(new Date().toISOString())}` +
      `&deleted_at=is.null&limit=500`,
    { headers: authHeaders(session) },
  )
  if (!res.ok) return { ok: false, closed: 0 }
  const rows = await res.json()
  const expired = new Set(rows.map((row) => row.url))
  if (expired.size === 0) return { ok: true, closed: 0 }

  const tabs = await chrome.tabs.query({})
  let closed = 0
  for (const tab of tabs) {
    if (!tab.url || !expired.has(tab.url)) continue
    if (tab.active || tab.pinned || tab.audible) continue
    if (tab.lastAccessed && Date.now() - tab.lastAccessed < 10 * 60 * 1000) continue
    if (!isImportable(tab.url)) continue
    try {
      await chrome.tabs.remove(tab.id)
      closed += 1
    } catch {
      // onglet déjà fermé
    }
  }
  if (closed > 0) {
    await chrome.storage.local.set({ lastAutoClose: { count: closed, at: Date.now() } })
    console.log('[Filnest] onglets expirés fermés :', closed)
  }
  return { ok: true, closed }
}

async function updateBadge() {
  const { paused = false, captures = 0 } = await chrome.storage.local.get([
    'paused',
    'captures',
  ])
  try {
    if (paused) {
      await chrome.action.setBadgeBackgroundColor({ color: '#8e8770' })
      await chrome.action.setBadgeText({ text: '⏸' })
    } else {
      await chrome.action.setBadgeBackgroundColor({ color: '#c8f05a' })
      await chrome.action.setBadgeText({ text: captures > 0 ? String(captures) : '' })
    }
  } catch {
    // badge non critique
  }
}

async function setPause(value) {
  const paused = Boolean(value)
  await chrome.storage.local.set({ paused })
  await updateBadge()
  await syncAutoCloseAlarm()
  return { ok: true, paused }
}

/** Envoie la langue choisie dans l'extension aux onglets du site. */
async function broadcastLang(lang) {
  const tabs = await chrome.tabs.query({})
  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue
    if (!APP_HOSTS.some((host) => tab.url.includes(host))) continue
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'apply-lang', lang })
    } catch {
      // onglet sans content script
    }
  }
}

async function setLanguage(lang, broadcast) {
  const allowed = ['fr', 'en', 'es', 'zh']
  if (!allowed.includes(lang)) return { ok: false, error: 'Langue inconnue.' }
  await chrome.storage.local.set({ extensionLang: lang })
  if (broadcast) await broadcastLang(lang)
  return { ok: true, lang }
}

async function syncAutoCloseAlarm() {
  const { autoCloseExpired = false, paused = false } = await chrome.storage.local.get([
    'autoCloseExpired',
    'paused',
  ])
  if (autoCloseExpired && !paused) {
    chrome.alarms.create(AUTO_CLOSE_ALARM, { periodInMinutes: 15 })
    void closeExpiredTabs()
  } else {
    chrome.alarms.clear(AUTO_CLOSE_ALARM)
  }
  return { ok: true, enabled: autoCloseExpired }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === AUTO_CLOSE_ALARM) void closeExpiredTabs()
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'import-history') {
    void importHistory(message.days ?? 30).then(sendResponse)
    return true
  }
  if (message?.type === 'import-bookmarks') {
    void importBookmarks().then(sendResponse)
    return true
  }
  if (message?.type === 'set-pause') {
    void setPause(message.paused).then(sendResponse)
    return true
  }
  if (message?.type === 'set-lang') {
    void setLanguage(message.lang, true).then(sendResponse)
    return true
  }
  if (message?.type === 'site-lang') {
    void setLanguage(message.lang, false).then(sendResponse)
    return true
  }
  if (message?.type === 'get-settings') {
    void chrome.storage.local
      .get(['autoCloseExpired', 'lastAutoClose', 'lastImport', 'paused', 'extensionLang'])
      .then((data) => sendResponse({ ok: true, ...data }))
    return true
  }
  if (message?.type === 'set-auto-close') {
    void chrome.storage.local
      .set({ autoCloseExpired: Boolean(message.enabled) })
      .then(() => syncAutoCloseAlarm())
      .then(sendResponse)
    return true
  }
  if (message?.type === 'close-expired-now') {
    void closeExpiredTabs().then(sendResponse)
    return true
  }
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
  if (message?.type === 'remove-page') {
    void removePageByUrl().then(sendResponse)
    return true
  }
  if (message?.type === 'restore-page') {
    void restorePageByUrl().then(sendResponse)
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
