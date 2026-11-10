import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { AsciiSkeleton } from 'ascii-reveal'

const ADMIN_EMAIL = 'salimababulgu@gmail.com'

type Stats = {
  usersTotal: number
  usersLast7d: number
  pagesTotal: number
  pagesLast7d: number
  pagesLast24h: number
  pagesExpired: number
  groupsTotal: number
  sitesTotal: number
  sitesLast7d: number
}

type RecentUser = { email: string; created_at: string }

function Card({
  label,
  value,
  sub,
  loading = false,
}: {
  label: string
  value: string
  sub?: string
  loading?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {loading ? (
        <AsciiSkeleton variant="dither" rows={1} width={96} className="mt-2 block" />
      ) : (
        <p className="mt-2 font-heading text-3xl font-medium">{value}</p>
      )}
      {sub && !loading && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function AdminPage() {
  const { user, signOut } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<RecentUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, usersRes] = await Promise.all([
        supabase.rpc('admin_stats'),
        supabase.rpc('admin_recent_users'),
      ])
      if (statsRes.error) throw statsRes.error
      if (usersRes.error) throw usersRes.error
      setStats(statsRes.data as Stats)
      setRecent((usersRes.data ?? []) as RecentUser[])
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Erreur inconnue',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) void load()
  }, [isAdmin, load])

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour accéder à cette page.
        </p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">
          Accès réservé à l'administrateur. Connecté en tant que {user.email}.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <p className="flex items-center gap-2 font-heading text-lg font-semibold">
            <ShieldCheck className="size-5 text-lime" aria-hidden="true" />
            Console d'administration
          </p>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
              Retour à l'application
            </a>
            <Button size="sm" variant="outline" onClick={() => void signOut()}>
              Se déconnecter
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Statistiques agrégées, visibles uniquement pour {ADMIN_EMAIL}.
          </p>
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={loading ? 'size-3.5 animate-spin' : 'size-3.5'} />
            Rafraîchir
          </Button>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-medium">Impossible de charger les statistiques.</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2 text-xs">
              Si l'erreur indique une fonction introuvable : la migration{' '}
              <code className="rounded bg-secondary px-1 py-0.5">supabase/migrations/20261107000000_admin_stats.sql</code>{' '}
              n'est pas encore appliquée. Exécute-la dans le SQL Editor de Supabase (ou via{' '}
              <code className="rounded bg-secondary px-1 py-0.5">supabase db push</code>), puis
              rafraîchis.
            </p>
          </div>
        )}

        {!error && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card loading={loading && !stats}
              label="Utilisateurs"
              value={stats ? String(stats.usersTotal) : '…'}
              sub={stats ? `+${stats.usersLast7d} sur 7 jours` : undefined}
            />
            <Card loading={loading && !stats}
              label="Pages gardées"
              value={stats ? String(stats.pagesTotal) : '…'}
              sub={stats ? `+${stats.pagesLast24h} en 24 h` : undefined}
            />
            <Card loading={loading && !stats}
              label="Pages sur 7 jours"
              value={stats ? String(stats.pagesLast7d) : '…'}
            />
            <Card loading={loading && !stats}
              label="Sites (domaines)"
              value={stats ? String(stats.sitesTotal ?? 0) : '…'}
              sub={stats ? `+${stats.sitesLast7d ?? 0} sur 7 jours` : undefined}
            />
            <Card loading={loading && !stats}
              label="Projets"
              value={stats ? String(stats.groupsTotal) : '…'}
              sub={stats ? `${stats.pagesExpired} pages expirées en attente` : undefined}
            />
          </div>
        )}

        {recent.length > 0 && (
          <section className="mt-10">
            <h2 className="font-heading text-lg font-medium">Derniers comptes créés</h2>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th scope="col" className="px-4 py-2.5 font-medium">E-mail</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Créé le</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => (
                    <tr key={row.email + row.created_at} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5">{row.email}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {new Date(row.created_at).toLocaleString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
