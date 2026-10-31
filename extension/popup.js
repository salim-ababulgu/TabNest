import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'

const loggedOut = document.getElementById('logged-out')
const loggedIn = document.getElementById('logged-in')
const errorEl = document.getElementById('error')
const accountEl = document.getElementById('account')
const countEl = document.getElementById('count')
const lastEl = document.getElementById('last')

async function getSession() {
  const { session } = await chrome.storage.local.get('session')
  return session ?? null
}

async function refreshUi() {
  const session = await getSession()
  const connected = Boolean(session)
  loggedOut.hidden = connected
  loggedIn.hidden = !connected
  if (!connected) return

  accountEl.textContent = session.user?.email ?? ''
  const { captures = 0, lastCapture } = await chrome.storage.local.get(['captures', 'lastCapture'])
  countEl.textContent = `${captures} page(s) capturée(s)`
  lastEl.textContent = lastCapture?.url
    ? `Dernière : ${lastCapture.url}`
    : 'Aucune capture encore. Visitez des pages !'
}

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault()
  errorEl.hidden = true
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value
  const btn = document.getElementById('login-btn')
  btn.disabled = true
  btn.textContent = 'Connexion…'

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error_description || data.msg || 'Identifiants incorrects')
    }
    const data = await res.json()
    const session = {
      ...data,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    }
    await chrome.storage.local.set({ session })
    await refreshUi()
  } catch (err) {
    errorEl.textContent = err instanceof Error ? err.message : 'Erreur de connexion'
    errorEl.hidden = false
  } finally {
    btn.disabled = false
    btn.textContent = 'Se connecter'
  }
})

document.getElementById('capture-btn').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'capture-current' })
  const status = document.getElementById('status')
  status.textContent = 'Page capturée ✓'
  await refreshUi()
  window.setTimeout(() => {
    status.textContent = 'Capture automatique activée.'
  }, 2000)
})

document.getElementById('logout-btn').addEventListener('click', async () => {
  await chrome.storage.local.remove('session')
  await refreshUi()
})

void refreshUi()
