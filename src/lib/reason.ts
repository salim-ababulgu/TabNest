export type Reason = 'decide' | 'finish' | 'explore' | 'remember'

export const REASON_LABELS: Record<Reason, string> = {
  decide: 'À décider',
  finish: 'À finir',
  explore: 'Piste',
  remember: 'À retenir',
}

export const REASON_DESCRIPTIONS: Record<Reason, string> = {
  decide: "Je n'arrive pas à décider.",
  finish: "Je n'ai pas terminé.",
  explore: 'Je ne veux pas perdre cette possibilité.',
  remember: 'Je ne veux pas oublier que ça existe.',
}

export const REASON_ORDER: Reason[] = ['decide', 'finish', 'explore', 'remember']

export const REASON_HOURS: Record<Reason, number> = {
  decide: 24 * 3,
  finish: 24 * 7,
  explore: 24 * 14,
  remember: 24 * 90,
}

export function isReason(value: string | null | undefined): value is Reason {
  return value === 'decide' || value === 'finish' || value === 'explore' || value === 'remember'
}
