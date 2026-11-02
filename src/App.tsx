import { Suspense, lazy, useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { AuthProvider, useAuth } from '@/lib/auth'
import { CookieNotice } from '@/components/legal/CookieNotice'

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

type LegalSlug = 'confidentialite' | 'cgu' | 'cookies' | 'remboursement'

const LEGAL_ROUTES: Record<string, LegalSlug> = {
  '/confidentialite': 'confidentialite',
  '/cgu': 'cgu',
  '/cookies': 'cookies',
  '/remboursement': 'remboursement',
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

  if (legalSlug) {
    return (
      <Suspense fallback={<Splash />}>
        <LegalPage slug={legalSlug} />
      </Suspense>
    )
  }

  if (loading) {
    return <Splash />
  }

  if (user) {
    return (
      <Suspense fallback={<Splash />}>
        <Dashboard />
      </Suspense>
    )
  }

  if (showAuth) {
    return (
      <Suspense fallback={<Splash />}>
        <AuthForm
          initialEmail={authEmail}
          defaultMode="signup"
          onBack={() => setShowAuth(false)}
        />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<Splash />}>
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
      <CookieNotice />
    </AuthProvider>
  )
}

export default App
