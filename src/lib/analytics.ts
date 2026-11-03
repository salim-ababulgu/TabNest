// Mesure d'audience minimale, sans cookies ni consentement.
//
// Une fois le site déployé sur Cloudflare Pages, le script Web Analytics
// (fourni par Cloudflare) est injecté par l'hébergeur : aucun cookie, aucun
// bandeau requis (conforme à notre page « Cookies et traceurs »).
//
// Les événements ci-dessous sont envoyés via la file `_cfq` (API publique de
// Cloudflare Web Analytics) : s'ils ne sont pas disponibles, rien n'est envoyé.

declare global {
  interface Window {
    _cfq?: unknown[]
  }
}

export function trackEvent(name: string): void {
  try {
    if (typeof window !== 'undefined' && window._cfq) {
      window._cfq.push(['track', name])
    }
  } catch {
    // la mesure ne doit jamais casser l'application
  }
}
