function absolute(url) {
  if (!url) return ''
  try {
    return new URL(url, window.location.href).href
  } catch {
    return ''
  }
}

function readMeta() {
  const icon =
    document.querySelector('link[rel~="icon"]') ||
    document.querySelector('link[rel="shortcut icon"]') ||
    document.querySelector('link[rel="apple-touch-icon"]')
  const og =
    document.querySelector('meta[property="og:image"]') ||
    document.querySelector('meta[property="og:image:url"]') ||
    document.querySelector('meta[name="twitter:image"]') ||
    document.querySelector('meta[name="twitter:image:src"]')

  const themeColor =
    document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? ''

  return {
    url: window.location.href,
    title: document.title,
    favicon: absolute(icon?.getAttribute('href')),
    ogImage: absolute(og?.getAttribute('content')),
    themeColor,
  }
}

function sendMeta() {
  try {
    chrome.runtime.sendMessage({ type: 'page-meta', ...readMeta() })
  } catch {
    // extension rechargée : on ignore
  }
}

sendMeta()
