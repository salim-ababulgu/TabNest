function announce() {
  window.postMessage({ source: 'tabnest-extension', version: '0.1.0' }, '*')
}

window.addEventListener('message', (event) => {
  if (event.data?.source === 'tabnest-page' && event.data?.type === 'ping') {
    announce()
  }
})

announce()
