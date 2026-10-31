function postState() {
  chrome.storage.local.get('captureEnabled').then(({ captureEnabled }) => {
    const enabled = captureEnabled ?? true
    document.documentElement.setAttribute('data-tabnest-extension', enabled ? '1' : '0')
    window.postMessage(
      { source: 'tabnest-extension', version: '0.1.0', captureEnabled: enabled },
      '*',
    )
  })
}

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
