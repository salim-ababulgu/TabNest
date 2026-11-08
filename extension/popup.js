import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'

const $ = (id) => document.getElementById(id)

const loadingEl = $('loading')
const loggedOut = $('logged-out')
const loggedIn = $('logged-in')
const errorEl = $('error')
const feedbackEl = $('feedback')
const accountEl = $('account')
const countEl = $('count')
const pageCard = $('page-card')
const pageTitle = $('page-title')
const pageHost = $('page-host')
const pageFavicon = $('page-favicon')
const saveState = $('save-state')
const pinBtn = $('pin-btn')
const groupSelect = $('group-select')
const autoClose = $('auto-close')
const autoCloseStatus = $('auto-close-status')
const importStatus = $('import-status')
const importHistoryBtn = $('import-history')
const importBookmarksBtn = $('import-bookmarks')
const captureBtn = $('capture-btn')
const refreshBtn = $('refresh-btn')
const logoutBtn = $('logout-btn')
const reasonButtons = Array.from(document.querySelectorAll('[data-reason]'))
const reasonsEl = $('reasons')
const organizeRow = $('organize-row')
const removeBtn = $('remove-btn')
const restoreBtn = $('restore-btn')

const REASON_LABELS = {
  remember: 'À retenir',
  finish: 'À finir',
  explore: 'Piste',
  decide: 'À décider',
}

// Même expression que le site : partie locale + domaine en étiquettes.
const EMAIL_RE =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i

const emailInput = $('email')
const passwordInput = $('password')
const emailError = $('email-error')
const passwordError = $('password-error')
const loginBtn = $('login-btn')
const togglePw = $('toggle-pw')
let emailTouched = false
let passwordTouched = false

function validateLogin() {
  const email = emailInput.value.trim()
  const emailValid = EMAIL_RE.test(email)
  const passwordValid = passwordInput.value.length >= 6
  const showEmailError = emailTouched && email.length > 0 && !emailValid
  const showPasswordError = passwordTouched && passwordInput.value.length > 0 && !passwordValid

  emailError.textContent = showEmailError ? 'Cette adresse e-mail ne semble pas valide.' : ''
  emailError.hidden = !showEmailError
  emailInput.setAttribute('aria-invalid', String(showEmailError))
  emailInput.classList.toggle('invalid', showEmailError)

  passwordError.textContent = showPasswordError ? '6 caractères minimum.' : ''
  passwordError.hidden = !showPasswordError
  passwordInput.setAttribute('aria-invalid', String(showPasswordError))
  passwordInput.classList.toggle('invalid', showPasswordError)

  loginBtn.disabled = !(emailValid && passwordValid)
  return emailValid && passwordValid
}

emailInput.addEventListener('input', validateLogin)
emailInput.addEventListener('blur', () => {
  emailTouched = true
  validateLogin()
})
passwordInput.addEventListener('input', validateLogin)
passwordInput.addEventListener('blur', () => {
  passwordTouched = true
  validateLogin()
})

togglePw.addEventListener('click', () => {
  const show = passwordInput.type === 'password'
  passwordInput.type = show ? 'text' : 'password'
  togglePw.textContent = show ? 'Masquer' : 'Afficher'
  togglePw.setAttribute('aria-pressed', String(show))
})

validateLogin()

let currentPage = null
let currentPinned = false
let busy = false

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
  window.clearTimeout(flash.timer)
  flash.timer = window.setTimeout(() => {
    feedbackEl.hidden = true
  }, 2600)
}

function setBusy(value) {
  busy = value
  reasonButtons.forEach((button) => (button.disabled = value))
  pinBtn.disabled = value
  groupSelect.disabled = value
  captureBtn.disabled = value
}

function setReasonActive(reason) {
  reasonButtons.forEach((button) => {
    const active = button.dataset.reason === reason
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })
}

function showConnectedUi(connected) {
  loggedOut.hidden = connected
  loggedIn.hidden = !connected
  refreshBtn.hidden = !connected
  logoutBtn.hidden = !connected
  accountEl.hidden = !connected
}

function renderPageState(state) {
  if (!state?.connected) {
    loadingEl.hidden = true
    showConnectedUi(false)
    return
  }
  loadingEl.hidden = true
  showConnectedUi(true)
  accountEl.textContent = state.email ?? ''

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
  } else {
    pageCard.hidden = true
  }

  currentPage = state.page ?? null
  currentPinned = Boolean(state.page?.pinned)
  const archived = Boolean(state.archived)

  reasonsEl.hidden = archived
  organizeRow.hidden = archived
  removeBtn.hidden = archived || !currentPage
  restoreBtn.hidden = !archived

  if (archived) {
    saveState.textContent = 'Cette page a été retirée de TabNest.'
    setReasonActive(null)
    return
  }

  if (currentPage) {
    setReasonActive(currentPage.reason ?? 'decide')
    saveState.textContent = 'Cette page est enregistrée : range-la en un clic.'
    pinBtn.textContent = currentPinned ? 'Désépingler' : 'Épingler'
    pinBtn.setAttribute('aria-pressed', String(currentPinned))
  } else {
    setReasonActive(null)
    saveState.textContent =
      'Page pas encore capturée : elle le sera automatiquement au premier rangement.'
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

async function refreshUi(showSkeleton = false) {
  if (showSkeleton) {
    loadingEl.hidden = false
    loggedOut.hidden = true
    loggedIn.hidden = true
  }
  const session = await getSession()
  if (!session) {
    loadingEl.hidden = true
    showConnectedUi(false)
    return
  }
  const state = await send('page-state')
  renderPageState(state)

  const settings = await send('get-settings')
  if (settings?.ok) {
    autoClose.checked = Boolean(settings.autoCloseExpired)
    autoCloseStatus.textContent = settings.lastAutoClose?.count
      ? `${settings.lastAutoClose.count} onglet(s) fermé(s) lors du dernier passage.`
      : ''
    if (settings.lastImport?.imported) {
      importStatus.textContent = `Dernier import : ${settings.lastImport.imported} page(s).`
    }
  }

  const { captures = 0 } = await chrome.storage.local.get('captures')
  countEl.textContent = `${captures} page(s) capturée(s) au total.`
}

$('google-btn').addEventListener('click', async () => {
  errorEl.hidden = true
  const btn = $('google-btn')
  btn.disabled = true
  btn.textContent = 'Connexion Google…'
  try {
    const result = await send('google-signin')
    if (!result?.ok) throw new Error(result?.error || 'Connexion Google impossible.')
    await refreshUi(true)
  } catch (err) {
    errorEl.textContent = err instanceof Error ? err.message : 'Erreur de connexion'
    errorEl.hidden = false
  } finally {
    btn.disabled = false
    btn.textContent = 'Continuer avec Google'
  }
})

$('login-form').addEventListener('submit', async (event) => {
  event.preventDefault()
  errorEl.hidden = true
  const email = $('email').value.trim()
  const password = $('password').value
  const btn = $('login-btn')
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
    await refreshUi(true)
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
    if (busy) return
    const reason = button.dataset.reason
    setBusy(true)
    button.classList.add('saving')
    try {
      const result = await send('classify', { reason })
      if (!result?.ok) {
        flash(result?.error || 'Impossible de ranger cette page.', true)
        return
      }
      currentPage = { ...(currentPage ?? {}), reason }
      setReasonActive(reason)
      flash(`Rangée dans « ${REASON_LABELS[reason]} » ✓`)
    } finally {
      button.classList.remove('saving')
      setBusy(false)
    }
  })
})

pinBtn.addEventListener('click', async () => {
  if (busy) return
  const next = !currentPinned
  setBusy(true)
  try {
    const result = await send('classify', { pinned: next })
    if (!result?.ok) {
      flash(result?.error || 'Impossible d’épingler.', true)
      return
    }
    currentPinned = next
    pinBtn.textContent = next ? 'Désépingler' : 'Épingler'
    pinBtn.setAttribute('aria-pressed', String(next))
    flash(next ? 'Page épinglée : conservée sans limite ✓' : 'Page désépinglée ✓')
  } finally {
    setBusy(false)
  }
})

groupSelect.addEventListener('change', async () => {
  const result = await send('classify', { groupId: groupSelect.value })
  if (!result?.ok) {
    flash(result?.error || 'Impossible de ranger dans ce projet.', true)
    return
  }
  flash(groupSelect.value ? 'Rangée dans le projet ✓' : 'Retirée du projet ✓')
})

captureBtn.addEventListener('click', async () => {
  captureBtn.disabled = true
  await send('capture-current')
  window.setTimeout(() => {
    captureBtn.disabled = false
    void refreshUi(true)
  }, 900)
  flash('Page capturée ✓')
})

autoClose.addEventListener('change', async () => {
  const result = await send('set-auto-close', { enabled: autoClose.checked })
  if (!result?.ok) {
    flash('Impossible de modifier ce réglage.', true)
    return
  }
  flash(autoClose.checked ? 'Fermeture automatique activée ✓' : 'Fermeture automatique désactivée.')
})

importHistoryBtn.addEventListener('click', async () => {
  importStatus.textContent = 'Lecture de l’historique…'
  importHistoryBtn.disabled = true
  try {
    const result = await send('import-history', { days: 30 })
    if (!result?.ok) throw new Error(result?.error || 'Import impossible.')
    importStatus.textContent = `Historique : ${result.imported} ajoutée(s), ${result.skipped} déjà connue(s).`
  } catch (err) {
    importStatus.textContent = err instanceof Error ? err.message : 'Import impossible.'
  } finally {
    importHistoryBtn.disabled = false
  }
})

importBookmarksBtn.addEventListener('click', async () => {
  importStatus.textContent = 'Lecture des favoris…'
  importBookmarksBtn.disabled = true
  try {
    const result = await send('import-bookmarks')
    if (!result?.ok) throw new Error(result?.error || 'Import impossible.')
    importStatus.textContent = `Favoris : ${result.imported} ajoutée(s), ${result.skipped} déjà connue(s).`
  } catch (err) {
    importStatus.textContent = err instanceof Error ? err.message : 'Import impossible.'
  } finally {
    importBookmarksBtn.disabled = false
  }
})

removeBtn.addEventListener('click', async () => {
    if (!window.confirm('Retirer cette page de TabNest ? Elle sera conservée dans les archives.')) {
      return
    }
    setBusy(true)
    try {
      const result = await send('remove-page')
      if (!result?.ok) {
        flash(result?.error || 'Suppression impossible.', true)
        return
      }
      flash('Page retirée de TabNest (archivée).')
      await refreshUi(true)
    } finally {
      setBusy(false)
    }
  })

restoreBtn.addEventListener('click', async () => {
  setBusy(true)
  try {
    const result = await send('restore-page')
    if (!result?.ok) {
      flash(result?.error || 'Restauration impossible.', true)
      return
    }
    flash('Page restaurée dans TabNest ✓')
    await refreshUi(true)
  } finally {
    setBusy(false)
  }
})

refreshBtn.addEventListener('click', () => void refreshUi(true))

logoutBtn.addEventListener('click', async () => {
  await chrome.storage.local.remove('session')
  await refreshUi(false)
})

void refreshUi(true)
