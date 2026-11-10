import { Suspense, lazy, useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { AuthProvider, useAuth } from '@/lib/auth'
import { PrivacyNotice } from '@/components/legal/PrivacyNotice'
import { useLangValue } from '@/components/landing/i18n'
import { applySeo } from '@/lib/seo'

const AuthForm = lazy(() =>
  import('@/components/auth/AuthForm').then((module) => ({ default: module.AuthForm })),
)
const Dashboard = lazy(() =>
  import('@/components/dashboard/Dashboard').then((module) => ({ default: module.Dashboard })),
)
const Landing = lazy(() =>
  import('@/components/landing/Landing').then((module) => ({ default: module.Landing })),
)
const LegalPage = lazy(() =>
  import('@/components/legal/LegalPage').then((module) => ({ default: module.LegalPage })),
)
const ExtensionPage = lazy(() =>
  import('@/components/extension/ExtensionPage').then((module) => ({
    default: module.ExtensionPage,
  })),
)
const AdminPage = lazy(() =>
  import('@/components/admin/AdminPage').then((module) => ({ default: module.AdminPage })),
)

type LegalSlug =
  | 'confidentialite'
  | 'cgu'
  | 'cookies'
  | 'remboursement'
  | 'mentions-legales'

const LEGAL_ROUTES: Record<string, LegalSlug> = {
  '/confidentialite': 'confidentialite',
  '/cgu': 'cgu',
  '/cookies': 'cookies',
  '/remboursement': 'remboursement',
  '/mentions-legales': 'mentions-legales',
}

function usePathname() {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const handlePop = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  return pathname
}

/** Chargement d'une nouvelle page : fine barre en haut, pas de splash plein écran. */
function RouteLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div
        role="progressbar"
        aria-label="Chargement de la page"
        className="fixed inset-x-0 top-0 z-[70] h-0.5 overflow-hidden"
      >
        <div className="route-bar h-full w-1/3 bg-lime" />
      </div>
    </div>
  )
}

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <span className="flex size-9 animate-pulse items-center justify-center rounded-lg bg-lime text-lime-foreground">
        <Sparkles className="size-4" />
      </span>
    </div>
  )
}

function AppContent() {
  const { loading, user } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const pathname = usePathname()
  const legalSlug = LEGAL_ROUTES[pathname]
  const { lang } = useLangValue()

  // Titre, description, adresse canonique et langue du document, à chaque
  // changement de page ou de langue.
  useEffect(() => {
    applySeo(pathname, lang)
  }, [pathname, lang])

  if (pathname === '/extension') {
    return (
      <Suspense fallback={<RouteLoading />}>
        <ExtensionPage />
      </Suspense>
    )
  }

  if (pathname === '/admin') {
    return (
      <Suspense fallback={<RouteLoading />}>
        <AdminPage />
      </Suspense>
    )
  }

  if (legalSlug) {
    return (
      <Suspense fallback={<RouteLoading />}>
        <LegalPage slug={legalSlug} />
      </Suspense>
    )
  }

  if (loading) {
    return <Splash />
  }

  if (user) {
    return (
      <Suspense fallback={<RouteLoading />}>
        <Dashboard />
      </Suspense>
    )
  }

  if (showAuth) {
    return (
      <Suspense fallback={<RouteLoading />}>
        <AuthForm
          initialEmail={authEmail}
          defaultMode="signup"
          onBack={() => setShowAuth(false)}
        />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<RouteLoading />}>
      <Landing
        onStart={(email) => {
          setAuthEmail(email ?? '')
          setShowAuth(true)
        }}
      />
    </Suspense>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <PrivacyNotice />
    </AuthProvider>
  )
}

export default App
