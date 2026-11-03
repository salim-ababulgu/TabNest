import { useEffect, useState } from 'react'
import {
  analyticsConfigured,
  initAnalyticsIfConsented,
  readConsent,
  saveConsent,
} from '@/lib/analytics'

/**
 * Bandeau de consentement à la mesure d'audience.
 *
 * Il n'apparaît que si PostHog est configuré et que l'utilisateur n'a pas encore
 * choisi. « Refuser » est aussi simple que « Accepter », et rien ne se charge
 * tant qu'aucun choix n'est fait (blocage réel, conforme CNIL).
 */
export function PrivacyNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    initAnalyticsIfConsented()
    if (analyticsConfigured() && readConsent() === null) setVisible(true)
  }, [])

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Consentement à la mesure d’audience"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card p-4"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center">
        <p className="text-xs leading-relaxed text-foreground/85">
          Pour comprendre où le produit bloque, nous mesurons l’usage du site avec PostHog, sans
          publicité, sans enregistrement de session, sans cookie de tiers. Votre choix est mémorisé
          sur cet appareil et peut être retiré en effaçant les données du site.
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
            onClick={() => {
              saveConsent('no')
              setVisible(false)
            }}
            className="inline-flex h-8 items-center rounded-md border border-input px-3 text-xs font-medium hover:bg-accent"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => {
              saveConsent('yes')
              setVisible(false)
            }}
            className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}
