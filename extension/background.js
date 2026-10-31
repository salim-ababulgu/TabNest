import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'

const IGNORED =
  /^(chrome|edge|about|chrome-extension|devtools|view-source|file|data|blob):/i
const APP_HOSTS = ['localhost:5173', '127.0.0.1:5173']
const CAPTURE_COOLDOWN_MS = 15000
const lastCaptured = new Map()

const BASE_HOURS = { normal: 72, documentation: 720, ephemeral: 168 }

function computeExpiry(kind, visits) {
  const base = BASE_HOURS[kind] ?? BASE_HOURS.normal
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

async function capture(url, title) {
  if (!url || IGNORED.test(url)) return
  try {
    const parsed = new URL(url)
    if (APP_HOSTS.includes(parsed.host)) return
  } catch {
    return
  }

  const now = Date.now()
  const last = lastCaptured.get(url)
  if (last && now - last < CAPTURE_COOLDOWN_MS) return

  const session = await getSession()
  if (!session?.access_token) {
    console.warn('[TabNest] pas connecté : capture ignorée')
    return
  }

  lastCaptured.set(url, now)

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }

  try {
    const existingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/pages?select=id,visit_count,kind&url=eq.${encodeURIComponent(url)}`,
      { headers },
    )
    if (!existingRes.ok) {
      console.warn('[TabNest] lecture de la page échouée', existingRes.status)
      return
    }
    const rows = await existingRes.json()

    if (Array.isArray(rows) && rows.length > 0) {
      const page = rows[0]
      const visits = (page.visit_count ?? 0) + 1
      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/pages?id=eq.${page.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          visit_count: visits,
          last_visited_at: new Date().toISOString(),
          expires_at: computeExpiry(page.kind ?? 'normal', visits),
          title: title || null,
        }),
      })
      if (!updateRes.ok) {
        console.warn('[TabNest] mise à jour de la page échouée', updateRes.status)
        return
      }
    } else {
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/pages`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({
          user_id: session.user.id,
          url,
          title: title || null,
          kind: 'normal',
          visit_count: 1,
          last_visited_at: new Date().toISOString(),
          expires_at: computeExpiry('normal', 0),
        }),
      })
      if (!insertRes.ok) {
        console.warn('[TabNest] insertion de la page échouée', insertRes.status)
        return
      }
    }

    console.log('[TabNest] page capturée :', url)
    await chrome.storage.local.set({ lastCapture: { url, at: now } })
  } catch (error) {
    console.warn('[TabNest] capture : erreur réseau', error)
  }
}

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    void capture(tab.url, tab.title ?? '')
  }
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'capture-current') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (tab?.url) void capture(tab.url, tab.title ?? '')
      sendResponse({ ok: true })
    })
    return true
  }
  if (message?.type === 'get-status') {
    getSession().then((session) => {
      sendResponse({
        connected: Boolean(session),
        email: session?.user?.email ?? null,
      })
    })
    return true
  }
  return false
})
