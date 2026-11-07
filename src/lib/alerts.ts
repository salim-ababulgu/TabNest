import type { Page } from '@/lib/pages'
import { fmt } from '@/lib/i18n-dash'

export type AlertLevel = 'danger' | 'warning' | 'info'

export type ExtensionStatus = 'absent' | 'no-account' | 'other-account' | 'linked'

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

/** Calcule les alertes affichées dans la cloche, à partir des données réelles. */
export function buildAlerts(
  pages: Page[],
  extensionStatus: 'absent' | 'no-account' | 'other-account' | 'linked',
  t: (key: string) => string,
): AppAlert[] {
  const now = Date.now()
  const alerts: AppAlert[] = []

  const expired = pages.filter((page) => {
    if (page.pinned) return false
    const time = expiryTime(page)
    return time !== null && time < now
  })

  const soon = pages.filter((page) => {
    if (page.pinned) return false
    const time = expiryTime(page)
    return time !== null && time >= now && time - now <= SOON_MS
  })

  const undecided = pages.filter((page) => !page.reason || page.reason === 'decide')

  if (extensionStatus === 'absent') {
    alerts.push({
      id: 'extension',
      level: 'info',
      title: t('alert.extension.title'),
      description: t('alert.extension.desc'),
      view: 'all',
    })
  } else if (extensionStatus === 'no-account') {
    alerts.push({
      id: 'extension-no-account',
      level: 'info',
      title: t('alert.extensionNoAccount.title'),
      description: t('alert.extensionNoAccount.desc'),
      view: 'all',
    })
  } else if (extensionStatus === 'other-account') {
    alerts.push({
      id: 'extension-other-account',
      level: 'warning',
      title: t('alert.extensionOtherAccount.title'),
      description: t('alert.extensionOtherAccount.desc'),
      view: 'all',
    })
  }

  if (pages.length === 0) {
    alerts.push({
      id: 'empty',
      level: 'info',
      title: t('alert.empty.title'),
      description: t('alert.empty.desc'),
      view: 'all',
    })
  }

  if (expired.length > 0) {
    alerts.push({
      id: `expired:${expired.length}`,
      level: 'danger',
      title: fmt(t(expired.length === 1 ? 'alert.expired.one' : 'alert.expired.many'), {
        n: expired.length,
      }),
      description: t('alert.expired.desc'),
      view: 'archives',
    })
  }

  if (soon.length > 0) {
    alerts.push({
      id: `soon:${soon.length}`,
      level: 'warning',
      title: fmt(t(soon.length === 1 ? 'alert.soon.one' : 'alert.soon.many'), { n: soon.length }),
      description:
        soon.length === 1
          ? fmt(t('alert.soon.descOne'), { title: soon[0].title || t('alert.thisPage') })
          : t('alert.soon.desc'),
      view: 'today',
    })
  }

  if (undecided.length > 0 && pages.length > 0) {
    alerts.push({
      id: `undecided:${undecided.length}`,
      level: 'warning',
      title: fmt(t(undecided.length === 1 ? 'alert.undecided.one' : 'alert.undecided.many'), {
        n: undecided.length,
      }),
      description: t('alert.undecided.desc'),
      view: 'today',
    })
  }

  return alerts
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
