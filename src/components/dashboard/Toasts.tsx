import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastLevel = 'success' | 'error' | 'info'

export type ToastItem = {
  id: number
  level: ToastLevel
  message: string
}

const STYLES: Record<ToastLevel, { box: string; icon: typeof Info }> = {
  success: { box: 'border-lime/60 bg-card text-foreground', icon: CheckCircle2 },
  error: { box: 'border-destructive/50 bg-destructive/10 text-destructive', icon: AlertTriangle },
  info: { box: 'border-border bg-card text-foreground', icon: Info },
}

export function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => {
        const style = STYLES[toast.level]
        const Icon = style.icon
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-lg',
              style.box,
            )}
          >
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p className="flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Fermer la notification"
              className="rounded p-0.5 opacity-60 hover:opacity-100"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
