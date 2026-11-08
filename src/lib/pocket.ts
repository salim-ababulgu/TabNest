// Import des liens exportés depuis Pocket (fichier .html d'export officiel).
// Pocket a fermé le 8 juillet 2025 : cet import permet de récupérer ses liens.

export type PocketEntry = {
  url: string
  title: string
  tags: string[]
  timeAdded?: number
}

const TAG_TO_REASON: Record<string, string> = {
  'a-finir': 'finish',
  finir: 'finish',
  'a-retenir': 'remember',
  retenir: 'remember',
  'a-decider': 'decide',
  decider: 'decide',
  piste: 'explore',
  lead: 'explore',
}

export function reasonFromTags(tags: string[]): string | null {
  for (const tag of tags) {
    const key = tag.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (TAG_TO_REASON[key]) return TAG_TO_REASON[key]
  }
  return null
}

/**
 * Parse le HTML d'export Pocket : chaque lien porte l'URL et le titre ;
 * les étiquettes (tags) sont données en attribut `tags` (séparées par des virgules).
 */
export function parsePocketHtml(html: string): PocketEntry[] {
  const entries: PocketEntry[] = []
  const seen = new Set<string>()
  const anchorPattern = /<a\s+[^>]*href="([^"]+)"[^>]*>/gi

  for (const match of html.matchAll(anchorPattern)) {
    const url = decodeEntities(match[1])
    if (!/^https?:\/\//i.test(url)) continue
    if (seen.has(url)) continue
    seen.add(url)

    const tag = match[0]
    const title = extractTitle(html, match.index as number) || url
    const tagsAttr = /tags="([^"]*)"/i.exec(tag)?.[1] ?? ''
    const timeAttr = /time_added="(\d+)"/i.exec(tag)?.[1]

    entries.push({
      url,
      title,
      tags: tagsAttr
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      timeAdded: timeAttr ? Number(timeAttr) : undefined,
    })
  }

  return entries
}

function decodeEntities(value: string): string {
  const element = document.createElement('textarea')
  element.innerHTML = value
  return element.value
}

function extractTitle(html: string, start: number): string {
  const end = html.indexOf('</a>', start)
  const text = end >= 0 ? html.slice(start, end) : html.slice(start)
  const clean = text.replace(/<[^>]+>/g, '')
  return clean.replace(/\s+/g, ' ').trim()
}
