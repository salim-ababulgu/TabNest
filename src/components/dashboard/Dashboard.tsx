import { useCallback, useEffect, useState } from 'react'
import type { ComponentType, FormEvent } from 'react'
import {
  Archive,
  BookOpen,
  Clock,
  LayoutGrid,
  LogOut,
  Plus,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import {
  archivePage,
  createGroup,
  createPage,
  fetchGroups,
  fetchPages,
  toggleInteresting,
  visitPage,
} from '@/lib/pages'
import type { Group, Page } from '@/lib/pages'

type View = 'today' | 'all' | 'resources' | 'ephemeral' | 'archives'

const VIEWS: { id: View; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'today', label: "Aujourd'hui", icon: Clock },
  { id: 'all', label: 'Tous les retours', icon: LayoutGrid },
  { id: 'resources', label: 'Ressources', icon: BookOpen },
  { id: 'ephemeral', label: 'Outils récurrents', icon: Zap },
  { id: 'archives', label: 'Archives', icon: Archive },
]

const VIEW_TITLES: Record<View, string> = {
  today: "À décider aujourd'hui",
  all: 'Tous les retours',
  resources: 'Ressources',
  ephemeral: 'Outils récurrents',
  archives: 'Archives',
}

const NO_GROUP = 'none'
const DUE_SOON_MS = 48 * 60 * 60 * 1000

function isExpired(page: Page): boolean {
  if (!page.expires_at) return false
  return new Date(page.expires_at).getTime() < Date.now()
}

function isDueSoon(page: Page): boolean {
  if (!page.expires_at) return false
  return new Date(page.expires_at).getTime() - Date.now() <= DUE_SOON_MS
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function formatToday(): string {
  const text = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
  return text.charAt(0).toUpperCase() + text.slice(1)
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

  const [view, setView] = useState<View>('today')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextGroups, nextPages] = await Promise.all([fetchGroups(), fetchPages()])
      setGroups(nextGroups)
      setPages(nextPages)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

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
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur lors de la création du projet')
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleInteresting(page: Page) {
    setError(null)
    try {
      await toggleInteresting(page.id, !page.is_interesting)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur')
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

  function groupName(id: string | null): string | null {
    if (!id) return null
    return groups.find((group) => group.id === id)?.name ?? null
  }

  function countFor(id: View): number {
    if (id === 'all') return pages.length
    if (id === 'resources') return pages.filter((page) => page.kind === 'documentation').length
    if (id === 'ephemeral') return pages.filter((page) => page.kind === 'ephemeral').length
    if (id === 'archives') return pages.filter(isExpired).length
    return pages.filter((page) => !isExpired(page) && isDueSoon(page)).length
  }

  const visiblePages = pages.filter((page) => {
    if (selectedGroup) return page.group_id === selectedGroup
    if (view === 'all') return true
    if (view === 'resources') return page.kind === 'documentation'
    if (view === 'ephemeral') return page.kind === 'ephemeral'
    if (view === 'archives') return isExpired(page)
    return !isExpired(page) && isDueSoon(page)
  })

  const currentTitle = selectedGroup ? groupName(selectedGroup) ?? 'Projet' : VIEW_TITLES[view]

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
            onClick={() => setSelectedGroup(null)}
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground"
            aria-label="Tous les projets"
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

        <div className="mt-auto border-t border-sidebar-border px-5 py-4">
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
            <Button variant="outline" size="sm" onClick={() => signOut()} className="md:hidden">
              Se déconnecter
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
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

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading text-2xl font-medium tracking-tight">{currentTitle}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {visiblePages.length} page(s)
                    {view === 'today' && !selectedGroup ? ' à traiter sous 48 h' : ''}
                  </p>
                </div>
                {selectedGroup && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedGroup(null)}>
                    Tout voir
                  </Button>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Chargement…</p>
                ) : visiblePages.length === 0 ? (
                  <div className="rounded-xl border border-dashed bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
                    Aucune page ici pour l'instant.
                  </div>
                ) : (
                  visiblePages.map((page) => {
                    const expiry = describeExpiry(page.expires_at)
                    const domain = domainOf(page.url)
                    return (
                      <article
                        key={page.id}
                        className="flex items-start gap-3 rounded-xl border bg-card p-4"
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary font-heading text-lg font-semibold uppercase">
                          {domain.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate">{domain}</span>
                            <Badge variant="outline">
                              {KIND_LABELS[page.kind as PageKind] ?? page.kind}
                            </Badge>
                            {groupName(page.group_id) && (
                              <Badge variant="secondary">{groupName(page.group_id)}</Badge>
                            )}
                          </div>
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block truncate font-heading text-lg leading-snug hover:underline"
                          >
                            {page.title || page.url}
                          </a>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>{page.visit_count} visite(s)</span>
                            <span className={expiry.expired ? 'font-medium text-destructive' : ''}>
                              {expiry.text}
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => handleVisit(page)}>
                            J'ai visité
                          </Button>
                          <div className="flex gap-1">
                            <Button
                              size="icon-sm"
                              variant={page.is_interesting ? 'default' : 'outline'}
                              onClick={() => handleToggleInteresting(page)}
                              title="Marquer intéressante"
                            >
                              <Sparkles className="size-3.5" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleDelete(page)}
                              title="Supprimer (archiver)"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </article>
                    )
                  })
                )}
              </div>
            </section>

            <aside className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ajouter une page</CardTitle>
                  <CardDescription>Colle l'adresse d'une page à garder.</CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Créer un projet</CardTitle>
                  <CardDescription>Ex. emploi, achat de voiture.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddGroup} className="flex gap-2">
                    <Input
                      value={newGroup}
                      onChange={(event) => setNewGroup(event.target.value)}
                      placeholder="Nom du projet"
                    />
                    <Button type="submit" variant="secondary" disabled={busy || !newGroup.trim()}>
                      Créer
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}
