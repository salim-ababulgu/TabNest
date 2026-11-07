// Sections personnalisées du nid (façon Notion) : nom + règle de filtrage.
// Stockées localement (par compte) tant qu'aucune table dédiée n'existe en base.

import type { Page } from '@/lib/pages'

export type CollectionRule =
  | { type: 'reason'; reason: string }
  | { type: 'group'; groupId: string }
  | { type: 'documentation' }
  | { type: 'once' }
  | { type: 'ephemeral' }

export type Collection = {
  id: string
  name: string
  rule: CollectionRule
}

export type NestConfig = {
  hidden: string[]
  collections: Collection[]
}

export const MAX_COLLECTIONS = 12

export function normalizeName(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Une étagère ne peut recevoir une carte que si sa règle modifie une propriété. */
export function dropActionFor(rule: CollectionRule): 'reason' | 'group' | null {
  if (rule.type === 'reason') return 'reason'
  if (rule.type === 'group') return 'group'
  return null
}

const EMPTY: NestConfig = { hidden: [], collections: [] }

function storageKey(userId: string): string {
  return `tabnest-nest:${userId}`
}

export function loadNest(userId: string): NestConfig {
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<NestConfig>
    return {
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden.filter((v): v is string => typeof v === 'string') : [],
      collections: Array.isArray(parsed.collections)
        ? parsed.collections.filter(
            (item): item is Collection =>
              Boolean(item) &&
              typeof item.id === 'string' &&
              typeof item.name === 'string' &&
              Boolean(item.rule) &&
              typeof item.rule.type === 'string',
          )
        : [],
    }
  } catch {
    return EMPTY
  }
}

export function saveNest(userId: string, config: NestConfig): void {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(config))
  } catch {
    // stockage indisponible : la configuration ne sera pas conservée
  }
}

export function newCollectionId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

/** Une page correspond-elle à la règle de la section ? */
export function matchesRule(page: Page, rule: CollectionRule): boolean {
  switch (rule.type) {
    case 'reason':
      return page.reason === rule.reason
    case 'group':
      return page.group_id === rule.groupId
    case 'documentation':
      return page.kind === 'documentation'
    case 'once':
      return page.visit_count === 1
    case 'ephemeral':
      return page.kind === 'ephemeral'
    default:
      return false
  }
}

/** Compte les pages de chaque section personnalisée. */
export function countCollections(collections: Collection[], pages: Page[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const collection of collections) {
    counts[collection.id] = pages.filter((page) => matchesRule(page, collection.rule)).length
  }
  return counts
}
