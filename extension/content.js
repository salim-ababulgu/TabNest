// Dit à la page : « l'extension est présente » (détection) et, si elle est
// connectée, « à quel compte » (identifiant seul, jamais le jeton).
function postState() {
  chrome.storage.local.get(['captureEnabled', 'session']).then(({ captureEnabled, session }) => {
    const enabled = captureEnabled ?? true
    const accountId = session?.user?.id ?? null
    document.documentElement.setAttribute('data-tabnest-extension', enabled ? '1' : '0')
    document.documentElement.setAttribute('data-tabnest-account', accountId ?? '')
    window.postMessage(
      {
        source: 'tabnest-extension',
        version: '0.2.0',
        captureEnabled: enabled,
        accountId,
      },
      '*',
    )
  })
}

// Quand on se connecte ou se déconnecte depuis l'icône, la page est prévenue.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && ('session' in changes || 'captureEnabled' in changes)) {
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
