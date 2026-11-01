import { Suspense, lazy, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { AuthProvider, useAuth } from '@/lib/auth'

const AuthForm = lazy(() =>
  import('@/components/auth/AuthForm').then((module) => ({ default: module.AuthForm })),
)
const Dashboard = lazy(() =>
  import('@/components/dashboard/Dashboard').then((module) => ({ default: module.Dashboard })),
)
const Landing = lazy(() =>
  import('@/components/landing/Landing').then((module) => ({ default: module.Landing })),
)

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
        <AuthForm initialEmail={authEmail} onBack={() => setShowAuth(false)} />
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
    </AuthProvider>
  )
}

export default App
