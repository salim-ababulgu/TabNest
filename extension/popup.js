import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'

const loggedOut = document.getElementById('logged-out')
const loggedIn = document.getElementById('logged-in')
const errorEl = document.getElementById('error')
const feedbackEl = document.getElementById('feedback')
const accountEl = document.getElementById('account')
const countEl = document.getElementById('count')
const lastEl = document.getElementById('last')
const pageCard = document.getElementById('page-card')
const pageTitle = document.getElementById('page-title')
const pageHost = document.getElementById('page-host')
const pageFavicon = document.getElementById('page-favicon')
const saveState = document.getElementById('save-state')
const pinBtn = document.getElementById('pin-btn')
const groupSelect = document.getElementById('group-select')
const reasonButtons = Array.from(document.querySelectorAll('[data-reason]'))

const REASON_LABELS = {
  remember: 'À retenir',
  finish: 'À finir',
  explore: 'Piste',
  decide: 'À décider',
}

let currentPage = null
let currentPinned = false

async function getSession() {
  const { session } = await chrome.storage.local.get('session')
  return session ?? null
}

function send(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, ...payload })
}

function flash(message, isError = false) {
  feedbackEl.textContent = message
  feedbackEl.classList.toggle('error', isError)
  feedbackEl.hidden = false
  window.setTimeout(() => {
    feedbackEl.hidden = true
  }, 2600)
}

function setReasonActive(reason) {
  reasonButtons.forEach((button) => {
    const active = button.dataset.reason === reason
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })
}

function renderPageState(state) {
  if (!state?.connected) {
    loggedOut.hidden = false
    loggedIn.hidden = true
    return
  }
  loggedOut.hidden = true
  loggedIn.hidden = false

  if (state.tab) {
    pageCard.hidden = false
    pageTitle.textContent = state.tab.title || state.tab.url
    try {
      pageHost.textContent = new URL(state.tab.url).host
    } catch {
      pageHost.textContent = state.tab.url
    }
    if (state.tab.favicon) {
      pageFavicon.src = state.tab.favicon
      pageFavicon.hidden = false
    } else {
      pageFavicon.hidden = true
    }
  }

  currentPage = state.page ?? null
  currentPinned = Boolean(state.page?.pinned)

  if (currentPage) {
    setReasonActive(currentPage.reason ?? 'decide')
    saveState.textContent = 'Cette page est enregistrée : range-la en un clic.'
    pinBtn.textContent = currentPinned ? 'Désépingler' : 'Épingler'
    pinBtn.setAttribute('aria-pressed', String(currentPinned))
  } else {
    setReasonActive(null)
    saveState.textContent =
      'Page pas encore capturée. Reste dessus une seconde, puis « Capturer cette page ».'
    pinBtn.textContent = 'Épingler'
    pinBtn.setAttribute('aria-pressed', 'false')
  }

  groupSelect.innerHTML = '<option value="">Aucun projet</option>'
  for (const group of state.groups ?? []) {
    const option = document.createElement('option')
    option.value = group.id
    option.textContent = group.name
    if (state.page?.group_id === group.id) option.selected = true
    groupSelect.append(option)
  }
  if (!state.page?.group_id) groupSelect.value = ''
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
  lastEl.textContent = lastCapture?.url ? `Dernière : ${lastCapture.url}` : 'Aucune capture encore.'

  const state = await send('page-state')
  renderPageState(state)
}

document.getElementById('google-btn').addEventListener('click', async () => {
  errorEl.hidden = true
  const btn = document.getElementById('google-btn')
  btn.disabled = true
  btn.textContent = 'Connexion Google…'
  try {
    const result = await send('google-signin')
    if (!result?.ok) throw new Error(result?.error || 'Connexion Google impossible.')
    await refreshUi()
  } catch (err) {
    errorEl.textContent = err instanceof Error ? err.message : 'Erreur de connexion'
    errorEl.hidden = false
  } finally {
    btn.disabled = false
    btn.textContent = 'Continuer avec Google'
  }
})

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

reasonButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    const reason = button.dataset.reason
    const result = await send('classify', { reason })
    if (!result?.ok) {
      flash(result?.error || 'Impossible de ranger cette page.', true)
      return
    }
    currentPage = { ...(currentPage ?? {}), reason }
    setReasonActive(reason)
    flash(`Rangée dans « ${REASON_LABELS[reason]} » ✓`)
  })
})

pinBtn.addEventListener('click', async () => {
  const next = !currentPinned
  const result = await send('classify', { pinned: next })
  if (!result?.ok) {
    flash(result?.error || 'Impossible d’épingler.', true)
    return
  }
  currentPinned = next
  pinBtn.textContent = next ? 'Désépingler' : 'Épingler'
  pinBtn.setAttribute('aria-pressed', String(next))
  flash(next ? 'Page épinglée : conservée sans limite ✓' : 'Page désépinglée ✓')
})

groupSelect.addEventListener('change', async () => {
  const result = await send('classify', { groupId: groupSelect.value })
  if (!result?.ok) {
    flash(result?.error || 'Impossible de ranger dans ce projet.', true)
    return
  }
  flash(groupSelect.value ? 'Rangée dans le projet ✓' : 'Retirée du projet ✓')
})

document.getElementById('capture-btn').addEventListener('click', async () => {
  await send('capture-current')
  window.setTimeout(() => void refreshUi(), 900)
  flash('Page capturée ✓')
})

document.getElementById('refresh-btn').addEventListener('click', () => void refreshUi())

document.getElementById('logout-btn').addEventListener('click', async () => {
  await chrome.storage.local.remove('session')
  await refreshUi()
})

void refreshUi()
