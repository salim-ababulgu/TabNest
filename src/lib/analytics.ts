// Mesure d'audience avec PostHog — strictement derrière un consentement.
//
// PostHog est un outil d'analyse produit (funnels, pages vues). Conformément à la
// CNIL, ce n'est pas un traceur strictement nécessaire : il ne se charge QUE si
// l'utilisateur a accepté (choix mémorisé localement). Le refus est équivalent.
//
// Réglages de confidentialité appliqués :
//   - enregistrement de session DÉSACTIVÉ (aucune capture de navigation),
//   - collecte automatique de clics DÉSACTIVÉE,
//   - persistance en stockage local (pas de cookie),
//   - hébergement dans l'Union européenne (eu.i.posthog.com par défaut).
//
// Configuration : VITE_POSTHOG_KEY (clé publique `phc_…`) et VITE_POSTHOG_HOST
// (optionnel). Sans clé, ce module est inerte : aucun appel réseau.
//
// Le paquet PostHog n'est téléchargé qu'après un « oui » : il n'alourdit pas le
// premier chargement de la page publique (temps d'affichage, référencement).

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://eu.i.posthog.com'

const CONSENT_KEY = 'tabnest-analytics-consent'

type PostHogClient = typeof import('posthog-js')['default']

let client: PostHogClient | null = null
let loading: Promise<PostHogClient | null> | null = null
let ready = false
const pending: string[] = []

export type ConsentChoice = 'yes' | 'no'

/** Vrai si une clé PostHog est configurée (sinon, tout ce module est inerte). */
export function analyticsConfigured(): boolean {
  return typeof KEY === 'string' && KEY.length > 0
}

/** Choix de consentement mémorisé, ou null si l'utilisateur n'a pas encore choisi. */
export function readConsent(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY)
    return value === 'yes' || value === 'no' ? value : null
  } catch {
    return null
  }
}

function loadClient(): Promise<PostHogClient | null> {
  if (client) return Promise.resolve(client)
  if (!analyticsConfigured()) return Promise.resolve(null)
  loading ??= import('posthog-js')
    .then((module) => {
      client = module.default
      return client
    })
    .catch(() => null)
  return loading
}

function initPostHog(): void {
  if (!analyticsConfigured()) return
  void loadClient().then((ph) => {
    if (!ph) return
    try {
      ph.init(KEY as string, {
        api_host: HOST,
        capture_pageview: true,
        persistence: 'localStorage',
        autocapture: false,
        disable_session_recording: true,
      })
      ready = true
      // Les événements arrivés pendant le téléchargement partent maintenant.
      for (const name of pending) ph.capture(name)
      pending.length = 0
    } catch {
      // la mesure ne doit jamais casser l'application
    }
  })
}

/** À appeler au démarrage : n'initialise que si le consentement a déjà été donné. */
export function initAnalyticsIfConsented(): void {
  if (readConsent() === 'yes') initPostHog()
}

/** Enregistre le choix et l'applique immédiatement. */
export function saveConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, choice)
  } catch {
    // stockage indisponible : le bandeau réapparaîtra
  }
  if (choice === 'yes') {
    initPostHog()
  } else {
    try {
      client?.opt_out_capturing()
    } catch {
      // déjà hors de portée
    }
  }
}

/** Envoie un événement, uniquement si le consentement est donné. */
export function trackEvent(name: string): void {
  try {
    if (readConsent() !== 'yes') return
    if (ready && client) {
      client.capture(name)
      return
    }
    // Le module est encore en cours de téléchargement : on met en attente.
    pending.push(name)
    initPostHog()
  } catch {
    // la mesure ne doit jamais casser l'application
  }
}
