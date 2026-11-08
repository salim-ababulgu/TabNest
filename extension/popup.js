import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'
import { applyTranslations, detectExtensionLang, translate } from './i18n.js'

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
const removeBtn = $('remove-btn')
const restoreBtn = $('restore-btn')
const reasonsEl = $('reasons')
const organizeRow = $('organize-row')
const pauseBtn = $('pause-btn')
const pauseBanner = $('pause-banner')
const langSelect = $('lang-select')
const reasonButtons = Array.from(document.querySelectorAll('[data-reason]'))

const EMAIL_RE =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i

const emailInput = $('email')
const passwordInput = $('password')
const emailError = $('email-error')
const passwordError = $('password-error')
const loginBtn = $('login-btn')
const togglePw = $('toggle-pw')

let currentPage = null
let currentPinned = false
let busy = false
let lang = 'fr'
let paused = false
let emailTouched = false
let passwordTouched = false
let lastAutoCloseCount = 0
let lastImport = null

const t = (key, vars) => translate(lang, key, vars)

// ---------- Langue ----------

async function loadLanguage() {
  const { extensionLang } = await chrome.storage.local.get('extensionLang')
  lang = detectExtensionLang(extensionLang)
  langSelect.value = lang
  applyTranslations(document.body, lang)
}

// ---------- Validation ----------

function validateLogin() {
  const email = emailInput.value.trim()
  const emailValid = EMAIL_RE.test(email)
  const passwordValid = passwordInput.value.length >= 6
  const showEmailError = emailTouched && email.length > 0 && !emailValid
  const showPasswordError = passwordTouched && passwordInput.value.length > 0 && !passwordValid

  emailError.textContent = showEmailError ? t('auth.badEmail') : ''
  emailError.hidden = !showEmailError
  emailInput.setAttribute('aria-invalid', String(showEmailError))
  emailInput.classList.toggle('invalid', showEmailError)

  passwordError.textContent = showPasswordError ? t('auth.shortPassword') : ''
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
  togglePw.textContent = t(show ? 'auth.hide' : 'auth.show')
  togglePw.setAttribute('aria-pressed', String(show))
})

// ---------- Utilitaires ----------

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
  removeBtn.disabled = value
  restoreBtn.disabled = value
}

function setReasonActive(reason) {
  reasonButtons.forEach((button) => {
    const active = button.dataset.reason === reason
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })
}

function renderPause() {
  pauseBtn.hidden = loggedIn.hidden
  pauseBtn.textContent = paused ? t('action.resume') : t('action.pause')
  pauseBtn.classList.toggle('active', paused)
  pauseBtn.setAttribute('aria-pressed', String(paused))
  pauseBanner.hidden = !paused
}

function showConnectedUi(connected) {
  loggedOut.hidden = connected
  loggedIn.hidden = !connected
  refreshBtn.hidden = !connected
  logoutBtn.hidden = !connected
  accountEl.hidden = !connected
  pauseBtn.hidden = !connected
  renderPause()
}

function renderPageState(state) {
  if (!state?.connected) {
    loadingEl.hidden = true
    showConnectedUi(false)
    return
  }
  loadingEl.hidden = true
  paused = Boolean(state.paused)
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
    saveState.textContent = t('state.archived')
    setReasonActive(null)
    return
  }

  if (currentPage) {
    setReasonActive(currentPage.reason ?? 'decide')
    saveState.textContent = t('state.saved')
    pinBtn.textContent = currentPinned ? t('action.unpin') : t('action.pin')
    pinBtn.setAttribute('aria-pressed', String(currentPinned))
  } else {
    setReasonActive(null)
    saveState.textContent = t('state.notCaptured')
    pinBtn.textContent = t('action.pin')
    pinBtn.setAttribute('aria-pressed', 'false')
  }

  groupSelect.innerHTML = ''
  const none = document.createElement('option')
  none.value = ''
  none.textContent = t('action.noProject')
  groupSelect.append(none)
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
  await loadLanguage()
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
    paused = Boolean(settings.paused)
    renderPause()
    autoClose.checked = Boolean(settings.autoCloseExpired)
    lastAutoCloseCount = settings.lastAutoClose?.count ?? 0
    lastImport = settings.lastImport ?? null
    autoCloseStatus.textContent = lastAutoCloseCount
      ? t('panel.lastClosed', { n: lastAutoCloseCount })
      : ''
    if (lastImport?.imported) {
      importStatus.textContent = t('panel.importResult', {
        n: lastImport.imported,
        s: lastImport.skipped ?? 0,
      })
    }
  }

  const { captures = 0 } = await chrome.storage.local.get('captures')
  countEl.textContent = t('count.pages', { n: captures })
}

// ---------- Connexion ----------

$('google-btn').addEventListener('click', async () => {
  errorEl.hidden = true
  const btn = $('google-btn')
  btn.disabled = true
  btn.textContent = 'Google…'
  try {
    const result = await send('google-signin')
    if (!result?.ok) throw new Error(result?.error || t('status.failed'))
    await refreshUi(true)
  } catch (err) {
    errorEl.textContent = err instanceof Error ? err.message : t('status.failed')
    errorEl.hidden = false
  } finally {
    btn.disabled = false
    applyTranslations(document.body, lang)
  }
})

$('login-form').addEventListener('submit', async (event) => {
  event.preventDefault()
  errorEl.hidden = true
  if (!validateLogin()) return
  const email = emailInput.value.trim()
  const password = passwordInput.value
  loginBtn.disabled = true
  loginBtn.textContent = t('auth.busy')

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error_description || data.msg || t('status.failed'))
    }
    const data = await res.json()
    const session = {
      ...data,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    }
    await chrome.storage.local.set({ session })
    await refreshUi(true)
  } catch (err) {
    errorEl.textContent = err instanceof Error ? err.message : t('status.failed')
    errorEl.hidden = false
  } finally {
    loginBtn.textContent = t('auth.login')
    validateLogin()
  }
})

// ---------- Actions ----------

reasonButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    if (busy) return
    const reason = button.dataset.reason
    setBusy(true)
    button.classList.add('saving')
    try {
      const result = await send('classify', { reason })
      if (!result?.ok) {
        flash(result?.error || t('status.failed'), true)
        return
      }
      currentPage = { ...(currentPage ?? {}), reason }
      setReasonActive(reason)
      flash(t('status.ranked', { r: t(`reason.${reason}`) }))
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
      flash(result?.error || t('status.failed'), true)
      return
    }
    currentPinned = next
    pinBtn.textContent = next ? t('action.unpin') : t('action.pin')
    pinBtn.setAttribute('aria-pressed', String(next))
    flash(t(next ? 'status.pinned' : 'status.unpinned'))
  } finally {
    setBusy(false)
  }
})

groupSelect.addEventListener('change', async () => {
  const result = await send('classify', { groupId: groupSelect.value })
  if (!result?.ok) {
    flash(result?.error || t('status.failed'), true)
    return
  }
  flash(t(groupSelect.value ? 'status.projectSet' : 'status.projectCleared'))
})

captureBtn.addEventListener('click', async () => {
  captureBtn.disabled = true
  await send('capture-current')
  window.setTimeout(() => {
    captureBtn.disabled = false
    void refreshUi(true)
  }, 900)
  flash(t('status.captured'))
})

removeBtn.addEventListener('click', async () => {
  if (!window.confirm(t('confirm.remove'))) return
  setBusy(true)
  try {
    const result = await send('remove-page')
    if (!result?.ok) {
      flash(result?.error || t('status.failed'), true)
      return
    }
    flash(t('status.removed'))
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
      flash(result?.error || t('status.failed'), true)
      return
    }
    flash(t('status.restored'))
    await refreshUi(true)
  } finally {
    setBusy(false)
  }
})

pauseBtn.addEventListener('click', async () => {
  const result = await send('set-pause', { paused: !paused })
  if (!result?.ok) {
    flash(t('status.failed'), true)
    return
  }
  paused = Boolean(result.paused)
  renderPause()
  flash(t(paused ? 'status.paused' : 'status.resumed'))
})

autoClose.addEventListener('change', async () => {
  const result = await send('set-auto-close', { enabled: autoClose.checked })
  if (!result?.ok) {
    flash(t('status.failed'), true)
    return
  }
  flash(t(autoClose.checked ? 'status.autoCloseOn' : 'status.autoCloseOff'))
})

importHistoryBtn.addEventListener('click', async () => {
  importStatus.textContent = t('panel.importReading')
  importHistoryBtn.disabled = true
  try {
    const result = await send('import-history', { days: 30 })
    if (!result?.ok) throw new Error(result?.error || t('status.failed'))
    importStatus.textContent = t('panel.importResult', {
      n: result.imported,
      s: result.skipped ?? 0,
    })
  } catch (err) {
    importStatus.textContent = err instanceof Error ? err.message : t('status.failed')
  } finally {
    importHistoryBtn.disabled = false
  }
})

importBookmarksBtn.addEventListener('click', async () => {
  importStatus.textContent = t('panel.importReading')
  importBookmarksBtn.disabled = true
  try {
    const result = await send('import-bookmarks')
    if (!result?.ok) throw new Error(result?.error || t('status.failed'))
    importStatus.textContent = t('panel.importResult', {
      n: result.imported,
      s: result.skipped ?? 0,
    })
  } catch (err) {
    importStatus.textContent = err instanceof Error ? err.message : t('status.failed')
  } finally {
    importBookmarksBtn.disabled = false
  }
})

refreshBtn.addEventListener('click', () => void refreshUi(true))

logoutBtn.addEventListener('click', async () => {
  await chrome.storage.local.remove('session')
  await refreshUi(false)
})

langSelect.addEventListener('change', async () => {
  const next = langSelect.value
  if (next === lang) return
  lang = next
  await chrome.storage.local.set({ extensionLang: lang })
  applyTranslations(document.body, lang)
  // Synchronise la langue du site (dans les deux sens).
  await send('set-lang', { lang })
  errorEl.hidden = true
  feedbackEl.hidden = true
  await refreshUi(false)
})

void refreshUi(true)
