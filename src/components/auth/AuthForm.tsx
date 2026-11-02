import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import gsap from 'gsap'
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
import { useAuth } from '@/lib/auth'

type Mode = 'login' | 'signup'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z"
      />
    </svg>
  )
}

export function AuthForm({
  onBack,
  initialEmail = '',
  defaultMode = 'login',
}: {
  onBack?: () => void
  initialEmail?: string
  defaultMode?: Mode
}) {
  const { signIn, signUp, resetPassword, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<Mode>(initialEmail ? 'signup' : defaultMode)
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.from('[data-auth-card]', { y: 24, opacity: 0, duration: 0.6, ease: 'power2.out' })
    })
    return () => context.revert()
  }, [])

  useEffect(() => {
    if (!error) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const card = document.querySelector('[data-auth-card]')
    if (!card) return
    gsap.fromTo(
      card,
      { x: 0 },
      { keyframes: { x: [-6, 6, -4, 4, 0] }, duration: 0.4, ease: 'power1.out' },
    )
  }, [error])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      const result =
        mode === 'login' ? await signIn(email, password) : await signUp(email, password)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.needsConfirmation) {
        setInfo('Compte créé. Confirme ton adresse par e-mail, puis connecte-toi.')
        setMode('login')
      }
    } finally {
      setBusy(false)
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setInfo(null)
  }

  async function handleGoogle() {
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      const result = await signInWithGoogle()
      if (result.error) {
        setError(result.error)
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleReset() {
    if (!email.trim()) {
      setError("Saisis ton e-mail d'abord.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await resetPassword(email.trim())
      if (result.error) {
        setError(result.error)
      } else {
        setInfo('Un e-mail de réinitialisation a été envoyé (vérifie tes spams).')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Retour à l'accueil
        </button>
      )}
      <Card data-auth-card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">TabNest</CardTitle>
          <CardDescription>Gardez vos pages, ne perdez plus rien.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={busy}
          >
            <GoogleIcon />
            Continuer avec Google
          </Button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou avec un e-mail</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === 'login' ? 'default' : 'outline'}
              onClick={() => switchMode('login')}
            >
              Connexion
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === 'signup' ? 'default' : 'outline'}
              onClick={() => switchMode('signup')}
            >
              Inscription
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="toi@exemple.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="6 caractères minimum"
              />
            </div>
            {mode === 'login' && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Mot de passe oublié ?
              </button>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-muted-foreground">{info}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Patientez…' : mode === 'login' ? 'Se connecter' : 'Créer un compte'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
