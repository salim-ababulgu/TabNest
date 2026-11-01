import { useEffect, useState } from 'react'

const STORAGE_KEY = 'tabnest-cookie-notice'

/**
 * Information sur les traceurs.
 *
 * L'application n'utilise que des traceurs strictement nécessaires (session
 * d'authentification dans le stockage local). La CNIL dispense ces traceurs de
 * consentement : un bandeau d'acceptation/refus serait donc trompeur. Ce
 * bandeau est une simple information, mémorisée localement.
 *
 * Si un traceur non nécessaire est ajouté (mesure d'audience, publicité), il
 * faudra le remplacer par un véritable bandeau de consentement bloquant.
 */
export function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      setVisible(!window.localStorage.getItem(STORAGE_KEY))
    } catch {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'seen')
    } catch {
      // stockage indisponible : le bandeau reviendra à la prochaine visite
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Information sur les cookies et traceurs"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card p-4"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center">
        <p className="text-xs leading-relaxed text-foreground/85">
          TabNest n’utilise aucun traceur publicitaire ni outil de mesure d’audience. Seul le
          stockage nécessaire pour rester connecté est utilisé.
        </p>
        <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
          <a
            href="/cookies"
            className="inline-flex h-8 items-center rounded-md border border-input px-3 text-xs font-medium hover:bg-accent"
          >
            En savoir plus
          </a>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
          >
            J’ai compris
          </button>
        </div>
      </div>
    </div>
  )
}
