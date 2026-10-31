import { useState } from 'react'
import { AuthProvider, useAuth } from '@/lib/auth'
import { AuthForm } from '@/components/auth/AuthForm'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { Landing } from '@/components/landing/Landing'

function AppContent() {
  const { loading, user } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [authEmail, setAuthEmail] = useState('')

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Chargement…
      </div>
    )
  }

  if (user) return <Dashboard />
  if (showAuth) return <AuthForm initialEmail={authEmail} onBack={() => setShowAuth(false)} />
  return (
    <Landing
      onStart={(email) => {
        setAuthEmail(email ?? '')
        setShowAuth(true)
      }}
    />
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
