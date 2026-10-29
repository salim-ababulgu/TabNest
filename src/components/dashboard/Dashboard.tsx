import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
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
import {
  createGroup,
  createPage,
  fetchGroups,
  fetchPages,
  toggleInteresting,
} from '@/lib/pages'
import type { Group, Page } from '@/lib/pages'

const NO_GROUP = 'none'

export function Dashboard() {
  const { user, signOut } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [groupId, setGroupId] = useState(NO_GROUP)
  const [newGroup, setNewGroup] = useState('')
  const [busy, setBusy] = useState(false)

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
      })
      setUrl('')
      setTitle('')
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
      setError(cause instanceof Error ? cause.message : 'Erreur lors de la création du groupe')
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

  function groupName(id: string | null): string | null {
    if (!id) return null
    return groups.find((group) => group.id === id)?.name ?? null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-semibold">TabNest</h1>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            Se déconnecter
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-6 px-6 py-8">
        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ajouter une page</CardTitle>
              <CardDescription>Colle l'adresse d'une page à garder.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPage} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Adresse (URL)</Label>
                  <Input
                    id="url"
                    type="url"
                    required
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://exemple.com/article"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Titre (facultatif)</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ex. Documentation React"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group">Groupe</Label>
                  <Select value={groupId} onValueChange={setGroupId}>
                    <SelectTrigger id="group" className="w-full">
                      <SelectValue placeholder="Aucun groupe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_GROUP}>Aucun groupe</SelectItem>
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
              <CardTitle>Créer un groupe</CardTitle>
              <CardDescription>Ex. emploi, achat de voiture.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddGroup} className="flex gap-2">
                <Input
                  value={newGroup}
                  onChange={(event) => setNewGroup(event.target.value)}
                  placeholder="Nom du groupe"
                />
                <Button type="submit" variant="secondary" disabled={busy || !newGroup.trim()}>
                  Créer
                </Button>
              </form>
              <div className="flex flex-wrap gap-2">
                {groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun groupe pour l'instant.</p>
                ) : (
                  groups.map((group) => (
                    <Badge key={group.id} variant="secondary">
                      {group.name}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mes pages</CardTitle>
            <CardDescription>{pages.length} page(s) enregistrée(s).</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : pages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune page pour l'instant. Ajoute-en une ci-dessus.
              </p>
            ) : (
              <div className="divide-y">
                {pages.map((page) => (
                  <div key={page.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{page.title || page.url}</p>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-xs text-muted-foreground hover:underline"
                      >
                        {page.url}
                      </a>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {groupName(page.group_id) && (
                        <Badge variant="outline">{groupName(page.group_id)}</Badge>
                      )}
                      <Button
                        type="button"
                        variant={page.is_interesting ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleInteresting(page)}
                      >
                        {page.is_interesting ? 'Intéressante' : 'Marquer intéressante'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
