import type { Page } from '@/lib/pages'

export type AlertLevel = 'danger' | 'warning' | 'info'

export type AppAlert = {
  id: string
  level: AlertLevel
  title: string
  description: string
  view: 'today' | 'all' | 'archives'
}

const HOUR = 60 * 60 * 1000
const SOON_MS = 48 * HOUR

function expiryTime(page: Page): number | null {
  return page.expires_at ? new Date(page.expires_at).getTime() : null
}

/**
 * État de l'extension vu depuis le tableau de bord :
 * - absent : extension non détectée sur ce navigateur ;
 * - no-account : extension présente, mais pas connectée à un compte ;
 * - other-account : connectée, mais à un autre compte que celui-ci ;
 * - linked : connectée à ce compte (les pages sont bien enregistrées ici).
 */
export type ExtensionStatus = 'absent' | 'no-account' | 'other-account' | 'linked'

/** Calcule les alertes affichées dans la cloche, à partir des données réelles. */
export function buildAlerts(pages: Page[], extensionStatus: ExtensionStatus): AppAlert[] {
  const now = Date.now()
  const alerts: AppAlert[] = []

  const expired = pages.filter((page) => {
    const time = expiryTime(page)
    return time !== null && time < now
  })

  const soon = pages.filter((page) => {
    const time = expiryTime(page)
    return time !== null && time >= now && time - now <= SOON_MS
  })

  const undecided = pages.filter((page) => !page.reason || page.reason === 'decide')

  if (extensionStatus === 'absent') {
    alerts.push({
      id: 'extension',
      level: 'info',
      title: 'Extension non détectée',
      description: 'Sans elle, vos pages ne sont pas enregistrées automatiquement.',
      view: 'all',
    })
  } else if (extensionStatus === 'no-account') {
    alerts.push({
      id: 'extension-no-account',
      level: 'info',
      title: 'Extension non connectée',
      description:
        'Elle est installée, mais pas reliée à votre compte : vos pages ne sont pas enregistrées. Connectez-la depuis son icône.',
      view: 'all',
    })
  } else if (extensionStatus === 'other-account') {
    alerts.push({
      id: 'extension-other-account',
      level: 'warning',
      title: 'Extension reliée à un autre compte',
      description:
        'Vos pages partent dans un autre compte. Reconnectez l’extension avec ce compte.',
      view: 'all',
    })
  }

  if (pages.length === 0) {
    alerts.push({
      id: 'empty',
      level: 'info',
      title: 'Votre nid est vide',
      description: 'Installez l’extension ou ajoutez une page à la main pour commencer.',
      view: 'all',
    })
  }

  if (expired.length > 0) {
    alerts.push({
      id: `expired:${expired.length}`,
      level: 'danger',
      title: expired.length === 1 ? 'Une page a expiré' : `${expired.length} pages ont expiré`,
      description: 'Retrouvez-les dans les archives pour décider de les garder.',
      view: 'archives',
    })
  }

  if (soon.length > 0) {
    alerts.push({
      id: `soon:${soon.length}`,
      level: 'warning',
      title:
        soon.length === 1 ? 'Une page expire bientôt' : `${soon.length} pages expirent bientôt`,
      description:
        soon.length === 1
          ? `${soon[0].title || shortly(soon[0])} arrive à expiration.`
          : 'Ouvrez-les avant leur expiration pour les garder plus longtemps.',
      view: 'today',
    })
  }

  if (undecided.length > 0 && pages.length > 0) {
    alerts.push({
      id: `undecided:${undecided.length}`,
      level: 'warning',
      title: undecided.length === 1 ? 'Une page à décider' : `${undecided.length} pages à décider`,
      description: 'Choisissez pourquoi vous les gardez : la durée de vie s’adapte.',
      view: 'today',
    })
  }

  return alerts
}

function shortly(page: Page): string {
  if (!page.expires_at) return 'Cette page'
  const hours = Math.max(1, Math.round((new Date(page.expires_at).getTime() - Date.now()) / HOUR))
  return hours < 24 ? `Cette page (${hours} h)` : 'Cette page'
}

function storageKey(userId: string): string {
  return `tabnest-alerts-read:${userId}`
}

/** Identifiants d'alertes déjà lus, pour un utilisateur donné. */
export function loadReadAlerts(userId: string): string[] {
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : []
  } catch {
    return []
  }
}

export function saveReadAlerts(userId: string, ids: string[]): void {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(ids))
  } catch {
    // stockage indisponible : l'état lu ne sera pas conservé
  }
}
