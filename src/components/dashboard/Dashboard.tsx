import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'

export function Dashboard() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-semibold">TabNest</h1>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user?.email}
          </span>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            Se déconnecter
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h2 className="text-2xl font-semibold">Bienvenue dans ton nid à onglets</h2>
        <p className="mt-2 text-muted-foreground">
          La prochaine étape : enregistrer tes pages, les organiser en groupes et
          gérer leur durée de vie.
        </p>
      </main>
    </div>
  )
}
