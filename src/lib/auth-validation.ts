// Validation de l'écran d'authentification, isolée du rendu.
// Chaque règle est une fonction pure : facile à tester et à réutiliser.

export const EMAIL_RE =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i

export type PasswordChecks = {
  length: boolean
  upper: boolean
  digit: boolean
  symbol: boolean
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

export function passwordChecks(value: string): PasswordChecks {
  return {
    length: value.length >= 8,
    upper: /[A-Z]/.test(value),
    digit: /\d/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value),
  }
}

export function isStrongPassword(value: string): boolean {
  return Object.values(passwordChecks(value)).every(Boolean)
}

/** Niveau de solidité, de 0 à 4 (nombre de règles satisfaites). */
export function passwordScore(value: string): number {
  return Object.values(passwordChecks(value)).filter(Boolean).length
}

/** Le mot de passe suffit-il pour le mode courant ? */
export function isPasswordAcceptable(value: string, mode: 'login' | 'signup'): boolean {
  return mode === 'login' ? value.length >= 6 : isStrongPassword(value)
}
