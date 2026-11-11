import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { AsciiReveal, AsciiSkeleton } from 'ascii-reveal'
import { AsciiImage } from '@/components/ui/ascii-image'
import { Flip } from 'gsap/Flip'
import type { ComponentType, FormEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import {
  Archive,
  Bell,
  Bookmark,
  BookOpen,
  Check,
  Clock,
  Compass,
  Globe2,
  GripVertical,
  LayoutGrid,
  ListTodo,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Smartphone,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MobileMenu, MobileTabBar } from '@/components/dashboard/MobileNav'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { PAGE_KINDS } from '@/lib/lifetime'
import type { PageKind } from '@/lib/lifetime'
import { REASON_ORDER, isReason } from '@/lib/reason'
import {
  archivePage,
  createGroup,
  createPage,
  deleteGroup,
  fetchGroups,
  fetchPages,
  renameGroup,
  restorePage,
  setGroupForPages,
  setPinned,
  setReason,
  importPagesBulk,
  visitPage,
} from '@/lib/pages'
import type { Group, Page } from '@/lib/pages'
import { NestNav } from '@/components/dashboard/NestNav'
import { DashboardFooter } from '@/components/dashboard/DashboardFooter'
import { FeedbackPanel } from '@/components/dashboard/FeedbackPanel'
import { SitesList } from '@/components/dashboard/SitesList'
import { SkeletonGrid } from '@/components/dashboard/skeletons'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CARD_BODY_CLASS,
  CARD_GRID_CLASS,
  CARD_SHELL_CLASS,
  CARD_THUMB_CLASS,
} from '@/components/dashboard/cardLayout'
import { useSkeletonVisible } from '@/lib/useSkeletonVisible'
import {
  countCollections,
  loadNest,
  matchesRule,
  newCollectionId,
  saveNest,
  type CollectionRule,
  type NestConfig,
} from '@/lib/collections'
import {
  buildAlerts,
  loadReadAlerts,
  saveReadAlerts,
  type ExtensionStatus,
} from '@/lib/alerts'
import type { AppAlert } from '@/lib/alerts'
import { useLangValue } from '@/components/landing/i18n'
import { fmt } from '@/lib/i18n-dash'
import { useTheme } from '@/lib/theme'
import { trackEvent } from '@/lib/analytics'
import { buildExport, buildMarkdownList, downloadExport } from '@/lib/export'
import { parsePocketHtml, reasonFromTags } from '@/lib/pocket'
import { Toasts } from '@/components/dashboard/Toasts'
import type { ToastItem, ToastLevel } from '@/components/dashboard/Toasts'

gsap.registerPlugin(Flip)

type View =
  | 'today'
  | 'finish'
  | 'explore'
  | 'remember'
  | 'all'
  | 'sites'
  | 'resources'
  | 'ephemeral'
  | 'archives'

const VIEWS: { id: View; labelKey: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'today', labelKey: 'view.today', icon: Clock },
  { id: 'finish', labelKey: 'view.finish', icon: ListTodo },
  { id: 'explore', labelKey: 'view.explore', icon: Compass },
  { id: 'remember', labelKey: 'view.remember', icon: Bookmark },
  { id: 'all', labelKey: 'view.all', icon: LayoutGrid },
  { id: 'sites', labelKey: 'view.sites', icon: Globe2 },
  { id: 'resources', labelKey: 'view.resources', icon: BookOpen },
  { id: 'ephemeral', labelKey: 'view.ephemeral', icon: Zap },
  { id: 'archives', labelKey: 'view.archives', icon: Archive },
]

const VIEW_TITLES: Record<View, string> = {
  today: 'view.todayTitle',
  finish: 'view.finish',
  explore: 'view.explore',
  remember: 'view.remember',
  all: 'view.all',
  sites: 'view.sitesTitle',
  resources: 'view.resources',
  ephemeral: 'view.ephemeral',
  archives: 'view.archives',
}

const NO_GROUP = 'none'
const MAX_STACK = 4

/** En mode déplacement, ces sections servent de destinations. */
const DROP_REASONS: Partial<Record<View, string | null>> = {
  today: 'decide',
  finish: 'finish',
  explore: 'explore',
  remember: 'remember',
  all: null,
}

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
  if (page.pinned) return false
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

function googleFavicon(domain: string): string {
  return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(domain)}`
}

function faviconFor(site: Site): string {
  return site.favicon || googleFavicon(site.domain)
}

function faviconSources(site: Site): string[] {
  const sources: string[] = []
  if (site.favicon) sources.push(site.favicon)
  sources.push(googleFavicon(site.domain))
  sources.push(`https://${site.domain}/favicon.ico`)
  return sources
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
  const [sourceIndex, setSourceIndex] = useState(0)
  const sources = faviconSources(site)
  const failed = sourceIndex >= sources.length
  return (
    <span className={cn('grid place-items-center overflow-hidden bg-card p-1.5', className)}>
      {failed ? (
        <span className="font-heading text-lg font-semibold uppercase text-foreground/40">
          {site.domain.charAt(0)}
        </span>
      ) : (
        <AsciiImage
          src={sources[sourceIndex]}
          alt=""
          className="size-full"
          imgClassName="size-full object-contain"
          skeletonRows={1}
          skeletonCircle
          onError={() => setSourceIndex((index) => index + 1)}
        />
      )}
    </span>
  )
}

const TODAY_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

function formatToday(): string {
  const text = TODAY_FORMATTER.format(new Date())
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function timeAgo(iso: string | null, t: (key: string) => string): string {
  if (!iso) return t('dash.never')
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return t('time.now')
  if (minutes < 60) return fmt(t('time.min'), { n: minutes })
  const hours = Math.round(minutes / 60)
  if (hours < 24) return fmt(t('time.hours'), { n: hours })
  return fmt(t('time.days'), { n: Math.round(hours / 24) })
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
  open = true,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  open?: boolean
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent className="max-h-[85dvh] min-w-0 max-w-[calc(100%-2rem)] overflow-x-hidden overflow-y-auto p-5 max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:h-full max-sm:max-h-none max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:ring-0 sm:max-w-lg sm:p-6">
        <DialogHeader className="min-w-0">
          <DialogTitle className="min-w-0 truncate pr-8 font-heading text-xl font-semibold">
            {title}
          </DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { t, lang, setLang } = useLangValue()
  const { theme, setTheme } = useTheme()
  const [groups, setGroups] = useState<Group[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<PageKind>('normal')
  const [groupId, setGroupId] = useState(NO_GROUP)
  const [newGroup, setNewGroup] = useState('')
  const [busy, setBusy] = useState(false)

  const [view, setView] = useState<View>('all')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [nest, setNest] = useState<NestConfig>({ hidden: [], collections: [] })
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null)
  // Deux informations distinctes : l'extension est-elle présente (détection),
  // et à quel compte est-elle reliée (connexion).
  const [extensionDetected, setExtensionDetected] = useState(false)
  const [extensionAccountId, setExtensionAccountId] = useState<string | null>(null)
  const [captureEnabled, setCaptureEnabled] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [showSettings, setShowSettings] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [pocketProgress, setPocketProgress] = useState<{ done: number; total: number } | null>(null)
  const [showAddPage, setShowAddPage] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null)
  const pendingFlip = useRef<ReturnType<typeof Flip.getState> | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const shownAlerts = useRef<Set<string>>(new Set())

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [readAlerts, setReadAlerts] = useState<string[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [onboardingHidden, setOnboardingHidden] = useState(false)
  const [query, setQuery] = useState('')
  const [draggingSite, setDraggingSite] = useState<Site | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [selectedSites, setSelectedSites] = useState<string[]>([])
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [browserNotifications, setBrowserNotifications] = useState<
    NotificationPermission | 'unsupported'
  >(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    if (!silent) setError(null)
    try {
      // Délai maximal : sans cela, une panne réseau laisse des squelettes à l'infini.
      const timeout = <T,>(promise: Promise<T>): Promise<T> =>
        Promise.race([
          promise,
          new Promise<T>((_, reject) =>
            window.setTimeout(() => reject(new Error(t('dash.loadTimeout'))), 12000),
          ),
        ])
      const [nextGroups, nextPages] = await Promise.all([
        timeout(fetchGroups()),
        timeout(fetchPages()),
      ])
      setGroups(nextGroups)
      setPages(nextPages)
      setLoadedOnce(true)
    } catch (cause) {
      if (!silent) setError(cause instanceof Error ? cause.message : t('dash.loadError'))
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
    let tracked = false
    const markConnected = () => {
      if (!tracked) {
        tracked = true
        trackEvent('extension-connected')
      }
    }

    function handleMessage(event: MessageEvent) {
      if (event.data?.source !== 'tabnest-extension') return
      setExtensionDetected(true)
      markConnected()
      if (typeof event.data.captureEnabled === 'boolean') {
        setCaptureEnabled(event.data.captureEnabled)
      }
      setExtensionAccountId(
        typeof event.data.accountId === 'string' ? event.data.accountId : null,
      )
    }

    function checkAttribute() {
      const value = document.documentElement.getAttribute('data-tabnest-extension')
      if (value) {
        setExtensionDetected(true)
        markConnected()
        setCaptureEnabled(value !== '0')
        setExtensionAccountId(
          document.documentElement.getAttribute('data-tabnest-account') || null,
        )
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

  useLayoutEffect(() => {
    const state = pendingFlip.current
    if (!state) return
    pendingFlip.current = null
    Flip.from(state, {
      duration: 0.55,
      ease: 'power2.out',
      absolute: false,
      scale: true,
    })
  })

  const notify = useCallback((level: ToastLevel, message: string) => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, level, message }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))    }, 4500)
  }, [])

  useEffect(() => {
    if (user?.id) setReadAlerts(loadReadAlerts(user.id))
  }, [user?.id])

  useEffect(() => {
    if (user?.id) setNest(loadNest(user.id))
  }, [user?.id])

  function updateNest(next: NestConfig) {
    setNest(next)
    if (user?.id) saveNest(user.id, next)
  }

  function addCollection(name: string, rule: CollectionRule) {
    const collection = { id: newCollectionId(), name, rule }
    updateNest({ ...nest, collections: [...nest.collections, collection] })
    setActiveCollectionId(collection.id)
    notify('success', fmt(t('nest.created'), { name }))
  }

  function removeCollection(id: string) {
    updateNest({ ...nest, collections: nest.collections.filter((item) => item.id !== id) })
    if (activeCollectionId === id) setActiveCollectionId(null)
  }

  function hideBuiltin(id: string) {
    updateNest({ ...nest, hidden: [...nest.hidden, id] })
    if (view === id) setView('all')
  }

  function renameCollection(id: string, name: string) {
    updateNest({
      ...nest,
      collections: nest.collections.map((item) =>
        item.id === id ? { ...item, name } : item,
      ),
    })
  }

  function restoreDefaults() {
    updateNest({ ...nest, hidden: [] })
  }

  useEffect(() => {
    try {
      setSidebarCollapsed(window.localStorage.getItem('tabnest-sidebar-collapsed') === '1')
    } catch {
      // stockage indisponible : la sidebar reste dépliée
    }
  }, [])

  useEffect(() => {
    try {
      setOnboardingHidden(window.localStorage.getItem('tabnest-onboarding-hidden') === '1')
    } catch {
      // stockage indisponible : le guide reste visible
    }
  }, [])


  function hideOnboarding() {
    setOnboardingHidden(true)
    try {
      window.localStorage.setItem('tabnest-onboarding-hidden', '1')
    } catch {
      // stockage indisponible
    }
  }

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current
      try {
        window.localStorage.setItem('tabnest-sidebar-collapsed', next ? '1' : '0')
      } catch {
        // stockage indisponible
      }
      return next
    })
  }

  const extensionStatus: ExtensionStatus = !extensionDetected
    ? 'absent'
    : !extensionAccountId
      ? 'no-account'
      : extensionAccountId === user?.id
        ? 'linked'
        : 'other-account'
  const extensionLabel: Record<ExtensionStatus, string> = {
    absent: 'dash.statusAbsent',
    'no-account': 'dash.statusNoAccount',
    'other-account': 'dash.statusOtherAccount',
    linked: 'dash.statusLinked',
  }

  const alerts = buildAlerts(pages, extensionStatus, t)
  const unreadAlerts = alerts.filter((alert) => !readAlerts.includes(alert.id))

  const hasReason = pages.some((page) => page.reason && page.reason !== 'decide')
  const onboardingSteps = [
    {
      labelKey: 'dash.onboarding.s1.label',
      detailKey:
        extensionStatus === 'absent'
          ? 'dash.onboarding.s1.absent'
          : extensionStatus === 'linked'
            ? 'dash.onboarding.s1.linked'
            : 'dash.onboarding.s1.pending',
      done: extensionStatus === 'linked',
    },
    {
      labelKey: 'dash.onboarding.s2.label',
      detailKey: 'dash.onboarding.s2.detail',
      done: pages.length > 0,
    },
    {
      labelKey: 'dash.onboarding.s3.label',
      detailKey: 'dash.onboarding.s3.detail',
      done: hasReason,
    },
  ]
  const nextExpiryDays = (() => {
    const now = Date.now()
    const upcoming = pages
      .map((page) => (page.expires_at ? new Date(page.expires_at).getTime() : null))
      .filter((value): value is number => value !== null && value > now)
    if (upcoming.length === 0) return null
    return Math.max(1, Math.ceil((Math.min(...upcoming) - now) / 86_400_000))
  })()

  const onboardingDone = onboardingSteps.every((step) => step.done)
  const onboardingNext = onboardingSteps.find((step) => !step.done)
  // Le guide ne s'ouvre tout seul que pour un compte réellement vide.
  useEffect(() => {
    if (!loadedOnce || loading) return
    if (pages.length > 0 || onboardingHidden || onboardingDone) return
    setShowOnboarding(true)
  }, [loadedOnce, loading, pages.length, onboardingHidden, onboardingDone])


  const onboardingDoneRef = useRef(false)
  useEffect(() => {
    if (onboardingDone && !onboardingDoneRef.current) {
      onboardingDoneRef.current = true
      notify('success', t('dash.onboarding.done'))
      trackEvent('onboarding-complete')
    }
  }, [onboardingDone, notify])

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  useEffect(() => {
    if (pages.length > 0) trackEvent('has-pages')
  }, [pages.length > 0])

  useEffect(() => {
    if (browserNotifications !== 'granted') return
    for (const alert of unreadAlerts) {
      if (shownAlerts.current.has(alert.id)) continue
      shownAlerts.current.add(alert.id)
      try {
        new Notification(alert.title, { body: alert.description, icon: '/favicon.svg' })
      } catch {
        // les notifications du navigateur peuvent être bloquées
      }
    }
  }, [browserNotifications, unreadAlerts])

  function openNotifications() {
    setShowNotifications(true)
    const ids = alerts.map((alert) => alert.id)
    setReadAlerts(ids)
    if (user?.id) saveReadAlerts(user.id, ids)
  }

  function openAlert(alert: AppAlert) {
    setView(alert.view as View)
    setSelectedGroup(null)
    setShowNotifications(false)
  }

  async function enableBrowserNotifications() {
    if (typeof Notification === 'undefined') return
    const permission = await Notification.requestPermission()
    setBrowserNotifications(permission)
    if (permission === 'granted') {
      notify('success', t('dash.toast.browserOn'))
    } else if (permission === 'denied') {
      notify('info', t('dash.toast.browserOff'))
    }
  }

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
      notify('success', t('dash.toast.pageAdded'))
    } catch (cause) {
      notify('error', cause instanceof Error ? cause.message : t('dash.toast.addError'))
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
      notify('success', t('dash.toast.projectCreated'))
    } catch (cause) {
      notify('error', cause instanceof Error ? cause.message : t('dash.toast.projectError'))
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
      notify('error', cause instanceof Error ? cause.message : t('dash.toast.error'))
    }
  }

  async function handleSetReason(page: Page, reason: string | null) {
    setError(null)
    try {
      await setReason(page, reason)
      await load()
      notify(
        'success',
        reason
          ? fmt(t('dash.toast.reasonSaved'), { r: isReason(reason) ? t(`reason.${reason}`) : reason })
          : t('dash.toast.reasonRemoved'),
      )
    } catch (cause) {
      notify('error', cause instanceof Error ? cause.message : t('dash.toast.error'))
    }
  }

  /** Toutes les pages d'un site, même celles masquées par la vue courante. */
  function pagesOfSite(domain: string): Page[] {
    return pages.filter((page) => domainOf(page.url) === domain)
  }

  /** Déplace un site entier (toutes ses pages) vers une section ou un projet. */
  async function moveSite(
    site: Site,
    target:
      | { kind: 'reason'; reason: string | null; label: string }
      | { kind: 'project'; groupId: string | null; label: string },
  ) {
    try {
      const allPages = pagesOfSite(site.domain)
      if (target.kind === 'reason') {
        await Promise.all(allPages.map((page) => setReason(page, target.reason)))
      } else {
        await setGroupForPages(
          allPages.map((page) => page.id),
          target.groupId,
        )
      }
      await load()
      notify('success', fmt(t('dash.toast.movedTo'), { name: target.label }))
    } catch (cause) {
      notify('error', cause instanceof Error ? cause.message : t('dash.toast.error'))
    }
  }

  function applyDrop(site: Site, value: string) {
    // Une cible peut être une étagère personnalisée : on applique sa règle.
    if (value.startsWith('collection:')) {
      const collection = nest.collections.find(
        (item) => item.id === value.slice('collection:'.length),
      )
      if (!collection) return
      if (collection.rule.type === 'reason') {
        void moveSite(site, {
          kind: 'reason',
          reason: collection.rule.reason,
          label: collection.name,
        })
      } else if (collection.rule.type === 'group') {
        void moveSite(site, {
          kind: 'project',
          groupId: collection.rule.groupId,
          label: collection.name,
        })
      }
      return
    }
    // Une cible peut être une section du menu (identifiant de vue) : on la
    // traduit en raison avant d'appliquer.
    if (!value.startsWith('reason:') && !value.startsWith('project:')) {
      if (value in DROP_REASONS) {
        const reason = DROP_REASONS[value as View] ?? null
        applyDrop(site, `reason:${reason ?? 'none'}`)
      }
      return
    }
    if (value.startsWith('reason:')) {
      const raw = value.slice('reason:'.length)
      const reason = raw === 'none' ? null : raw
      void moveSite(site, {
        kind: 'reason',
        reason,
        label: reason && isReason(reason) ? t(`reason.${reason}`) : t('view.all'),
      })
      return
    }
    if (value.startsWith('project:')) {
      const groupId = value.slice('project:'.length)
      const group = groups.find((item) => item.id === groupId)
      void moveSite(site, { kind: 'project', groupId, label: group?.name ?? '' })
    }
  }

  /** Mode déplacement : appui court = sélection ; glissement = la carte entière suit
   *  le pointeur (GSAP) et rétrécit quand elle survole une section du menu. */
  function startEditDrag(site: Site) {
    return (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      const startX = event.clientX
      const startY = event.clientY
      const cardElement = (event.currentTarget as HTMLElement).closest('article') as HTMLElement | null
      const cardRect = cardElement?.getBoundingClientRect() ?? null

      let moved = false
      let ghost: HTMLElement | null = null
      let moveX: ((value: number) => void) | null = null
      let moveY: ((value: number) => void) | null = null
      let shrunk = false

      const cleanupGhost = () => {
        if (ghost) {
          ghost.remove()
          ghost = null
        }
        if (cardElement) cardElement.style.opacity = ''
        moveX = null
        moveY = null
      }

      const findTarget = (x: number, y: number) => {
        const element = document.elementFromPoint(x, y)
        const target = element?.closest('[data-drop-target]') as HTMLElement | null
        return target?.dataset.dropTarget ?? null
      }

      const createGhost = () => {
        if (!cardElement || !cardRect) return
        ghost = cardElement.cloneNode(true) as HTMLElement
        ghost.style.cssText = [
          'position: fixed',
          `left:${cardRect.left}px`,
          `top:${cardRect.top}px`,
          `width:${cardRect.width}px`,
          `height:${cardRect.height}px`,
          'margin:0',
          'pointer-events:none',
          'z-index:60',
          'border-radius:16px',
          'will-change:transform',
        ].join(';')
        document.body.appendChild(ghost)
        cardElement.style.opacity = '0.35'
        moveX = gsap.quickTo(ghost, 'x', { duration: 0.14, ease: 'power3.out' })
        moveY = gsap.quickTo(ghost, 'y', { duration: 0.14, ease: 'power3.out' })
      }

      const onMove = (moveEvent: PointerEvent) => {
        const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY)
        if (!moved && distance < 6) return
        if (!moved) {
          moved = true
          createGhost()
          setDraggingSite(site)
        }
        const dx = moveEvent.clientX - startX
        const dy = moveEvent.clientY - startY
        moveX?.(dx)
        moveY?.(dy)
        setDragPos({ x: moveEvent.clientX, y: moveEvent.clientY })
        const target = findTarget(moveEvent.clientX, moveEvent.clientY)
        setDragOverTarget(target)

        // La carte rétrécit quand elle arrive sur une cible de la navigation.
        if (ghost) {
          if (target && !shrunk) {
            shrunk = true
            gsap.to(ghost, { scale: 0.55, opacity: 0.85, duration: 0.18, ease: 'power2.out' })
          } else if (!target && shrunk) {
            shrunk = false
            gsap.to(ghost, { scale: 1, opacity: 1, duration: 0.18, ease: 'power2.out' })
          }
        }
      }

      const onUp = (upEvent: PointerEvent) => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        const value = moved ? findTarget(upEvent.clientX, upEvent.clientY) : null
        setDraggingSite(null)
        setDragOverTarget(null)
        setDragPos(null)

        if (!moved) {
          cleanupGhost()
          setSelectedSites((current) =>
            current.includes(site.domain)
              ? current.filter((domain) => domain !== site.domain)
              : [...current, site.domain],
          )
          return
        }

        const finish = () => {
          cleanupGhost()
          if (!value) return
          const targets = selectedSites.includes(site.domain) ? selectedSites : [site.domain]
          const involved = sites.filter((item) => targets.includes(item.domain))
          for (const item of involved.length > 0 ? involved : [site]) {
            applyDrop(item, value)
          }
          setSelectedSites([])
        }

        if (ghost && value) {
          const targetElement = document
            .elementFromPoint(upEvent.clientX, upEvent.clientY)
            ?.closest('[data-drop-target]') as HTMLElement | null
          const rect = targetElement?.getBoundingClientRect()
          if (rect && cardRect) {
            gsap.to(ghost, {
              x: rect.left + rect.width / 2 - (cardRect.left + cardRect.width / 2),
              y: rect.top + rect.height / 2 - (cardRect.top + cardRect.height / 2),
              scale: 0.15,
              opacity: 0,
              duration: 0.22,
              ease: 'power2.in',
              onComplete: finish,
            })
            return
          }
        }
        if (ghost && !value) {
          gsap.to(ghost, {
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            duration: 0.2,
            ease: 'power2.out',
            onComplete: finish,
          })
          return
        }
        finish()
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    }
  }

  /** Déplace la sélection vers une section du menu (mode déplacement). */
  function moveSelectionToView(view: View) {
    if (!(view in DROP_REASONS)) return
    if (selectedSites.length === 0) {
      notify('info', t('dash.edit.pickFirst'))
      return
    }
    const reason = DROP_REASONS[view] ?? null
    const involved = sites.filter((item) => selectedSites.includes(item.domain))
    for (const item of involved) {
      applyDrop(item, `reason:${reason ?? 'none'}`)
    }
    setSelectedSites([])
  }

  /** Déplace la sélection vers un projet (mode déplacement). */
  function moveSelectionToGroup(groupId: string) {
    if (selectedSites.length === 0) {
      notify('info', t('dash.edit.pickFirst'))
      return
    }
    const involved = sites.filter((item) => selectedSites.includes(item.domain))
    for (const item of involved) {
      applyDrop(item, `project:${groupId}`)
    }
    setSelectedSites([])
  }

  function exitEditMode() {
    setEditMode(false)
    setSelectedSites([])
    setDragOverTarget(null)
    setDraggingSite(null)
    setDragPos(null)
  }

  /** Plus proche expiration d'un site (pages non épinglées), pour signaler l'urgence. */
  function siteUrgency(site: Site): { text: string; danger: boolean } | null {
    const times = site.pages
      .filter((page) => !page.pinned && page.expires_at)
      .map((page) => new Date(page.expires_at as string).getTime())
    if (times.length === 0) return null
    const diff = Math.min(...times) - Date.now()
    if (diff <= 0) return { text: t('exp.expired'), danger: true }
    const hours = Math.ceil(diff / 3600000)
    if (hours > 48) return null
    return {
      text: hours < 24 ? fmt(t('exp.hours'), { n: hours }) : fmt(t('exp.days'), { n: Math.ceil(hours / 24) }),
      danger: false,
    }
  }

  async function handleTogglePin(site: Site) {
    setError(null)
    const next = !site.pinned
    const ids = site.pages.map((page) => page.id)
    const idSet = new Set(ids)

    const cards = gridRef.current?.querySelectorAll('[data-site]')
    if (cards && cards.length > 0) {
      pendingFlip.current = Flip.getState(cards)
    }

    setPages((current) =>
      current.map((page) => (idSet.has(page.id) ? { ...page, pinned: next } : page)),
    )
    setSelectedSite((current) =>
      current && current.domain === site.domain ? { ...current, pinned: next } : current,
    )

    try {
      await setPinned(ids, next)
      notify('success', next ? t('dash.toast.pinned') : t('dash.toast.unpinned'))
    } catch (cause) {
      setPages((current) =>
        current.map((page) => (idSet.has(page.id) ? { ...page, pinned: !next } : page)),
      )
      notify('error', cause instanceof Error ? cause.message : t('dash.toast.error'))
    }
  }

  function handleDelete(page: Page) {
    setPageToDelete(page)
  }

  async function confirmDelete(page: Page) {
    setPageToDelete(null)
    setError(null)

    const cards = gridRef.current?.querySelectorAll('[data-site]')
    if (cards && cards.length > 0) {
      pendingFlip.current = Flip.getState(cards)
    }

    setPages((current) => current.filter((item) => item.id !== page.id))
    setSelectedSite((current) => {
      if (!current) return current
      const remaining = current.pages.filter((item) => item.id !== page.id)
      if (remaining.length === 0) return null
      return { ...current, pages: remaining }
    })

    try {
      await archivePage(page.id)
      notify('success', t('dash.toast.pageRemoved'))
    } catch (cause) {
      notify('error', cause instanceof Error ? cause.message : t('dash.toast.error'))
      await load(true)
    }
  }

  async function handleRenameProject(id: string, name: string) {
    try {
      await renameGroup(id, name)
      await load()
      notify('success', t('dash.toast.projectRenamed'))
    } catch (cause) {
      notify('error', cause instanceof Error ? cause.message : t('dash.toast.error'))
    }
  }

  async function confirmDeleteProject() {
    if (!projectToDelete) return
    const id = projectToDelete
    try {
      await deleteGroup(id)
      setProjectToDelete(null)
      if (selectedGroup === id) setSelectedGroup(null)
      await load()
      notify('success', t('dash.toast.projectDeleted'))
    } catch (cause) {
      notify('error', cause instanceof Error ? cause.message : t('dash.toast.error'))
    }
  }

  /** Restaure toutes les pages expirées d'un site (nouvelle durée de vie). */
  async function handleRestoreSite(site: Site) {
    try {
      const expired = pagesOfSite(site.domain).filter(isExpired)
      if (expired.length === 0) return
      await Promise.all(expired.map((page) => restorePage(page)))
      await load()
      notify('success', fmt(t('dash.restored'), { n: expired.length }))
    } catch (cause) {
      notify('error', cause instanceof Error ? cause.message : t('dash.toast.error'))
    }
  }

  async function deleteMyAccount() {
    setDeletingAccount(true)
    try {
      const { error } = await supabase.rpc('delete_my_account')
      if (error) throw error
      notify('success', t('dash.toast.accountDeleted'))
      await signOut()
    } catch (cause) {
      notify('error', cause instanceof Error ? cause.message : t('dash.toast.error'))
    } finally {
      setDeletingAccount(false)
    }
  }

  async function handlePocketImport(file: File) {
    if (!user) return
    try {
      const text = await file.text()
      const entries = parsePocketHtml(text)
      if (entries.length === 0) {
        notify('info', t('pocket.empty'))
        return
      }
      const result = await importPagesBulk(
        entries.map((entry) => ({
          url: entry.url,
          title: entry.title,
          reason: reasonFromTags(entry.tags),
        })),
        user.id,
        (done, total) => setPocketProgress({ done, total }),
      )
      await load()
      notify('success', fmt(t('pocket.imported'), { n: result.imported, s: result.skipped }))
    } catch (cause) {
      notify('error', cause instanceof Error ? cause.message : t('dash.toast.error'))
    } finally {
      setPocketProgress(null)
    }
  }

  async function handleRefresh() {    setRefreshing(true)
    try {
      await load(true)
    } finally {
      setRefreshing(false)
    }
  }

  function handleExportJson() {
    try {
      downloadExport(buildExport(groups, pages))
      notify('success', t('dash.toast.exportDone'))
    } catch {
      notify('error', t('dash.toast.exportError'))
    }
  }

  async function handleCopyLinks() {
    try {
      await navigator.clipboard.writeText(buildMarkdownList(groups, pages))
      notify('success', t('dash.toast.linksCopied'))
    } catch {
      notify('error', t('dash.toast.copyError'))
    }
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
    if (id === 'sites') return new Set(pages.map((page) => domainOf(page.url))).size
    if (id === 'finish') return pages.filter((page) => page.reason === 'finish').length
    if (id === 'explore') return pages.filter((page) => page.reason === 'explore').length
    if (id === 'remember') return pages.filter((page) => page.reason === 'remember').length
    if (id === 'resources') return pages.filter((page) => page.visit_count === 1).length
    if (id === 'ephemeral') return pages.filter((page) => page.kind === 'ephemeral').length
    if (id === 'archives') return pages.filter(isExpired).length
    return pages.filter((page) => !page.reason || page.reason === 'decide').length
  }

  const showSkeleton = useSkeletonVisible(loading && !loadedOnce)

  const normalizedQuery = query.trim().toLowerCase()
  const activeCollection = nest.collections.find((item) => item.id === activeCollectionId) ?? null
  const expiredCount = pages.filter(isExpired).length
  const visiblePages = pages.filter((page) => {
    if (normalizedQuery) {
      const haystack = `${page.title ?? ''} ${page.url} ${domainOf(page.url)}`.toLowerCase()
      if (!haystack.includes(normalizedQuery)) return false
    }
    // Les pages expirées sont masquées partout, sauf dans les archives.
    if (view !== 'archives' && !selectedGroup && !activeCollection && isExpired(page)) return false
    if (activeCollection) return matchesRule(page, activeCollection.rule)
    if (selectedGroup) return page.group_id === selectedGroup
    if (view === 'all' || view === 'sites') return true
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
  const currentTitle = activeCollection
    ? activeCollection.name
    : selectedGroup
      ? groupName(selectedGroup) ?? t('dash.project')
      : t(VIEW_TITLES[view])

  function expiryText(page: Page): string {
    if (page.pinned) return t('exp.pinned')
    if (!page.expires_at) return t('exp.none')
    const diff = new Date(page.expires_at).getTime() - Date.now()
    if (diff <= 0) {
      const days = Math.ceil(Math.abs(diff) / (24 * 60 * 60 * 1000))
      return days <= 1 ? t('exp.expired') : fmt(t('exp.expiredDays'), { n: days })
    }
    const hours = Math.ceil(diff / (60 * 60 * 1000))
    if (hours < 24) return fmt(t('exp.hours'), { n: hours })
    return fmt(t('exp.days'), { n: Math.ceil(hours / 24) })
  }

  const nestNavProps = {
    builtins: VIEWS.filter((item) => !nest.hidden.includes(item.id)).map((item) => ({
      id: item.id,
      labelKey: item.labelKey,
      icon: item.icon,
      count: countFor(item.id),
    })),
    collections: nest.collections,
    collectionCounts: countCollections(nest.collections, pages),
    view,
    activeCollection: activeCollectionId,
    editMode,
    projects: groups.map((group) => ({
      id: group.id,
      name: group.name,
      count: pages.filter((page) => page.group_id === group.id).length,
    })),
    selectedGroup,
    keepViews: ['today', 'all', 'archives'],
    onSelectView: (id: string) => {
      if (editMode) {
        moveSelectionToView(id as View)
        return
      }
      setView(id as View)
      setSelectedGroup(null)
      setActiveCollectionId(null)
      setMobileMenuOpen(false)
    },
    onSelectCollection: (id: string) => {
      setActiveCollectionId(id)
      setSelectedGroup(null)
      setMobileMenuOpen(false)
    },
    onSelectGroup: (id: string) => {
      if (editMode) {
        moveSelectionToGroup(id)
        return
      }
      setSelectedGroup(id)
      setActiveCollectionId(null)
      setMobileMenuOpen(false)
    },
    onAddCollection: addCollection,
    onRemoveCollection: removeCollection,
    onRenameCollection: renameCollection,
    onHideBuiltin: hideBuiltin,
    onRestoreDefaults: restoreDefaults,
    onRenameProject: handleRenameProject,
    onDeleteProject: (id: string) => setProjectToDelete(id),
    onToggleEdit: () => setEditMode((current) => !current),
    onAddProject: () => {
      setShowAddProject(true)
      setMobileMenuOpen(false)
    },
    dropViews: Object.keys(DROP_REASONS),
    dragOver: dragOverTarget,
    loading: loading && !loadedOnce,
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex',
          sidebarCollapsed ? 'w-16' : 'w-64',
        )}
      >
        <div
          className={cn(
            'flex shrink-0 items-center gap-2',
            sidebarCollapsed ? 'flex-col px-2 py-3' : 'px-5 py-5',
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-lime text-lime-foreground">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          {!sidebarCollapsed && (
            <span className="font-heading text-xl font-semibold">Filnest</span>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? t('dash.expandMenu') : t('dash.collapseMenu')}
            aria-label={sidebarCollapsed ? t('dash.expandMenu') : t('dash.collapseMenu')}
            aria-expanded={!sidebarCollapsed}
            className={cn(
              'rounded-md p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              !sidebarCollapsed && 'ml-auto',
            )}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="size-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          <NestNav {...nestNavProps} collapsed={sidebarCollapsed} />
        </div>

        <div className="shrink-0 border-t border-sidebar-border px-2 py-2">
          <button
            type="button"
            onClick={() => {
              setShowSettings(true)
              setSelectedGroup(null)
            }}
            title={t('dash.settings')}
            aria-label={t('dash.settings')}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg text-sm transition-colors',
              sidebarCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
              showSettings
                ? 'bg-sidebar-accent text-sidebar-foreground'
                : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
            )}
          >
            <Settings className="size-4 shrink-0" aria-hidden="true" />
            {!sidebarCollapsed && <span>{t('dash.settings')}</span>}
          </button>
        </div>

        <div className="shrink-0 border-t border-sidebar-border px-2 py-3">
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              title={user?.email ?? t('dash.settings')}
              aria-label={t('dash.openSettings')}
              className="mx-auto grid size-8 place-items-center rounded-full bg-sidebar-accent text-[10px] font-semibold uppercase text-sidebar-foreground transition-shadow hover:ring-1 hover:ring-lime/70"
            >
              {(user?.email ?? '?').charAt(0)}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              aria-label={t('dash.openSettings')}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sidebar-accent text-[10px] font-semibold uppercase text-sidebar-foreground">
                {(user?.email ?? '?').charAt(0)}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-sidebar-foreground/75">
                {user?.email}
              </span>
              <Settings className="size-3.5 shrink-0 text-sidebar-foreground/60" aria-hidden="true" />
            </button>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-field bg-field text-field-ink px-4 py-3 md:gap-4 md:px-6 md:py-4">
          <div className="flex items-center gap-2 lg:hidden">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={t('dash.openMenu')}
              className="border-white/20 bg-transparent text-field-ink hover:bg-white/10 hover:text-field-ink"
            >
              <Menu className="size-4" aria-hidden="true" />
            </Button>
            <span className="flex size-7 items-center justify-center rounded-lg bg-lime text-lime-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="font-heading text-lg font-semibold">Filnest</span>
          </div>
          <p className="hidden text-sm text-field-muted lg:block">{formatToday()}</p>
          <div className="flex items-center gap-1.5 md:gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => void handleRefresh()}
              title={t('dash.refresh')}
              aria-label={t('dash.refresh')}
              className="border-white/20 bg-transparent text-field-ink hover:bg-white/10 hover:text-field-ink"
            >
              <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
            </Button>
            <Popover
              open={showNotifications}
              onOpenChange={(open) => {
                if (open) openNotifications()
                else setShowNotifications(false)
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  title={t('dash.alerts')}
                  aria-label={
                    unreadAlerts.length > 0
                      ? fmt(t('dash.alertsUnread'), { n: unreadAlerts.length })
                      : t('dash.alerts')
                  }
                  className="relative border-white/20 bg-transparent text-field-ink hover:bg-white/10 hover:text-field-ink"
                >
                  <Bell className="size-3.5" />
                  {unreadAlerts.length > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-lime text-[9px] font-semibold text-lime-foreground"
                    >
                      {unreadAlerts.length > 9 ? '9+' : unreadAlerts.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[calc(100vw-2rem)] max-w-[340px] p-0">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-medium">{t('dash.alerts')}</p>
                  <span className="text-xs text-muted-foreground">
                    {unreadAlerts.length > 0
                      ? fmt(t('dash.unreadCount'), { n: unreadAlerts.length })
                      : t('dash.upToDate')}
                  </span>
                </div>

                <div className="max-h-[55vh] overflow-y-auto p-2">
                  {alerts.length === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                      {t('dash.noAlerts')}
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {alerts.map((alert) => (
                        <li key={alert.id}>
                          <button
                            type="button"
                            onClick={() => openAlert(alert)}
                            className="flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left transition-colors hover:bg-accent"
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                'mt-1 size-2 shrink-0 rounded-full',
                                alert.level === 'danger'
                                  ? 'bg-destructive'
                                  : alert.level === 'warning'
                                    ? 'bg-lime'
                                    : 'bg-muted-foreground/50',
                              )}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium">{alert.title}</span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {alert.description}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="border-t border-border px-4 py-2.5">
                  <p className="text-[11px] text-muted-foreground">
                    {browserNotifications === 'granted'
                      ? t('dash.alertFooterBrowser')
                      : t('dash.alertFooterHint')}
                  </p>
                </div>
              </PopoverContent>
            </Popover>
            <span className="hidden items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-xs text-field-muted lg:inline-flex">
              <span
                className={
                  'size-1.5 rounded-full ' +
                  (extensionStatus === 'linked' ? 'bg-lime' : 'bg-muted-foreground/40')
                }
              />
              {t(extensionLabel[extensionStatus])}
            </span>
            {extensionStatus !== 'linked' && (
              <a
                href="/extension"
                className="hidden text-xs text-field-muted underline-offset-2 hover:text-field-ink hover:underline lg:inline"
              >
                {t(extensionStatus === 'absent' ? 'dash.installLink' : 'dash.connectLink')}
              </a>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 md:px-6 md:py-8 md:pb-8">
          {error && (
            <div
              role="alert"
              className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <span>{error}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void load()}
                className="border-destructive/40 text-destructive"
              >
                {t('dash.retry')}
              </Button>
            </div>
          )}

          <div className="mb-4 flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-xs leading-relaxed text-muted-foreground md:hidden">
            <Smartphone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{t('dash.mobileReadOnly')}</span>
          </div>

          {!loadedOnce ? (
            <section
              data-dash-anim
              aria-busy="true"
              data-skeleton-hero=""
              className="relative overflow-hidden rounded-2xl bg-field px-5 py-7 text-field-ink md:px-8 md:py-8"
            >
              <AsciiSkeleton variant="dither" rows={2} width={160} />
              <AsciiSkeleton
                variant="scan"
                lines={1}
                widths={[120]}
                className="mt-4 block opacity-70"
              />
            </section>
          ) : pages.length === 0 ? (
            <section
              data-dash-anim
              className="relative overflow-hidden rounded-2xl bg-field px-5 py-8 text-field-ink md:px-8 md:py-10"
            >
              <p className="text-xs text-field-muted">{t('dash.hero.freshLabel')}</p>
              <h1 className="mt-2 max-w-xl font-heading text-3xl leading-[1.05] font-medium tracking-tight md:text-4xl">
                {t('dash.hero.freshTitle')}
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-field-muted">
                {t('dash.hero.freshSub')}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOnboarding(true)}
                  className="inline-flex h-10 items-center rounded-full bg-lime px-4 text-sm font-semibold text-lime-foreground"
                >
                  {t('dash.onboarding.open')}
                </button>
                <a
                  href="/extension"
                  className="inline-flex h-10 items-center rounded-full border border-white/20 px-4 text-sm text-field-ink hover:bg-white/10"
                >
                  {t('dash.onboarding.cta.install')}
                </a>
              </div>
            </section>
          ) : (
            <section
              data-dash-anim
              className="relative overflow-hidden rounded-2xl bg-field px-5 py-7 text-field-ink md:px-8 md:py-8"
            >
              <AsciiReveal
                as="div"
                preset="dither"
                duration="fast"
                lazy={false}
                className="block"
              >
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs text-field-muted">{t('dash.hero.todayLabel')}</p>
                  <p className="mt-1 font-heading text-5xl leading-none tracking-[-0.03em] tabular-nums">
                    {pages.length}
                  </p>
                  <p className="mt-2 text-sm text-field-muted">{t('dash.hero.pagesLabel')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-field-muted">
                  <span>{fmt(t('dash.hero.sitesLabel'), { n: sites.length })}</span>
                  {nextExpiryDays !== null && (
                    <span>{fmt(t('dash.hero.nextExpiry'), { d: nextExpiryDays })}</span>
                  )}
                  {!onboardingDone && (
                    <button
                      type="button"
                      onClick={() => setShowOnboarding(true)}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs text-field-ink hover:bg-white/10"
                    >
                      {fmt(t('dash.onboarding.progress'), {
                        done: onboardingSteps.filter((step) => step.done).length,
                        total: onboardingSteps.length,
                      })}
                    </button>
                  )}
                </div>
              </div>
              </AsciiReveal>
            </section>
          )}

          {loading && !loadedOnce ? (
            <section className="mt-8" aria-busy="true" data-skeleton-top="">
              <div className="flex items-center justify-between">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-3.5 w-24" />
              </div>
              <div className="mt-3 flex gap-4 overflow-hidden pb-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex w-20 shrink-0 flex-col items-center gap-1.5">
                    <Skeleton className="size-16 rounded-full" delay={(index % 6) * 60} />
                    <Skeleton className="h-3.5 w-16" delay={(index % 6) * 60} />
                  </div>
                ))}
              </div>
            </section>
          ) : (
            topSites.length > 0 && (
              <section data-dash-anim className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-medium tracking-tight">
                  {t('dash.mostVisited')}
                </h2>
                <span className="text-xs text-muted-foreground">{t('dash.quickAccess')}</span>
              </div>
              <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
                {topSites.map((site) => (
                  <button
                    key={site.domain}
                    type="button"
                    onClick={() => setSelectedSite(site)}
                    className="flex w-20 shrink-0 flex-col items-center gap-1.5"
                  >
                    <span className="grid size-16 place-items-center rounded-full bg-border p-[2px]">
                      <SiteAvatar site={site} className="size-full rounded-full" />
                    </span>
                    <span className="w-full truncate text-center text-[11px] text-muted-foreground">
                      {site.domain}
                    </span>
                  </button>
                ))}
              </div>
              </section>
            )
          )}

          <section className="mt-8">
            <div data-dash-anim className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-2xl font-medium tracking-tight">{currentTitle}</h2>
                <div className="mt-1 min-h-5 text-sm text-muted-foreground">
                  {loading && !loadedOnce ? (
                    <Skeleton className="h-4 w-44" />
                  ) : (
                    <>
                      {fmt(t('dash.counts'), { s: sites.length, p: visiblePages.length })}
                      {view === 'today' && !selectedGroup ? ` ${t('dash.todayHint')}` : ''}
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    ref={searchRef}
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setQuery('')
                    }}
                    placeholder={t('dash.searchPlaceholder')}
                    aria-label={t('dash.searchAria')}
                    className="h-8 w-44 pr-8 pl-8 text-xs md:w-60"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label={t('dash.searchClear')}
                      className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
                {selectedGroup && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedGroup(null)}>
                    {t('dash.showAll')}
                  </Button>
                )}
                <Button
                  variant={editMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEditMode((current) => !current)}
                  aria-pressed={editMode}
                >
                  <GripVertical className="size-3.5" /> {t('dash.edit.start')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddProject(true)}>
                  <Plus className="size-3.5" /> {t('dash.project')}
                </Button>
                <Button size="sm" onClick={() => setShowAddPage(true)}>
                  <Plus className="size-3.5" /> {t('dash.newPage')}
                </Button>
              </div>
            </div>

            {editMode && (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-lime bg-card px-3 py-2 max-sm:sticky max-sm:top-16 max-sm:z-20">
                <p className="flex items-center gap-1.5 text-xs font-medium">
                  <GripVertical className="size-4 text-muted-foreground" aria-hidden="true" />
                  {t('dash.edit.title')}
                </p>
                <p className="min-w-0 flex-1 text-xs text-muted-foreground">
                  {selectedSites.length > 0
                    ? `${fmt(t('dash.edit.selected'), { n: selectedSites.length })} · ${t('dash.edit.hint')}`
                    : t('dash.edit.hint')}
                </p>
                <Button size="sm" variant="ghost" onClick={exitEditMode}>
                  {t('dash.edit.done')}
                </Button>
              </div>
            )}

            {!loading && !showSkeleton && expiredCount > 0 && view !== 'archives' && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs">
                <span>{fmt(t('dash.expiredHidden'), { n: expiredCount })}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setView('archives')
                    setSelectedGroup(null)
                    setActiveCollectionId(null)
                  }}
                >
                  {t('dash.seeArchives')}
                </Button>
              </div>
            )}

            {loading ? (
              showSkeleton ? (
                <SkeletonGrid count={9} />
              ) : null
            ) : view === 'sites' ? (
              <SitesList
                sites={sites}
                onOpen={(domain) => {
                  const site = sites.find((item) => item.domain === domain)
                  if (site) setSelectedSite(site)
                }}
                onPin={(domain) => {
                  const site = sites.find((item) => item.domain === domain)
                  if (site) void handleTogglePin(site)
                }}
                groupName={groupName}
                timeAgo={(iso) => timeAgo(iso, t)}
              />
            ) : sites.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed bg-card px-4 py-12 text-center text-sm text-muted-foreground">
                {query ? (
                  <>
                    {fmt(t('dash.noResults'), { q: query })}{' '}
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      {t('dash.searchClear')}
                    </button>
                  </>
                ) : (
                  <>
                    {t('dash.emptyState')}
                  </>
                )}
              </div>
            ) : (
              <div
                ref={gridRef}
                data-dash-anim
                className={CARD_GRID_CLASS}
              >
                {sites.map((site) => {
                  const layers = Math.min(site.visits, MAX_STACK) - 1
                  const urgency = siteUrgency(site)
                  return (
                    <div key={site.domain} data-site={site.domain} className="relative">
                      {Array.from({ length: Math.max(0, layers) }).map((_, index) => (
                        <div
                          key={index}
                          className="absolute inset-0 hidden rounded-2xl border bg-card sm:block"
                          style={{
                            transform: `translate(${(index + 1) * 5}px, ${(index + 1) * 5}px)`,
                            opacity: 0.5 - index * 0.12,
                          }}
                        />
                      ))}
                      <article
                        className={cn(CARD_SHELL_CLASS, !editMode && 'hover:border-foreground/25')}
                      >
                        {editMode && (
                          <div
                            role="button"
                            tabIndex={0}
                            aria-label={site.domain}
                            onPointerDown={startEditDrag(site)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') setEditMode(false)
                            }}
                            className={cn(
                              'absolute inset-0 z-10 flex touch-none items-center justify-center rounded-2xl bg-background/85 transition-colors select-none hover:bg-lime/5 hover:ring-1 hover:ring-lime/40',
                              selectedSites.includes(site.domain) &&
                                'bg-lime/10 ring-2 ring-lime ring-inset',
                              draggingSite?.domain === site.domain
                                ? 'cursor-grabbing opacity-40'
                                : 'cursor-grab',
                            )}
                          >
                            <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-none">
                              {selectedSites.includes(site.domain) ? (
                                <Check className="size-3.5 text-lime" aria-hidden="true" />
                              ) : (
                                <GripVertical className="size-3.5 text-muted-foreground" aria-hidden="true" />
                              )}
                              {site.domain}
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedSite(site)}
                          className={CARD_THUMB_CLASS}
                        >
                          <div className="absolute inset-0 bg-secondary">
                            {site.themeColor && (
                              <div
                                className="absolute inset-0 opacity-25"
                                style={{ backgroundColor: site.themeColor }}
                              />
                            )}
                            <div className="grid h-full place-items-center">
                              <span className="grid size-14 place-items-center rounded-2xl border border-border bg-card font-heading text-xl font-semibold uppercase text-foreground/70 sm:size-16 sm:text-2xl">
                                {site.domain.charAt(0)}
                              </span>
                            </div>
                          </div>
                          {site.ogImage && (
                            <AsciiImage
                              src={site.ogImage}
                              alt=""
                              className="absolute inset-0"
                              imgClassName="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                              skeletonRows={3}
                            />
                          )}
                          <div className="absolute inset-x-0 top-0 hidden items-center gap-2 bg-black/50 p-3 text-xs text-white sm:flex">
                            <AsciiImage
                              src={faviconFor(site)}
                              alt=""
                              className="size-5 rounded bg-white/90"
                              imgClassName="size-full rounded object-contain p-0.5"
                              skeletonRows={1}
                            />
                            <span className="hidden truncate sm:inline">{site.domain}</span>
                            {site.pinned && (
                              <span className="ml-auto rounded-full bg-lime px-2 py-0.5 text-[10px] font-medium text-lime-foreground">
                                {t('dash.pinned')}
                              </span>
                            )}
                          </div>
                        </button>

                        <div className={CARD_BODY_CLASS}>
                          <div className="flex min-w-0 items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedSite(site)}
                              className="min-w-0 truncate text-left font-heading text-base leading-snug hover:underline sm:text-lg"
                            >
                              {site.domain}
                            </button>
                            {site.pinned && (
                              <span
                                aria-hidden="true"
                                className="size-1.5 shrink-0 rounded-full bg-lime sm:hidden"
                              />
                            )}
                          </div>
                          {site.pages[0]?.title && (
                            <p className="mt-0.5 truncate text-[11px] text-foreground/70 sm:text-xs">
                              {site.pages[0].title}
                            </p>
                          )}
                          <p className="mt-0.5 truncate text-[11px] text-foreground/70 sm:mt-1 sm:text-xs">
                            {fmt(t('dash.cardMeta'), {
                              p: site.pages.length,
                              v: site.visits,
                              when: timeAgo(site.lastVisit, t),
                            })}
                          </p>
                          {site.pages[0] && (
                            <p className="mt-1 text-[11px] text-foreground/70">
                              {expiryText(site.pages[0])}
                            </p>
                          )}
                          {urgency && (
                            <span
                              className={cn(
                                'mt-1 inline-flex w-fit items-center gap-1 text-[10px] font-medium',
                                urgency.danger ? 'text-destructive' : 'text-foreground/60',
                              )}
                            >
                              <span
                                aria-hidden="true"
                                className={cn(
                                  'size-1.5 rounded-full',
                                  urgency.danger ? 'bg-destructive' : 'bg-lime',
                                )}
                              />
                              {urgency.text}
                            </span>
                          )}
                          {site.reason && (
                            <span className="mt-2 inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
                              {isReason(site.reason) ? t(`reason.${site.reason}`) : site.reason}
                            </span>
                          )}
                          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 sm:pt-3">
                            <div className="flex flex-wrap gap-1">
                              {site.pages.slice(0, 3).map((page) => (
                                <Badge key={page.id} variant="outline">
                                  {t(`kind.${page.kind}`)}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-1">
                              {view === 'archives' && site.pages.some(isExpired) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => void handleRestoreSite(site)}
                                  title={t('dash.restore')}
                                >
                                  <RotateCcw className="size-3.5" />
                                  <span className="max-sm:hidden">{t('dash.restore')}</span>
                                </Button>
                              )}
                              <Button
                                size="icon-sm"
                                variant={site.pinned ? 'default' : 'outline'}
                                onClick={() => void handleTogglePin(site)}
                                title={site.pinned ? t('dash.unpinAction') : t('dash.pinAction')}
                                aria-label={site.pinned ? t('dash.unpinAction') : t('dash.pinAction')}
                              >
                                <Pin className="size-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setSelectedSite(site)}>
                                {t('dash.details')}
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

          <DashboardFooter />
        </main>
      </div>

        {selectedSite && (
        <Modal title={selectedSite.domain} onClose={() => setSelectedSite(null)}>
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <SiteAvatar site={selectedSite} className="size-10 shrink-0 rounded-lg border" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {fmt(t('dash.visitsTotal'), { n: selectedSite.visits })}
                </p>
                <p className="min-w-0 truncate text-xs text-muted-foreground">
                  {fmt(t('dash.siteMeta'), {
                    p: selectedSite.pages.length,
                    when: timeAgo(selectedSite.lastVisit, t),
                  })}
                </p>
              </div>
              <Button
                size="sm"
                variant={selectedSite.pinned ? 'default' : 'outline'}
                onClick={() => void handleTogglePin(selectedSite)}
                className="shrink-0"
              >
                <Pin className="size-3.5" />
                {selectedSite.pinned ? t('dash.pinned') : t('dash.pinAction')}
              </Button>
            </div>

            <div className="space-y-2">
              {uniquePages(selectedSite.pages).map((page) => {
                return (
                  <div key={page.id} className="min-w-0 rounded-lg border p-2">
                    <div className="min-w-0">
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noreferrer"
                        title={page.url}
                        className="block min-w-0 truncate text-sm hover:underline"
                      >
                        {page.title || page.url}
                      </a>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {fmt(t('dash.visits'), { n: page.visit_count })}, {expiryText(page)}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Select
                        value={page.reason ?? 'none'}
                        onValueChange={(value) =>
                          handleSetReason(page, value === 'none' ? null : value)
                        }
                      >
                      <SelectTrigger size="sm" className="min-w-0 max-w-full flex-1 sm:w-32 sm:flex-none">
                          <SelectValue placeholder={t('dash.why')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('dash.none')}</SelectItem>
                          {REASON_ORDER.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {t(`reason.${reason}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="ml-auto flex shrink-0 gap-1">
                        <Button
                          size="icon-sm"
                          variant="outline"
                          onClick={() => handleVisit(page)}
                          title={t('dash.visitAction')}
                          aria-label={t('dash.visitAction')}
                          className="max-sm:size-9"
                        >
                          <Clock className="size-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleDelete(page)}
                          title={t('dash.deleteAction')}
                          aria-label={t('dash.deleteAction')}
                          className="max-sm:size-9"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Modal>
        )}

      <AlertDialog open={confirmDeleteAccount} onOpenChange={setConfirmDeleteAccount}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dash.deleteAccountConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('dash.deleteAccountConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dash.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmDeleteAccount(false)
                void deleteMyAccount()
              }}
            >
              {t('dash.deleteAccountAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(pageToDelete)}
        onOpenChange={(open) => {
          if (!open) setPageToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dash.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {fmt(t('dash.deleteDesc'), { t: pageToDelete?.title || pageToDelete?.url || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dash.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pageToDelete) void confirmDelete(pageToDelete)
              }}
            >
              {t('dash.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(projectToDelete)}
        onOpenChange={(open) => {
          if (!open) setProjectToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dash.deleteProjectTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {fmt(t('dash.deleteProjectDesc'), {
                p: groupName(projectToDelete) ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dash.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmDeleteProject()}>
              {t('dash.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        <Modal open={showAddPage} title={t('dash.addPage')} onClose={() => setShowAddPage(false)}>
          <form onSubmit={handleAddPage} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="url">{t('dash.addr')}</Label>
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
              <Label htmlFor="title">{t('dash.titleOptional')}</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex. Documentation React"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kind">{t('dash.type')}</Label>
              <Select value={kind} onValueChange={(value) => setKind(value as PageKind)}>
                <SelectTrigger id="kind" className="w-full">
                  <SelectValue placeholder={t('kind.normal')} />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_KINDS.map((pageKind) => (
                    <SelectItem key={pageKind} value={pageKind}>
                      {t(`kind.${pageKind}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="group">{t('dash.project')}</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger id="group" className="w-full">
                  <SelectValue placeholder={t('dash.noProject')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_GROUP}>{t('dash.noProject')}</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {t('dash.add')}
            </Button>
          </form>
        </Modal>

        <Modal open={showAddProject} title={t('dash.newProject')} onClose={() => setShowAddProject(false)}>
          <form onSubmit={handleAddGroup} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-group">{t('dash.projectName')}</Label>
              <Input
                id="new-group"
                value={newGroup}
                onChange={(event) => setNewGroup(event.target.value)}
                placeholder={t('dash.newProjectPlaceholder')}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy || !newGroup.trim()}>
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {t('dash.create')}
            </Button>
          </form>
        </Modal>

        <Modal open={showSettings} title={t('dash.settings')} onClose={() => setShowSettings(false)}>
          <div className="space-y-8">
            <p className="-mt-1 text-sm leading-relaxed text-foreground/70">
              {t('dash.settingsIntro')}
            </p>

            <section className="space-y-3">
              <h3 className="text-xs font-medium text-foreground/60">
                {t('dash.settingsPrefs')}
              </h3>
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-sm font-medium">{t('dash.appearance')}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">{t('dash.appearanceDesc')}</p>
              </div>
              <div
                className="flex w-full shrink-0 rounded-full border border-border bg-background p-1 sm:w-auto"
                role="group"
                aria-label={t('dash.appearance')}
              >
                {(['light', 'dark', 'system'] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={(event) => setTheme(code, { x: event.clientX, y: event.clientY })}
                    aria-pressed={theme === code}
                    className={cn(
                      'h-8 flex-1 rounded-full px-3 text-xs font-medium transition-colors sm:flex-none',
                      theme === code
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {code === 'light'
                      ? t('dash.themeLight')
                      : code === 'dark'
                        ? t('dash.themeDark')
                        : t('dash.themeSystem')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-sm font-medium">{t('dash.lang')}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">{t('dash.langDesc')}</p>
              </div>
              <div
                className="flex w-full shrink-0 rounded-full border border-border bg-background p-1 sm:w-auto"
                role="group"
                aria-label={t('dash.lang')}
              >
                {(['fr', 'en', 'es', 'zh'] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    aria-pressed={lang === code}
                    className={cn(
                      'h-8 flex-1 rounded-full px-3 text-xs font-medium transition-colors sm:flex-none',
                      lang === code
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {code === 'fr' ? 'FR' : code === 'en' ? 'EN' : code === 'es' ? 'ES' : '中文'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-sm font-medium">{t('dash.capture')}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">{t('dash.captureDesc')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={captureEnabled}
                aria-label={t('dash.capture')}
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
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-medium text-foreground/60">
                {t('dash.settingsData')}
              </h3>

            <div className="rounded-2xl border border-border bg-card p-4 text-sm sm:p-5">
              <p className="font-medium">{t('dash.extensionBlock')}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                {extensionStatus === 'linked'
                  ? captureEnabled
                    ? t('dash.extLinkedOn')
                    : t('dash.extLinkedOff')
                  : extensionStatus === 'no-account'
                    ? t('dash.extNoAccount')
                    : extensionStatus === 'other-account'
                      ? t('dash.extOtherAccount')
                      : t('dash.extAbsent')}
              </p>
              <a
                href="/extension"
                className="mt-2 inline-block text-xs underline-offset-2 hover:text-foreground hover:underline"
              >
                {t('dash.seeInstall')}
              </a>
            </div>

            {user?.email?.toLowerCase() === 'salimababulgu@gmail.com' && (
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                <p className="text-sm font-medium">Administration</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                  Statistiques agrégées de la plateforme, réservées à l'éditeur.
                </p>
                <a
                  href="/admin"
                  className="mt-2 inline-block text-xs underline-offset-2 hover:text-foreground hover:underline"
                >
                  Ouvrir la console d'administration
                </a>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <p className="text-sm font-medium">{t('dash.exportTitle')}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/70">{t('dash.exportDesc')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportJson}
                  disabled={pages.length === 0}
                >
                  {t('dash.exportJson')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleCopyLinks()}
                  disabled={pages.length === 0}
                >
                  {t('dash.exportCopy')}
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {fmt(t('dash.exportCount'), { n: pages.length })}
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-sm font-medium">{t('pocket.title')}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">{t('pocket.desc')}</p>
              </div>
              <label className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-full border border-border px-4 text-xs font-medium hover:bg-accent">
                <input
                  type="file"
                  accept=".html,.htm,text/html"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void handlePocketImport(file)
                    event.target.value = ''
                  }}
                />
                {t('pocket.button')}
              </label>
            </div>
            {pocketProgress && (
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {t('pocket.title')}
                  </span>
                  <span className="tabular-nums text-foreground/70">
                    {fmt(t('dash.pocketImporting'), {
                      done: pocketProgress.done,
                      total: pocketProgress.total,
                    })}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={pocketProgress.total}
                  aria-valuenow={pocketProgress.done}
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary"
                >
                  <div
                    className="h-full rounded-full bg-lime transition-[width] duration-300"
                    style={{
                      width: `${pocketProgress.total === 0 ? 0 : Math.round((pocketProgress.done / pocketProgress.total) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-sm font-medium">{t('dash.browserAlerts')}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                  {t('dash.browserAlertsDesc')}
                </p>
              </div>
              <Button
                size="sm"
                variant={browserNotifications === 'granted' ? 'default' : 'outline'}
                onClick={() => void enableBrowserNotifications()}
                disabled={
                  browserNotifications === 'denied' || browserNotifications === 'unsupported'
                }
              >
                {browserNotifications === 'granted'
                  ? t('dash.browserAlertsOn')
                  : browserNotifications === 'denied'
                    ? t('dash.browserAlertsBlocked')
                    : browserNotifications === 'unsupported'
                      ? t('dash.browserAlertsNone')
                      : t('dash.browserAlertsEnable')}
              </Button>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-sm font-medium">{t('dash.autoCloseTitle')}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">{t('dash.autoCloseDesc')}</p>
              </div>
              <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                {t('dash.autoCloseWhere')}
              </span>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-sm font-medium">{t('feedback.title')}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">{t('feedback.settingsHint')}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowFeedback(true)}>
                {t('feedback.open')}
              </Button>
            </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-medium text-foreground/60">
                {t('dash.settingsAccount')}
              </h3>

            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-sm font-medium">{t('dash.logout')}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                  {t('dash.logoutDesc')}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void signOut()}
                className="shrink-0"
              >
                <LogOut className="size-3.5" aria-hidden="true" />
                {t('dash.logout')}
              </Button>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-destructive/40 bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-sm font-medium text-destructive">{t('dash.deleteAccount')}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                  {t('dash.deleteAccountDesc')}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={() => setConfirmDeleteAccount(true)}
              >
                {t('dash.deleteAccountAction')}
              </Button>
            </div>

            </section>
          </div>
        </Modal>

        <Modal open={showOnboarding}
          title={t('dash.onboarding.title')}
          onClose={() => {
            hideOnboarding()
            setShowOnboarding(false)
          }}
        >
          <p className="-mt-1 text-sm text-foreground/70">
            {fmt(t('dash.onboarding.progress'), {
              done: onboardingSteps.filter((step) => step.done).length,
              total: onboardingSteps.length,
            })}
          </p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-lime transition-[width] duration-300"
              style={{
                width: `${Math.round((onboardingSteps.filter((step) => step.done).length / onboardingSteps.length) * 100)}%`,
              }}
            />
          </div>

          <ol className="mt-6 space-y-5">
            {onboardingSteps.map((step) => (
              <li key={step.labelKey} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full',
                    step.done
                      ? 'bg-lime text-lime-foreground'
                      : 'border border-border text-transparent',
                  )}
                >
                  <Check className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm font-medium', step.done && 'text-foreground/60')}>
                    {t(step.labelKey)}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                    {t(step.detailKey)}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            {onboardingNext?.labelKey === 'dash.onboarding.s1.label' ? (
              <a
                href="/extension"
                className="inline-flex h-10 items-center rounded-full bg-lime px-4 text-sm font-semibold text-lime-foreground"
              >
                {t('dash.onboarding.cta.install')}
              </a>
            ) : onboardingNext?.labelKey === 'dash.onboarding.s2.label' ? (
              <Button
                className="bg-lime text-lime-foreground hover:bg-lime/90"
                onClick={() => {
                  setShowOnboarding(false)
                  setShowAddPage(true)
                }}
              >
                {t('dash.onboarding.cta.add')}
              </Button>
            ) : (
              <Button
                className="bg-lime text-lime-foreground hover:bg-lime/90"
                onClick={() => {
                  setShowOnboarding(false)
                  setView('today')
                  setSelectedGroup(null)
                }}
              >
                {t('dash.onboarding.cta.today')}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                hideOnboarding()
                setShowOnboarding(false)
              }}
            >
              {t('dash.onboarding.later')}
            </Button>
          </div>
        </Modal>

      {pocketProgress && !showSettings && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 bottom-20 z-40 flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 text-xs shadow-none md:bottom-6"
        >
          <Loader2 className="size-4 animate-spin text-lime" aria-hidden="true" />
          <span className="tabular-nums">
            {fmt(t('dash.pocketImporting'), {
              done: pocketProgress.done,
              total: pocketProgress.total,
            })}
          </span>
        </div>
      )}

      {deletingAccount && (
        <div
          role="status"
          aria-live="assertive"
          className="fixed inset-0 z-[80] grid place-items-center bg-background/80"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm">
            <Loader2 className="size-5 animate-spin text-lime" aria-hidden="true" />
            {t('dash.deletingAccount')}
          </div>
        </div>
      )}

        <Modal open={showFeedback} title={t('feedback.title')} onClose={() => setShowFeedback(false)}>
          <FeedbackPanel onDone={() => setShowFeedback(false)} />
        </Modal>

      {dragPos && draggingSite && (
        <div
          className="pointer-events-none fixed z-[60] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium"
          style={{ left: dragPos.x, top: dragPos.y }}
        >
          {draggingSite.domain}
        </div>
      )}

      <Toasts
        toasts={toasts}
        onDismiss={(id) =>
          setToasts((current) => current.filter((toast) => toast.id !== id))
        }
      />

      <MobileTabBar
        view={view}
        onSelect={(next) => {
          setView(next)
          setSelectedGroup(null)
        }}
        onOpenMenu={() => setMobileMenuOpen(true)}
        editMode={editMode}
        onMoveToView={(next) => moveSelectionToView(next)}
      />

      <MobileMenu
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        nav={nestNavProps}
        email={user?.email}
        onOpenSettings={() => {
          setMobileMenuOpen(false)
          setShowSettings(true)
        }}
      />
    </div>
  )
}
