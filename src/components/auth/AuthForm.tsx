import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Eye, EyeOff, Loader2, Lock, Mail, X } from 'lucide-react'
import gsap from 'gsap'
import { trackEvent } from '@/lib/analytics'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { useLangValue } from '@/components/landing/i18n'
import { cn } from '@/lib/utils'
import { AuthShell } from '@/components/auth/AuthShell'
import {
  isPasswordAcceptable,
  isValidEmail,
  passwordChecks,
} from '@/lib/auth-validation'

type Mode = 'login' | 'signup'
type Phase = 'idle' | 'switching' | 'submitting'

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

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
  const { t } = useLangValue()
  const [mode, setMode] = useState<Mode>(initialEmail ? 'signup' : defaultMode)
  const [phase, setPhase] = useState<Phase>('idle')
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const emailRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const rulesRef = useRef<HTMLDivElement>(null)
  const switchTl = useRef<gsap.core.Timeline | null>(null)

  const busy = phase === 'submitting'
  const trimmedEmail = email.trim()
  const emailValid = isValidEmail(trimmedEmail)
  const passwordOk = isPasswordAcceptable(password, mode)
  const canSubmit = emailValid && passwordOk
  const emailError = emailTouched && trimmedEmail.length > 0 && !emailValid
  const checks = passwordChecks(password)
  const score = Object.values(checks).filter(Boolean).length

  const rules = [
    { key: 'auth.rule.length', ok: checks.length },
    { key: 'auth.rule.upper', ok: checks.upper },
    { key: 'auth.rule.digit', ok: checks.digit },
    { key: 'auth.rule.symbol', ok: checks.symbol },
  ]

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  // Entrée en scène de la carte (une seule fois).
  useEffect(() => {
    if (prefersReducedMotion() || !cardRef.current) return
    const context = gsap.context(() => {
      gsap.from('[data-auth-anim]', {
        y: 14,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.05,
      })
    }, cardRef)
    return () => context.revert()
  }, [])

  // Les règles de mot de passe apparaissent en douceur (hauteur animée).
  useEffect(() => {
    const rulesEl = rulesRef.current
    if (!rulesEl) return
    if (mode !== 'signup') return
    if (prefersReducedMotion()) return
    gsap.fromTo(
      rulesEl,
      { height: 0, opacity: 0 },
      { height: 'auto', opacity: 1, duration: 0.24, ease: 'power2.out' },
    )
  }, [mode])

  useEffect(() => {
    return () => {
      switchTl.current?.kill()
    }
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (phase !== 'idle') return
    setError(null)
    setInfo(null)
    if (!emailValid) {
      setEmailTouched(true)
      setError(t('auth.error.email'))
      return
    }
    if (!passwordOk) {
      setPasswordTouched(true)
      setError(mode === 'login' ? t('auth.error.invalid') : t('auth.error.weak'))
      return
    }
    setPhase('submitting')
    try {
      const result =
        mode === 'login'
          ? await signIn(trimmedEmail, password)
          : await signUp(trimmedEmail, password)
      if (result.error) {
        setError(localizeAuthError(result.error))
        shakeCard()
        return
      }
      trackEvent(mode === 'login' ? 'signin' : 'signup')
      if (result.needsConfirmation) {
        setInfo(t('auth.confirmInfo'))
        applyMode('login')
        return
      }
      setPhase('idle')
    } finally {
      // Ne remet pas l'écran au repos pendant qu'une transition de mode joue.
      setPhase((current) => (current === 'switching' ? current : 'idle'))
    }
  }

  /** Change de mode : fondu du bloc titre, bascule, puis retour en douceur. */
  function switchMode(next: Mode) {
    if (next === mode || phase !== 'idle') return
    setError(null)
    setInfo(null)
    setPasswordTouched(false)

    if (prefersReducedMotion() || !titleRef.current) {
      applyMode(next)
      return
    }

    setPhase('switching')
    switchTl.current?.kill()
    const timeline = gsap.timeline({
      onComplete: () => {
        applyMode(next)
      },
    })
    // Les règles de mot de passe se replient avant de disparaître.
    if (rulesRef.current && mode === 'signup' && next === 'login') {
      timeline.to(rulesRef.current, { height: 0, opacity: 0, duration: 0.12, ease: 'power2.inOut' }, 0)
    }
    timeline.to(titleRef.current, {
      autoAlpha: 0,
      y: -6,
      duration: 0.12,
      ease: 'power2.in',
    })
    switchTl.current = timeline
  }

  function applyMode(next: Mode) {
    setMode(next)
    setPasswordTouched(false)
    window.requestAnimationFrame(() => {
      if (!titleRef.current) {
        setPhase('idle')
        return
      }
      if (prefersReducedMotion()) {
        gsap.set(titleRef.current, { autoAlpha: 1, y: 0 })
        setPhase('idle')
        return
      }
      const tween = gsap.fromTo(
        titleRef.current,
        { autoAlpha: 0, y: 8 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.18,
          ease: 'power2.out',
          clearProps: 'opacity,transform,visibility',
          onComplete: () => setPhase('idle'),
        },
      )
      switchTl.current = tween as unknown as gsap.core.Timeline
    })
  }

  function shakeCard() {
    if (!cardRef.current || prefersReducedMotion()) return
    gsap.fromTo(
      cardRef.current,
      { x: 0 },
      { keyframes: { x: [-5, 5, -3, 3, 0] }, duration: 0.35, ease: 'power1.out' },
    )
  }

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

  async function handleGoogle() {
    if (phase !== 'idle') return
    setError(null)
    setInfo(null)
    setPhase('submitting')
    try {
      const result = await signInWithGoogle()
      if (result.error) {
        setError(localizeAuthError(result.error))
        shakeCard()
      } else {
        trackEvent('signin_google')
      }
    } finally {
      setPhase('idle')
    }
  }

  async function handleReset() {
    if (phase !== 'idle') return
    if (!emailValid) {
      setEmailTouched(true)
      setError(t('auth.enterEmail'))
      return
    }
    setPhase('submitting')
    setError(null)
    try {
      const result = await resetPassword(trimmedEmail)
      if (result.error) setError(localizeAuthError(result.error))
      else setInfo(t('auth.resetSent'))
    } finally {
      setPhase('idle')
    }
  }

  const switching = phase === 'switching'

  return (
    <AuthShell>
      <div className="relative">
        <div
          ref={cardRef}
          aria-busy={switching || busy}
          className="relative overflow-hidden rounded-2xl border bg-card p-6 lg:min-h-[27rem] sm:p-7"
        >
          {/* Fines barres de chargement pendant l'envoi */}
          {busy && (
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5">
              <div className="skeleton-shimmer h-full w-full" />
            </div>
          )}

          <div
            ref={titleRef}
            data-auth-anim
            className={cn('transition-opacity', switching && 'pointer-events-none')}
          >
            <h1 className="font-heading text-2xl font-semibold">
              {mode === 'login' ? t('auth.loginTitle') : t('auth.signupTitle')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('auth.subtitle')}</p>
          </div>

          <div data-auth-anim className="mt-5">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogle}
              disabled={busy || switching}
            >
              <GoogleIcon />
              {t('auth.google')}
            </Button>
          </div>

          <div data-auth-anim className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{t('auth.orEmail')}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div
            data-auth-anim
            className="relative grid grid-cols-2 rounded-full border bg-muted p-1"
            role="tablist"
            aria-label={t('auth.subtitle')}
          >
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-card transition-transform duration-200 ease-out',
                mode === 'signup' && 'translate-x-full',
              )}
            />
            {(['login', 'signup'] as const).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={mode === item}
                aria-disabled={switching && mode !== item}
                aria-controls="auth-form"
                id={`auth-tab-${item}`}
                tabIndex={mode === item ? 0 : -1}
                onClick={() => switchMode(item)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                    event.preventDefault()
                    switchMode(item === 'login' ? 'signup' : 'login')
                  }
                }}
                className={cn(
                  'relative z-10 rounded-full px-3 py-1.5 text-sm transition-colors',
                  mode === item ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {t(item === 'login' ? 'auth.login' : 'auth.signup')}
              </button>
            ))}
          </div>

          <form
            id="auth-form"
            role="region"
            aria-labelledby={`auth-tab-${mode}`}
            onSubmit={handleSubmit}
            className="mt-5 space-y-4"
            noValidate
          >
            <div data-auth-anim className="space-y-1.5">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  ref={emailRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder={t('auth.emailPlaceholder')}
                  className={cn(
                    'pr-9 pl-9',
                    emailError && 'border-destructive focus-visible:ring-destructive/40',
                  )}
                  aria-invalid={emailError ? true : undefined}
                  aria-describedby={emailError ? 'auth-email-error' : undefined}
                />
                {emailValid && (
                  <Check
                    className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-lime"
                    aria-hidden="true"
                  />
                )}
              </div>
              {emailError && (
                <p id="auth-email-error" className="text-xs text-destructive">
                  {t('auth.error.email')}
                </p>
              )}
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
                <Lock
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  onKeyUp={(event) => setCapsLock(event.getModifierState('CapsLock'))}
                  placeholder={
                    mode === 'login'
                      ? t('auth.passwordPlaceholderLogin')
                      : t('auth.passwordPlaceholder')
                  }
                  className={cn(
                    'pr-10 pl-9',
                    passwordTouched &&
                      mode === 'signup' &&
                      password.length > 0 &&
                      !passwordOk &&
                      'border-destructive focus-visible:ring-destructive/40',
                  )}
                  aria-describedby={mode === 'signup' ? 'auth-rules' : undefined}
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

              {capsLock && <p className="text-[11px] text-muted-foreground">{t('auth.capsLock')}</p>}

              {mode === 'signup' && (
                <div ref={rulesRef} id="auth-rules" className="space-y-2 pt-1">
                  <div className="flex gap-1" aria-hidden="true">
                    {[0, 1, 2, 3].map((level) => (
                      <span
                        key={level}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-colors',
                          level < score
                            ? score <= 1
                              ? 'bg-destructive'
                              : score <= 2
                                ? 'bg-amber-500'
                                : 'bg-lime'
                            : 'bg-border',
                        )}
                      />
                    ))}
                  </div>
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {rules.map((rule) => (
                      <li
                        key={rule.key}
                        className={cn(
                          'flex items-center gap-1.5 text-[11px]',
                          rule.ok ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {rule.ok ? (
                          <Check className="size-3 text-lime" aria-hidden="true" />
                        ) : (
                          <X className="size-3 text-muted-foreground/60" aria-hidden="true" />
                        )}
                        {t(rule.key)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {error && (
              <p
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
              <Button
                type="submit"
                className="w-full transition-transform hover:-translate-y-px active:translate-y-0"
                disabled={busy || switching || !canSubmit}
              >
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                <span aria-live="polite">
                  {busy
                    ? t('auth.busy')
                    : mode === 'login'
                      ? t('auth.submitLogin')
                      : t('auth.submitSignup')}
                </span>
              </Button>
            </div>
          </form>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="size-3" aria-hidden="true" />
            {t('auth.secure')}
          </p>
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

        {onBack && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              {t('auth.back')}
            </button>
          </div>
        )}
      </div>
    </AuthShell>
  )
}
