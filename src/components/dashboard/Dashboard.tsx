import { useCallback, useEffect, useState } from 'react'
import type { ComponentType, FormEvent, ReactNode } from 'react'
import {
  Archive,
  Bell,
  Bookmark,
  BookOpen,
  Clock,
  Compass,
  LayoutGrid,
  ListTodo,
  LogOut,
  Pin,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth'
import { KIND_LABELS, PAGE_KINDS, describeExpiry } from '@/lib/lifetime'
import type { PageKind } from '@/lib/lifetime'
import { REASON_LABELS, REASON_ORDER } from '@/lib/reason'
import type { Reason } from '@/lib/reason'
import {
  archivePage,
  createGroup,
  createPage,
  fetchGroups,
  fetchPages,
  setPinned,
  setReason,
  visitPage,
} from '@/lib/pages'
import type { Group, Page } from '@/lib/pages'

type View =
  | 'today'
  | 'finish'
  | 'explore'
  | 'remember'
  | 'all'
  | 'resources'
  | 'ephemeral'
  | 'archives'

const VIEWS: { id: View; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'today', label: "Aujourd'hui", icon: Clock },
  { id: 'finish', label: 'À finir', icon: ListTodo },
  { id: 'explore', label: 'Pistes', icon: Compass },
  { id: 'remember', label: 'À retenir', icon: Bookmark },
  { id: 'all', label: 'Tous les retours', icon: LayoutGrid },
  { id: 'resources', label: 'Ressources', icon: BookOpen },
  { id: 'ephemeral', label: 'Outils récurrents', icon: Zap },
  { id: 'archives', label: 'Archives', icon: Archive },
]

const VIEW_TITLES: Record<View, string> = {
  today: "À décider aujourd'hui",
  finish: 'À finir',
  explore: 'Pistes',
  remember: 'À retenir',
  all: 'Tous les retours',
  resources: 'Ressources',
  ephemeral: 'Outils récurrents',
  archives: 'Archives',
}

const NO_GROUP = 'none'
const MAX_STACK = 4

const GRADIENTS = [
  'from-[#dfe7c8] to-[#b9d48a]',
  'from-[#f3e2c7] to-[#e0b98a]',
  'from-[#e6e1f5] to-[#c3b8e8]',
  'from-[#d9ebf2] to-[#a9cfe0]',
  'from-[#f5dcd6] to-[#e8b0a4]',
  'from-[#e8e6dd] to-[#c9c5b4]',
  'from-[#e3f0d8] to-[#b7d99c]',
  'from-[#f0e6c8] to-[#d6c28a]',
]

type Site = {
  domain: string
  pages: Page[]
  visits: number
  lastVisit: string | null
  ogImage: string | null
  favicon: string | null
  themeColor: string | null
  reason: string | null
  pinned: boolean
}

function isExpired(page: Page): boolean {
  if (!page.expires_at) return false
  return new Date(page.expires_at).getTime() < Date.now()
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function gradientFor(domain: string): string {
  let hash = 0
  for (let i = 0; i < domain.length; i += 1) {
    hash = (hash * 31 + domain.charCodeAt(i)) >>> 0
  }
  return GRADIENTS[hash % GRADIENTS.length]
}

function faviconFor(site: Site): string {
  return site.favicon || `https://${site.domain}/favicon.ico`
}

function pagePath(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.pathname}${parsed.search}`.replace(/\/$/, '') || '/'
  } catch {
    return url
  }
}

function uniquePages(pages: Page[]): Page[] {
  const map = new Map<string, Page>()
  for (const page of pages) {
    let key = page.url
    try {
      const parsed = new URL(page.url)
      key = `${parsed.hostname}${parsed.pathname}`
    } catch {
      // garde l'URL brute
    }
    const existing = map.get(key)
    if (!existing || page.visit_count > existing.visit_count) {
      map.set(key, page)
    }
  }
  return [...map.values()].sort((a, b) => b.visit_count - a.visit_count)
}

function SiteAvatar({ site, className }: { site: Site; className?: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className={cn('grid place-items-center overflow-hidden bg-card p-1.5', className)}>
      {failed ? (
        <span className="font-heading text-lg font-semibold uppercase text-ink/40">
          {site.domain.charAt(0)}
        </span>
      ) : (
        <img
          src={faviconFor(site)}
          alt=""
          className="size-full object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  )
}

function formatToday(): string {
  const text = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  return `il y a ${Math.round(hours / 24)} j`
}

function aggregateSites(pages: Page[]): Site[] {
  const map = new Map<string, Site>()
  for (const page of pages) {
    const domain = domainOf(page.url)
    const existing = map.get(domain)
    if (existing) {
      existing.pages.push(page)
      existing.visits += page.visit_count
      if (
        page.last_visited_at &&
        (!existing.lastVisit || page.last_visited_at > existing.lastVisit)
      ) {
        existing.lastVisit = page.last_visited_at
      }
      existing.pinned = existing.pinned || page.pinned
      existing.ogImage = existing.ogImage ?? page.og_image_url
      existing.favicon = existing.favicon ?? page.favicon_url
      existing.themeColor = existing.themeColor ?? page.theme_color
    } else {
      map.set(domain, {
        domain,
        pages: [page],
        visits: page.visit_count,
        lastVisit: page.last_visited_at,
        ogImage: page.og_image_url,
        favicon: page.favicon_url,
        themeColor: page.theme_color,
        reason: page.reason,
        pinned: page.pinned,
      })
    }
  }

  for (const site of map.values()) {
    const counts = new Map<string, number>()
    for (const page of site.pages) {
      if (page.reason) counts.set(page.reason, (counts.get(page.reason) ?? 0) + 1)
    }
    let best: string | null = null
    let bestCount = 0
    for (const [reason, count] of counts) {
      if (count > bestCount) {
        best = reason
        bestCount = count
      }
    }
    site.reason = best
  }

  return [...map.values()]
}

function sortSites(sites: Site[]): Site[] {
  return [...sites].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.visits - a.visits
  })
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-card p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold">{title}</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fermer">
            <X className="size-4" />
          </Button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { user, signOut } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<PageKind>('normal')
  const [groupId, setGroupId] = useState(NO_GROUP)
  const [newGroup, setNewGroup] = useState('')
  const [busy, setBusy] = useState(false)

  const [view, setView] = useState<View>('all')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [extensionConnected, setExtensionConnected] = useState(false)
  const [captureEnabled, setCaptureEnabled] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [showSettings, setShowSettings] = useState(false)
  const [showAddPage, setShowAddPage] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    if (!silent) setError(null)
    try {
      const [nextGroups, nextPages] = await Promise.all([fetchGroups(), fetchPages()])
      setGroups(nextGroups)
      setPages(nextPages)
    } catch (cause) {
      if (!silent) setError(cause instanceof Error ? cause.message : 'Erreur de chargement')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void load(true)
    }, 20000)
    return () => window.clearInterval(interval)
  }, [load])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.source !== 'tabnest-extension') return
      setExtensionConnected(true)
      if (typeof event.data.captureEnabled === 'boolean') {
        setCaptureEnabled(event.data.captureEnabled)
      }
    }

    function checkAttribute() {
      const value = document.documentElement.getAttribute('data-tabnest-extension')
      if (value) {
        setExtensionConnected(true)
        setCaptureEnabled(value !== '0')
      }
    }

    window.addEventListener('message', handleMessage)
    window.postMessage({ source: 'tabnest-page', type: 'ping' }, '*')
    checkAttribute()
    const poll = window.setInterval(checkAttribute, 2000)
    return () => {
      window.removeEventListener('message', handleMessage)
      window.clearInterval(poll)
    }
  }, [])

  async function handleAddPage(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    setBusy(true)
    setError(null)
    try {
      await createPage({
        url: url.trim(),
        title: title.trim(),
        groupId: groupId === NO_GROUP ? null : groupId,
        userId: user.id,
        kind,
      })
      setUrl('')
      setTitle('')
      setKind('normal')
      setGroupId(NO_GROUP)
      setShowAddPage(false)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur lors de l'ajout")
    } finally {
      setBusy(false)
    }
  }

  async function handleAddGroup(event: FormEvent) {
    event.preventDefault()
    if (!user || !newGroup.trim()) return
    setBusy(true)
    setError(null)
    try {
      const group = await createGroup(newGroup.trim(), user.id)
      setNewGroup('')
      setGroupId(group.id)
      setShowAddProject(false)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur lors de la création du projet')
    } finally {
      setBusy(false)
    }
  }

  async function handleVisit(page: Page) {
    setError(null)
    try {
      await visitPage(page)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur')
    }
  }

  async function handleSetReason(page: Page, reason: string | null) {
    setError(null)
    try {
      await setReason(page, reason)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur')
    }
  }

  async function handleTogglePin(site: Site) {
    setError(null)
    try {
      await setPinned(
        site.pages.map((page) => page.id),
        !site.pinned,
      )
      setSelectedSite((current) =>
        current && current.domain === site.domain ? { ...current, pinned: !site.pinned } : current,
      )
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur')
    }
  }

  async function handleDelete(page: Page) {
    if (!window.confirm('Retirer cette page de votre liste ?')) return
    setError(null)
    try {
      await archivePage(page.id)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur')
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await load(true)
    setRefreshing(false)
  }

  function toggleCapture() {
    const next = !captureEnabled
    setCaptureEnabled(next)
    window.postMessage({ source: 'tabnest-page', type: 'set-capture', enabled: next }, '*')
  }

  function groupName(id: string | null): string | null {
    if (!id) return null
    return groups.find((group) => group.id === id)?.name ?? null
  }

  function countFor(id: View): number {
    if (id === 'all') return pages.length
    if (id === 'finish') return pages.filter((page) => page.reason === 'finish').length
    if (id === 'explore') return pages.filter((page) => page.reason === 'explore').length
    if (id === 'remember') return pages.filter((page) => page.reason === 'remember').length
    if (id === 'resources') return pages.filter((page) => page.visit_count === 1).length
    if (id === 'ephemeral') return pages.filter((page) => page.kind === 'ephemeral').length
    if (id === 'archives') return pages.filter(isExpired).length
    return pages.filter((page) => !page.reason || page.reason === 'decide').length
  }

  const visiblePages = pages.filter((page) => {
    if (selectedGroup) return page.group_id === selectedGroup
    if (view === 'all') return true
    if (view === 'finish') return page.reason === 'finish'
    if (view === 'explore') return page.reason === 'explore'
    if (view === 'remember') return page.reason === 'remember'
    if (view === 'resources') return page.visit_count === 1
    if (view === 'ephemeral') return page.kind === 'ephemeral'
    if (view === 'archives') return isExpired(page)
    return !page.reason || page.reason === 'decide'
  })

  const sites = sortSites(aggregateSites(visiblePages))
  const topSites = [...sites]
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.visits - a.visits
    })
    .slice(0, 10)
  const currentTitle = selectedGroup ? groupName(selectedGroup) ?? 'Projet' : VIEW_TITLES[view]
  const mostVisited = [...pages].sort((a, b) => b.visit_count - a.visit_count).slice(0, 3)
  const recentPages = [...pages]
    .filter((page) => page.last_visited_at)
    .sort((a, b) => ((a.last_visited_at ?? '') < (b.last_visited_at ?? '') ? 1 : -1))
    .slice(0, 3)

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-lime text-lime-foreground">
            <Sparkles className="size-4" />
          </span>
          <span className="font-heading text-xl font-semibold">TabNest</span>
        </div>

        <nav className="flex flex-col gap-0.5 px-3">
          {VIEWS.map((item) => {
            const Icon = item.icon
            const active = !selectedGroup && view === item.id
            const count = countFor(item.id)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setView(item.id)
                  setSelectedGroup(null)
                }}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                )}
              >
                <Icon className="size-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {count > 0 && <span className="text-xs tabular-nums opacity-70">{count}</span>}
              </button>
            )
          })}
        </nav>

        <div className="mt-6 flex items-center justify-between px-5">
          <span className="text-[11px] font-medium tracking-[0.18em] text-sidebar-foreground/45 uppercase">
            Projets
          </span>
          <button
            type="button"
            onClick={() => setShowAddProject(true)}
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground"
            aria-label="Nouveau projet"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        <div className="mt-2 flex flex-col gap-0.5 px-3">
          {groups.length === 0 ? (
            <p className="px-3 py-2 text-xs text-sidebar-foreground/45">Aucun projet.</p>
          ) : (
            groups.map((group) => {
              const active = selectedGroup === group.id
              const count = pages.filter((page) => page.group_id === group.id).length
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroup(group.id)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-sidebar-accent text-sidebar-foreground'
                      : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                  )}
                >
                  <span className="size-2 rounded-full bg-lime" />
                  <span className="flex-1 truncate text-left">{group.name}</span>
                  {count > 0 && <span className="text-xs tabular-nums opacity-70">{count}</span>}
                </button>
              )
            })
          )}
        </div>

        <div className="mt-auto px-3 pb-2">
          <button
            type="button"
            onClick={() => {
              setShowSettings(true)
              setSelectedGroup(null)
            }}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
              showSettings
                ? 'bg-sidebar-accent text-sidebar-foreground'
                : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
            )}
          >
            <Settings className="size-4" />
            Paramètres
          </button>
        </div>

        <div className="border-t border-sidebar-border px-5 py-4">
          <p className="truncate text-xs text-sidebar-foreground/60">{user?.email}</p>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <LogOut className="size-3.5" />
            Se déconnecter
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b px-6 py-4">
          <div className="flex items-center gap-2 md:hidden">
            <span className="flex size-7 items-center justify-center rounded-lg bg-lime text-lime-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="font-heading text-lg font-semibold">TabNest</span>
          </div>
          <p className="hidden text-sm text-muted-foreground md:block">{formatToday()}</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => void handleRefresh()}
              title="Rafraîchir"
              aria-label="Rafraîchir"
            >
              <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setShowNotifications(true)}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="size-3.5" />
            </Button>
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
              <span
                className={
                  'size-1.5 rounded-full ' +
                  (extensionConnected ? 'bg-lime' : 'bg-muted-foreground/40')
                }
              />
              {extensionConnected ? 'Extension connectée' : 'Extension non détectée'}
            </span>
            <Button variant="outline" size="sm" onClick={() => signOut()} className="md:hidden">
              Se déconnecter
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
          {error && (
            <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <section className="relative overflow-hidden rounded-2xl border bg-card px-8 py-10">
            <div className="absolute -top-24 -right-24 size-64 rounded-full bg-lime/25 blur-3xl" />
            <div className="relative">
              <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
                Votre mémoire de navigation
              </p>
              <h1 className="mt-3 max-w-xl font-heading text-4xl leading-[1.05] font-medium tracking-tight md:text-5xl">
                Ce qui compte <em className="text-lime-foreground italic">revient</em> au bon moment.
              </h1>
              <p className="mt-4 max-w-lg text-sm text-muted-foreground">
                Fermez vos onglets l'esprit léger. TabNest trie le bruit, préserve l'important et
                vous le rappelle quand il faut.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs">
                <span className="size-1.5 rounded-full bg-lime" />
                {pages.length} page(s) gardée(s)
              </div>
            </div>
          </section>

          {!extensionConnected && (
            <section className="mt-6 rounded-2xl border border-lime/40 bg-lime/10 p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime text-lime-foreground">
                  <Sparkles className="size-5" />
                </span>
                <div className="flex-1">
                  <h2 className="font-heading text-xl font-semibold">
                    Activez la capture automatique
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    TabNest enregistre automatiquement les pages que vous visitez grâce à son
                    extension. Sans elle, votre liste reste vide.
                  </p>
                  <ol className="mt-4 space-y-2 text-sm">
                    <li>
                      <span className="font-medium">1.</span> Ouvre{' '}
                      <code className="rounded bg-secondary px-1 py-0.5">chrome://extensions</code> et
                      active le mode développeur.
                    </li>
                    <li>
                      <span className="font-medium">2.</span> « Charger l'extension non empaquetée » →
                      le dossier{' '}
                      <code className="rounded bg-secondary px-1 py-0.5">extension</code> du projet.
                    </li>
                    <li>
                      <span className="font-medium">3.</span> Clique sur l'icône TabNest et
                      connecte-toi.
                    </li>
                  </ol>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        window.postMessage({ source: 'tabnest-page', type: 'ping' }, '*')
                      }
                    >
                      J'ai installé l'extension
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddPage(true)}>
                      Ajouter une page manuellement
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {topSites.length > 0 && (
            <section className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-medium tracking-tight">Les plus visités</h2>
                <span className="text-xs text-muted-foreground">Accès rapide</span>
              </div>
              <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
                {topSites.map((site) => (
                  <button
                    key={site.domain}
                    type="button"
                    onClick={() => setSelectedSite(site)}
                    className="flex w-20 shrink-0 flex-col items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        'grid size-16 place-items-center rounded-full bg-gradient-to-br p-[2px]',
                        gradientFor(site.domain),
                      )}
                    >
                      <SiteAvatar site={site} className="size-full rounded-full" />
                    </span>
                    <span className="w-full truncate text-center text-[11px] text-muted-foreground">
                      {site.domain}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-2xl font-medium tracking-tight">{currentTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {sites.length} site(s) · {visiblePages.length} page(s)
                  {view === 'today' && !selectedGroup ? ' à traiter sous 48 h' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedGroup && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedGroup(null)}>
                    Tout voir
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowAddProject(true)}>
                  <Plus className="size-3.5" /> Projet
                </Button>
                <Button size="sm" onClick={() => setShowAddPage(true)}>
                  <Plus className="size-3.5" /> Nouvelle page
                </Button>
              </div>
            </div>

            {loading ? (
              <p className="mt-6 text-sm text-muted-foreground">Chargement…</p>
            ) : sites.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed bg-card/50 px-4 py-12 text-center text-sm text-muted-foreground">
                Vos pages apparaîtront ici dès que l'extension sera active (ou ajoute-en une
                manuellement).
              </div>
            ) : (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {sites.map((site) => {
                  const layers = Math.min(site.visits, MAX_STACK) - 1
                  return (
                    <div key={site.domain} className="relative">
                      {Array.from({ length: Math.max(0, layers) }).map((_, index) => (
                        <div
                          key={index}
                          className="absolute inset-0 rounded-2xl border bg-card"
                          style={{
                            transform: `translate(${(index + 1) * 5}px, ${(index + 1) * 5}px)`,
                            opacity: 0.5 - index * 0.12,
                          }}
                        />
                      ))}
                      <article className="relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md">
                        <button
                          type="button"
                          onClick={() => setSelectedSite(site)}
                          className="relative block aspect-[16/10] w-full overflow-hidden bg-secondary text-left"
                        >
                          <div
                            className={cn('absolute inset-0 bg-gradient-to-br', gradientFor(site.domain))}
                          >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(255,255,255,0.55),transparent_60%)]" />
                            {site.themeColor && (
                              <div
                                className="absolute inset-0 opacity-30"
                                style={{ backgroundColor: site.themeColor }}
                              />
                            )}
                            <div className="grid h-full place-items-center">
                              <span className="font-heading text-6xl font-semibold uppercase text-ink/20">
                                {site.domain.charAt(0)}
                              </span>
                            </div>
                          </div>
                          {site.ogImage && (
                            <img
                              src={site.ogImage}
                              alt=""
                              loading="lazy"
                              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                              onError={(event) => {
                                event.currentTarget.style.display = 'none'
                              }}
                            />
                          )}
                          <div className="absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/60 to-transparent p-3 text-xs text-white">
                            <img
                              src={faviconFor(site)}
                              alt=""
                              className="size-5 rounded bg-white/90 p-0.5"
                              onError={(event) => {
                                event.currentTarget.style.display = 'none'
                              }}
                            />
                            <span className="truncate">{site.domain}</span>
                            {site.pinned && (
                              <span className="ml-auto rounded-full bg-lime px-2 py-0.5 text-[10px] font-medium text-lime-foreground">
                                Épinglé
                              </span>
                            )}
                          </div>
                        </button>

                        <div className="flex flex-1 flex-col p-4">
                          <button
                            type="button"
                            onClick={() => setSelectedSite(site)}
                            className="text-left font-heading text-lg leading-snug hover:underline"
                          >
                            {site.domain}
                          </button>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {site.pages.length} page(s) · {site.visits} visite(s) ·{' '}
                            {timeAgo(site.lastVisit)}
                          </p>
                          {site.reason && (
                            <span className="mt-2 inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
                              {REASON_LABELS[site.reason as Reason] ?? site.reason}
                            </span>
                          )}
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <div className="flex flex-wrap gap-1">
                              {site.pages.slice(0, 3).map((page) => (
                                <Badge key={page.id} variant="outline">
                                  {KIND_LABELS[page.kind as PageKind] ?? page.kind}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon-sm"
                                variant={site.pinned ? 'default' : 'outline'}
                                onClick={() => void handleTogglePin(site)}
                                title={site.pinned ? 'Désépingler' : 'Épingler'}
                                aria-label={site.pinned ? 'Désépingler' : 'Épingler'}
                              >
                                <Pin className="size-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setSelectedSite(site)}>
                                Détails
                              </Button>
                            </div>
                          </div>
                        </div>
                      </article>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {selectedSite && (
        <Modal title={selectedSite.domain} onClose={() => setSelectedSite(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <SiteAvatar site={selectedSite} className="size-10 rounded-lg border" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{selectedSite.visits} visite(s) au total</p>
                <p className="text-xs text-muted-foreground">
                  {selectedSite.pages.length} page(s) · dernière visite{' '}
                  {timeAgo(selectedSite.lastVisit)}
                </p>
              </div>
              <Button
                size="sm"
                variant={selectedSite.pinned ? 'default' : 'outline'}
                onClick={() => void handleTogglePin(selectedSite)}
              >
                <Pin className="size-3.5" />
                {selectedSite.pinned ? 'Épinglé' : 'Épingler'}
              </Button>
            </div>

            <div className="space-y-2">
              {uniquePages(selectedSite.pages).map((page) => {
                const expiry = describeExpiry(page.expires_at)
                return (
                  <div key={page.id} className="flex items-center gap-2 rounded-lg border p-2">
                    <div className="min-w-0 flex-1">
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-sm hover:underline"
                      >
                        {page.title || page.url}
                      </a>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {pagePath(page.url)} · {page.visit_count} visite(s) · {expiry.text}
                      </p>
                    </div>
                    <Select
                      value={page.reason ?? 'none'}
                      onValueChange={(value) =>
                        handleSetReason(page, value === 'none' ? null : value)
                      }
                    >
                      <SelectTrigger size="sm" className="w-28">
                        <SelectValue placeholder="Pourquoi ?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Non décidé</SelectItem>
                        {REASON_ORDER.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {REASON_LABELS[reason]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() => handleVisit(page)}
                        title="J'ai visité"
                        aria-label="J'ai visité"
                      >
                        <Clock className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleDelete(page)}
                        title="Supprimer"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Modal>
      )}

      {showNotifications && (
        <Modal title="Notifications" onClose={() => setShowNotifications(false)}>
          <div className="space-y-5 text-sm">
            <div>
              <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                Sites les plus visités
              </p>
              <ul className="mt-2 space-y-1.5">
                {mostVisited.length === 0 ? (
                  <li className="text-muted-foreground">Aucune visite pour l'instant.</li>
                ) : (
                  mostVisited.map((page) => (
                    <li key={page.id} className="flex items-center justify-between gap-3">
                      <span className="truncate">{domainOf(page.url)}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {page.visit_count} visite(s)
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                Dernières visites
              </p>
              <ul className="mt-2 space-y-1.5">
                {recentPages.length === 0 ? (
                  <li className="text-muted-foreground">Aucune activité récente.</li>
                ) : (
                  recentPages.map((page) => (
                    <li key={page.id} className="flex items-center justify-between gap-3">
                      <span className="truncate">{page.title || domainOf(page.url)}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(page.last_visited_at)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </Modal>
      )}

      {showAddPage && (
        <Modal title="Ajouter une page" onClose={() => setShowAddPage(false)}>
          <form onSubmit={handleAddPage} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="url">Adresse</Label>
              <Input
                id="url"
                type="url"
                required
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://exemple.com/article"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Titre (facultatif)</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex. Documentation React"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kind">Type</Label>
              <Select value={kind} onValueChange={(value) => setKind(value as PageKind)}>
                <SelectTrigger id="kind" className="w-full">
                  <SelectValue placeholder="Normale" />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_KINDS.map((pageKind) => (
                    <SelectItem key={pageKind} value={pageKind}>
                      {KIND_LABELS[pageKind]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="group">Projet</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger id="group" className="w-full">
                  <SelectValue placeholder="Aucun projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_GROUP}>Aucun projet</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              Ajouter la page
            </Button>
          </form>
        </Modal>
      )}

      {showAddProject && (
        <Modal title="Créer un projet" onClose={() => setShowAddProject(false)}>
          <form onSubmit={handleAddGroup} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-group">Nom du projet</Label>
              <Input
                id="new-group"
                value={newGroup}
                onChange={(event) => setNewGroup(event.target.value)}
                placeholder="Ex. emploi, achat de voiture"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy || !newGroup.trim()}>
              Créer
            </Button>
          </form>
        </Modal>
      )}

      {showSettings && (
        <Modal title="Paramètres" onClose={() => setShowSettings(false)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
              <div>
                <p className="text-sm font-medium">Capture automatique</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Enregistre automatiquement les pages que vous visitez.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={captureEnabled}
                onClick={toggleCapture}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                  captureEnabled ? 'bg-lime' : 'bg-muted',
                )}
              >
                <span
                  className={cn(
                    'inline-block size-5 rounded-full bg-white shadow transition-transform',
                    captureEnabled ? 'translate-x-5' : 'translate-x-0.5',
                  )}
                />
              </button>
            </div>

            <div className="rounded-xl border p-4 text-sm">
              <p className="font-medium">Extension</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {extensionConnected
                  ? captureEnabled
                    ? 'Connectée et active.'
                    : 'Connectée, capture désactivée.'
                  : "Non détectée. Ouvre l'extension TabNest pour te connecter."}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
