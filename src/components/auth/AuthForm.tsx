import { useState } from 'react'
import type { FormEvent } from 'react'
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

export function AuthForm({
  onBack,
  initialEmail = '',
}: {
  onBack?: () => void
  initialEmail?: string
}) {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>(initialEmail ? 'signup' : 'login')
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    const result =
      mode === 'login' ? await signIn(email, password) : await signUp(email, password)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.needsConfirmation) {
      setInfo('Compte créé. Confirme ton adresse par e-mail, puis connecte-toi.')
      setMode('login')
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setInfo(null)
  }

  async function handleReset() {
    if (!email.trim()) {
      setError("Saisis ton e-mail d'abord.")
      return
    }
    setBusy(true)
    setError(null)
    const result = await resetPassword(email.trim())
    setBusy(false)
    if (result.error) {
      setError(result.error)
    } else {
      setInfo('Un e-mail de réinitialisation a été envoyé (vérifie tes spams).')
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
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">TabNest</CardTitle>
          <CardDescription>Gardez vos pages, ne perdez plus rien.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
