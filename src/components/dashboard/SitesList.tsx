import { Pin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLangValue } from '@/components/landing/i18n'
import { fmt } from '@/lib/i18n-dash'
import { isReason } from '@/lib/reason'
import type { Page } from '@/lib/pages'
import { cn } from '@/lib/utils'

export type SiteRow = {
  domain: string
  pages: Page[]
  visits: number
  lastVisit: string | null
  pinned: boolean
  reason: string | null
}

/**
 * Vue « Sites » : une ligne par domaine déjà consulté, avec ses chiffres.
 * Il s'agit du même agrégat que les cartes, présenté en liste dense.
 */
export function SitesList({
  sites,
  onOpen,
  onPin,
  groupName,
  timeAgo,
}: {
  sites: SiteRow[]
  onOpen: (domain: string) => void
  onPin: (domain: string) => void
  groupName: (id: string | null) => string | null
  timeAgo: (iso: string | null) => string
}) {
  const { t } = useLangValue()

  if (sites.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed bg-card px-4 py-12 text-center text-sm text-muted-foreground">
        {t('sites.empty')}
      </div>
    )
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
      <div className="hidden grid-cols-[1.8fr_0.6fr_0.6fr_0.9fr_0.9fr_auto] gap-3 border-b border-border bg-muted/40 px-4 py-2 text-[11px] font-medium text-muted-foreground sm:grid">
        <span>{t('sites.col.domain')}</span>
        <span>{t('sites.col.pages')}</span>
        <span>{t('sites.col.visits')}</span>
        <span>{t('sites.col.last')}</span>
        <span>{t('sites.col.reason')}</span>
        <span className="sr-only">{t('dash.details')}</span>
      </div>

      <ul className="divide-y divide-border">
        {sites.map((site) => {
          const project = groupName(site.pages[0]?.group_id ?? null)
          return (
            <li key={site.domain}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[1.8fr_0.6fr_0.6fr_0.9fr_0.9fr_auto]">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpen(site.domain)}
                    className="min-w-0 truncate text-left text-sm font-medium hover:underline"
                  >
                    {site.domain}
                  </button>
                  {site.pinned && (
                    <span
                      className="rounded-full bg-lime px-1.5 py-0.5 text-[10px] text-lime-foreground"
                      title={t('dash.pinned')}
                    >
                      {t('dash.pinned')}
                    </span>
                  )}
                  {project && (
                    <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">
                      {project}
                    </span>
                  )}
                </div>

                <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">
                  {site.pages.length}
                </span>
                <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">
                  {site.visits}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {timeAgo(site.lastVisit)}
                </span>
                <span
                  className={cn(
                    'hidden text-xs sm:block',
                    site.reason ? 'text-foreground/80' : 'text-muted-foreground',
                  )}
                >
                  {site.reason && isReason(site.reason) ? t(`reason.${site.reason}`) : '—'}
                </span>

                <div className="flex items-center justify-end gap-1">
                  <span className="mr-1 text-[11px] text-muted-foreground sm:hidden">
                    {fmt(t('sites.mobileMeta'), { p: site.pages.length, v: site.visits })}
                  </span>
                  <Button
                    size="icon-sm"
                    variant={site.pinned ? 'default' : 'outline'}
                    onClick={() => onPin(site.domain)}
                    title={site.pinned ? t('dash.unpinAction') : t('dash.pinAction')}
                    aria-label={site.pinned ? t('dash.unpinAction') : t('dash.pinAction')}
                  >
                    <Pin className="size-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onOpen(site.domain)}>
                    {t('dash.details')}
                  </Button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
