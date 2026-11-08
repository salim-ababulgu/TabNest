// Dit à la page : « l'extension est présente » (détection), « à quel compte »
// (identifiant seul, jamais le jeton) et synchronise la langue dans les deux sens.
function postState() {
  chrome.storage.local
    .get(['captureEnabled', 'paused', 'session', 'extensionLang'])
    .then(({ captureEnabled, paused, session, extensionLang }) => {
      const enabled = captureEnabled ?? true
      const accountId = session?.user?.id ?? null
      document.documentElement.setAttribute('data-tabnest-extension', enabled ? '1' : '0')
      document.documentElement.setAttribute('data-tabnest-account', accountId ?? '')
      window.postMessage(
        {
          source: 'tabnest-extension',
          version: '0.5.0',
          captureEnabled: enabled,
          paused: Boolean(paused),
          accountId,
          lang: extensionLang ?? null,
        },
        '*',
      )
    })
}

const LANGS = ['fr', 'en', 'es', 'zh']

function readSiteLang() {
  try {
    const value = window.localStorage.getItem('tabnest-lang')
    return LANGS.includes(value) ? value : null
  } catch {
    return null
  }
}

function pushSiteLang() {
  const lang = readSiteLang()
  if (lang) chrome.runtime.sendMessage({ type: 'site-lang', lang }).catch(() => {})
}

// Langue choisie dans l'extension → appliquée au site ouvert.
chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== 'apply-lang') return
  if (!LANGS.includes(message.lang)) return
  try {
    window.localStorage.setItem('tabnest-lang', message.lang)
  } catch {
    // stockage indisponible
  }
  window.dispatchEvent(new CustomEvent('tabnest:lang', { detail: { lang: message.lang } }))
})

// Langue changée dans le site → remontée à l'extension.
window.addEventListener('tabnest:lang-changed', (event) => {
  const lang = event?.detail?.lang
  if (LANGS.includes(lang)) {
    chrome.runtime.sendMessage({ type: 'site-lang', lang }).catch(() => {})
  }
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (
    area === 'local' &&
    ('session' in changes ||
      'captureEnabled' in changes ||
      'paused' in changes ||
      'extensionLang' in changes)
  ) {
    postState()
  }
})

window.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.source !== 'tabnest-page') return
  if (data.type === 'ping') {
    postState()
  } else if (data.type === 'set-capture') {
    chrome.storage.local.set({ captureEnabled: Boolean(data.enabled) }).then(postState)
  }
})

postState()
pushSiteLang()
