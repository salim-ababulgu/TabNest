import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import gsap from 'gsap'
import { trackEvent } from '@/lib/analytics'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { useLangValue } from '@/components/landing/i18n'

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

function passwordScore(value: string): 0 | 1 | 2 | 3 {
  if (value.length < 6) return 0
  const variety =
    (/[a-z]/.test(value) ? 1 : 0) +
    (/[A-Z]/.test(value) ? 1 : 0) +
    (/\d/.test(value) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(value) ? 1 : 0)
  if (value.length >= 12 && variety >= 3) return 3
  if (value.length >= 8 && variety >= 2) return 2
  return 1
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
  const { t } = useLangValue()
  const [mode, setMode] = useState<Mode>(initialEmail ? 'signup' : defaultMode)
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  /** Traduit les messages techniques de Supabase en phrases simples. */
  function localizeAuthError(message: string): string {
    const lower = message.toLowerCase()
    if (lower.includes('invalid login credentials')) return t('auth.error.invalid')
    if (lower.includes('email not confirmed')) return t('auth.error.unconfirmed')
    if (lower.includes('already registered') || lower.includes('already exists')) {
      return t('auth.error.exists')
    }
    if (lower.includes('password should be at least')) return t('auth.error.weak')
    if (lower.includes('rate limit') || lower.includes('too many')) return t('auth.error.rate')
    if (lower.includes('invalid email') || lower.includes('unable to validate email')) {
      return t('auth.error.email')
    }
    return message
  }

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const context = gsap.context(() => {
      gsap.from('[data-auth-anim]', {
        y: 18,
        opacity: 0,
        duration: 0.45,
        ease: 'power2.out',
        stagger: 0.06,
      })
    }, cardRef)
    return () => context.revert()
  }, [])

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!error) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const card = cardRef.current
    if (!card) return
    gsap.fromTo(
      card,
      { x: 0 },
      { keyframes: { x: [-5, 5, -3, 3, 0] }, duration: 0.35, ease: 'power1.out' },
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
        setError(localizeAuthError(result.error))
        return
      }
      trackEvent(mode === 'login' ? 'signin' : 'signup')
      if (result.needsConfirmation) {
        setInfo(t('auth.confirmInfo'))
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
        setError(localizeAuthError(result.error))
      } else {
        trackEvent('signin_google')
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleReset() {
    if (!email.trim()) {
      setError(t('auth.enterEmail'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await resetPassword(email.trim())
      if (result.error) {
        setError(localizeAuthError(result.error))
      } else {
        setInfo(t('auth.resetSent'))
      }
    } finally {
      setBusy(false)
    }
  }

  const score = passwordScore(password)
  const strengthLabel =
    score === 3 ? t('auth.strength.strong') : score === 2 ? t('auth.strength.ok') : t('auth.strength.weak')

  return (
    <div className="relative min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Panneau de promesse — masqué sur mobile */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink px-10 py-9 text-cream lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-lime text-sm font-semibold text-lime-foreground">
            T
          </span>
          <span className="font-heading text-lg font-semibold">TabNest</span>
        </div>

        <div className="max-w-md">
          <h1 className="font-heading text-3xl leading-tight font-semibold">
            {t('auth.sideTitle')}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-cream/70">{t('auth.sideText')}</p>
          <ul className="mt-8 space-y-3 text-sm text-cream/80">
            {[t('auth.side1'), t('auth.side2'), t('auth.side3')].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-lime" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-cream/45">{t('auth.sideFooter')}</p>
      </aside>

      {/* Formulaire */}
      <main className="flex min-h-screen flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2 lg:hidden">
              <span className="grid size-7 place-items-center rounded-md bg-lime text-xs font-semibold text-lime-foreground">
                T
              </span>
              <span className="font-heading text-base font-semibold">TabNest</span>
            </span>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline lg:ml-auto"
              >
                {t('auth.back')}
              </button>
            )}
          </div>

          <p className="mb-5 font-heading text-xl leading-snug font-medium lg:hidden">
            {t('auth.sideTitle')}
          </p>

          <div ref={cardRef} className="rounded-2xl border bg-card p-6 sm:p-7">
            <div data-auth-anim>
              <h2 className="font-heading text-2xl font-semibold">
                {mode === 'login' ? t('auth.loginTitle') : t('auth.signupTitle')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('auth.subtitle')}</p>
            </div>

            <div data-auth-anim className="mt-5">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogle}
                disabled={busy}
              >
                <GoogleIcon />
                {t('auth.google')}
              </Button>
            </div>

            <div data-auth-anim className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{t('auth.orEmail')}</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div
              data-auth-anim
              role="tablist"
              aria-label={t('auth.subtitle')}
              className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => switchMode('login')}
                className={
                  mode === 'login'
                    ? 'rounded-md bg-card px-3 py-1.5 text-sm font-medium text-foreground'
                    : 'rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
                }
              >
                {t('auth.login')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                onClick={() => switchMode('signup')}
                className={
                  mode === 'signup'
                    ? 'rounded-md bg-card px-3 py-1.5 text-sm font-medium text-foreground'
                    : 'rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
                }
              >
                {t('auth.signup')}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div data-auth-anim className="space-y-1.5">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  ref={emailRef}
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'auth-error' : undefined}
                />
              </div>

              <div data-auth-anim className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {t('auth.forgot')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="pr-10"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? 'auth-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? t('auth.hidePw') : t('auth.showPw')}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {mode === 'signup' && password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1" aria-hidden="true">
                      {[1, 2, 3].map((level) => (
                        <span
                          key={level}
                          className={
                            level <= score
                              ? 'h-1 flex-1 rounded-full bg-lime'
                              : 'h-1 flex-1 rounded-full bg-border'
                          }
                        />
                      ))}
                    </div>
                    <p aria-live="polite" className="text-[11px] text-muted-foreground">
                      {strengthLabel}
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <p
                  id="auth-error"
                  role="alert"
                  aria-live="polite"
                  className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
              {info && (
                <p
                  aria-live="polite"
                  className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground/80"
                >
                  {info}
                </p>
              )}

              <div data-auth-anim>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {busy
                    ? t('auth.busy')
                    : mode === 'login'
                      ? t('auth.submitLogin')
                      : t('auth.submitSignup')}
                </Button>
              </div>
            </form>
          </div>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
            {t('auth.legalPrefix')}{' '}
            <a
              href="/cgu"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {t('auth.terms')}
            </a>{' '}
            {t('auth.legalAnd')}{' '}
            <a
              href="/confidentialite"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {t('auth.privacy')}
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
