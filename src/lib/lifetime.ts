export type PageKind = 'normal' | 'documentation' | 'ephemeral'

export const KIND_LABELS: Record<PageKind, string> = {
  normal: 'Normale',
  documentation: 'Documentation',
  ephemeral: 'Éphémère',
}

export const PAGE_KINDS: PageKind[] = ['normal', 'documentation', 'ephemeral']

const BASE_HOURS: Record<PageKind, number> = {
  normal: 72,
  documentation: 24 * 30,
  ephemeral: 24 * 7,
}

const GROWTH_PER_VISIT = 0.5

export function computeExpiry(
  kind: string,
  visitCount: number,
  from: Date = new Date(),
): string {
  const base = BASE_HOURS[kind as PageKind] ?? BASE_HOURS.normal
  const multiplier = 1 + Math.max(0, visitCount) * GROWTH_PER_VISIT
  const ms = base * multiplier * 60 * 60 * 1000
  return new Date(from.getTime() + ms).toISOString()
}

export function describeExpiry(expiresAt: string | null): { text: string; expired: boolean } {
  if (!expiresAt) return { text: 'Sans expiration', expired: false }

  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) {
    const days = Math.ceil(Math.abs(diff) / (24 * 60 * 60 * 1000))
    return { text: days <= 1 ? 'Expirée' : `Expirée depuis ${days} j`, expired: true }
  }

  const hours = Math.ceil(diff / (60 * 60 * 1000))
  if (hours < 24) return { text: `Expire dans ${hours} h`, expired: false }
  return { text: `Expire dans ${Math.ceil(hours / 24)} j`, expired: false }
}
