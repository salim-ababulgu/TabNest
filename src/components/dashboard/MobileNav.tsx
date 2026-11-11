import type { ComponentProps } from 'react'
import { Archive, Clock, LayoutGrid, Menu, Settings, Sparkles, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { NestNav } from '@/components/dashboard/NestNav'
import { useLangValue } from '@/components/landing/i18n'

type NavView =
  | 'today'
  | 'all'
  | 'sites'
  | 'finish'
  | 'explore'
  | 'remember'
  | 'resources'
  | 'ephemeral'
  | 'archives'

const TABS: { id: 'today' | 'all' | 'explore' | 'archives'; labelKey: string; icon: typeof Clock }[] = [
  { id: 'today', labelKey: 'view.today', icon: Clock },
  { id: 'all', labelKey: 'view.all', icon: LayoutGrid },
  { id: 'explore', labelKey: 'view.explore', icon: Compass },
  { id: 'archives', labelKey: 'view.archives', icon: Archive },
]

/** Barre d'onglets fixée en bas, uniquement sur mobile. */
export function MobileTabBar({
  view,
  onSelect,
  onOpenMenu,
  editMode = false,
  onMoveToView,
}: {
  view: NavView
  onSelect: (view: NavView) => void
  onOpenMenu: () => void
  editMode?: boolean
  onMoveToView?: (view: NavView) => void
}) {
  const { t } = useLangValue()
  return (
    <nav
      aria-label={t('nav.mobile.label')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = view === tab.id
          const canReceive = tab.id === 'today' || tab.id === 'all' || tab.id === 'explore'
          return (
            <li key={tab.id}>
              <button
                type="button"
                data-drop-target={canReceive ? tab.id : undefined}
                onClick={() => {
                  if (editMode) {
                    if (canReceive) onMoveToView?.(tab.id)
                    return
                  }
                  onSelect(tab.id)
                }}
                aria-current={active && !editMode ? 'page' : undefined}
                disabled={editMode && !canReceive}
                className={cn(
                  'flex w-full flex-col items-center gap-1 py-2.5 text-[10px] transition-colors',
                  editMode && canReceive && 'text-lime',
                  editMode && !canReceive && 'opacity-40',
                  !editMode && (active ? 'text-foreground' : 'text-muted-foreground'),
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {t(tab.labelKey)}
              </button>
            </li>
          )
        })}
        <li>
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label={t('nav.mobile.openMenu')}
            className="flex w-full flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground"
          >
            <Menu className="size-5" aria-hidden="true" />
            {t('nav.mobile.more')}
          </button>
        </li>
      </ul>
    </nav>
  )
}

/** Tiroir latéral : toutes les sections, les projets et le compte. */
export function MobileMenu({
  open,
  onOpenChange,
  email,
  onOpenSettings,
  nav,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  nav: ComponentProps<typeof NestNav>
  email: string | null | undefined
  onOpenSettings: () => void
}) {
  const { t } = useLangValue()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 gap-0 p-0">
        <SheetHeader className="border-b border-border px-4 py-4 text-left">
          <SheetTitle className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-lime text-lime-foreground">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <span className="font-heading text-lg font-semibold">Filnest</span>
          </SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          <NestNav {...nav} compact />
        </div>

        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={t('dash.openSettings')}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-accent"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-semibold uppercase text-foreground/70">
              {(email ?? '?').charAt(0)}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs text-foreground/70">{email}</span>
            <Settings className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
