import type { Group, Page } from '@/lib/pages'
import { REASON_LABELS, isReason } from '@/lib/reason'

export type ExportPayload = {
  format: 'tabnest-export'
  version: 1
  exportedAt: string
  counts: { pages: number; groups: number }
  projects: Group[]
  pages: Array<Page & { project: string | null; reasonLabel: string | null }>
}

/** Construit un export lisible : pages complètes + libellés utiles. */
export function buildExport(groups: Group[], pages: Page[]): ExportPayload {
  const projectNames = new Map(groups.map((group) => [group.id, group.name]))
  return {
    format: 'tabnest-export',
    version: 1,
    exportedAt: new Date().toISOString(),
    counts: { pages: pages.length, groups: groups.length },
    projects: groups,
    pages: pages.map((page) => ({
      ...page,
      project: page.group_id ? projectNames.get(page.group_id) ?? null : null,
      reasonLabel: isReason(page.reason) ? REASON_LABELS[page.reason] : null,
    })),
  }
}

/** Déclenche le téléchargement du fichier JSON. */
export function downloadExport(payload: ExportPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `tabnest-export-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Liste Markdown des pages, groupées par projet. */
export function buildMarkdownList(groups: Group[], pages: Page[]): string {
  const projectNames = new Map(groups.map((group) => [group.id, group.name]))
  const sections = new Map<string, Page[]>()

  for (const page of pages) {
    const project = page.group_id ? projectNames.get(page.group_id) ?? 'Sans projet' : 'Sans projet'
    const list = sections.get(project) ?? []
    list.push(page)
    sections.set(project, list)
  }

  const lines = ['# Filnest, mes pages', '']
  for (const [project, list] of sections) {
    lines.push(`## ${project}`, '')
    for (const page of list) {
      lines.push(`- [${page.title || page.url}](${page.url})`)
    }
    lines.push('')
  }
  return lines.join('\n')
}
