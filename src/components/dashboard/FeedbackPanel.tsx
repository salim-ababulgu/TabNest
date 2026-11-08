import { useState } from 'react'
import { Copy, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLangValue } from '@/components/landing/i18n'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

type Category = 'bug' | 'idea' | 'unhappy' | 'other'

const CATEGORIES: { id: Category; key: string }[] = [
  { id: 'bug', key: 'feedback.cat.bug' },
  { id: 'idea', key: 'feedback.cat.idea' },
  { id: 'unhappy', key: 'feedback.cat.unhappy' },
  { id: 'other', key: 'feedback.cat.other' },
]

const MAX_LENGTH = 2000

/**
 * Formulaire de retour : rien n'est stocké sur nos serveurs, le message part
 * par le logiciel de messagerie de l'utilisateur (mailto). Il est accessible
 * depuis les paramètres et le pied de page du tableau de bord.
 */
export function FeedbackPanel({ onDone }: { onDone?: () => void }) {
  const { t } = useLangValue()
  const { user } = useAuth()
  const [category, setCategory] = useState<Category>('idea')
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState(user?.email ?? '')
  const [copied, setCopied] = useState(false)

  const diagnostics = [
    `${t('feedback.diag.page')} : ${window.location.pathname}`,
    `${t('feedback.diag.browser')} : ${navigator.userAgent}`,
    `${t('feedback.diag.lang')} : ${document.documentElement.lang || 'fr'}`,
  ].join('\n')

  function buildBody(): string {
    return [
      `${t('feedback.category')} : ${t(`feedback.cat.${category}`)}`,
      '',
      message.trim(),
      '',
      contact.trim() ? `${t('feedback.contact')} : ${contact.trim()}` : '',
      '',
      '---',
      diagnostics,
    ]
      .filter((line) => line !== null)
      .join('\n')
  }

  function send() {
    const subject = `[Filnest] ${t(`feedback.cat.${category}`)}`
    const body = buildBody()
    window.location.href = `mailto:salimababulgu@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    onDone?.()
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(buildBody())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('feedback.intro')}</p>

      <div className="space-y-1.5">
        <Label>{t('feedback.category')}</Label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              aria-pressed={category === item.id}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                category === item.id
                  ? 'border-lime bg-lime text-lime-foreground'
                  : 'border-border text-foreground/70 hover:border-foreground/30',
              )}
            >
              {t(item.key)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="feedback-message">{t('feedback.message')}</Label>
        <textarea
          id="feedback-message"
          value={message}
          maxLength={MAX_LENGTH}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t('feedback.placeholder')}
          rows={5}
          className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <p className="text-right text-[11px] text-muted-foreground">
          {message.length}/{MAX_LENGTH}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="feedback-contact">{t('feedback.contact')}</Label>
        <Input
          id="feedback-contact"
          type="email"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          placeholder="toi@exemple.com"
        />
        <p className="text-[11px] text-muted-foreground">{t('feedback.contactHint')}</p>
      </div>

      <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-[11px] leading-relaxed whitespace-pre-line text-muted-foreground">
        {diagnostics}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={send} disabled={!message.trim()}>
          <Send className="size-4" aria-hidden="true" />
          {t('feedback.send')}
        </Button>
        <Button variant="outline" onClick={() => void copy()}>
          <Copy className="size-4" aria-hidden="true" />
          {copied ? t('feedback.copied') : t('feedback.copy')}
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">{t('feedback.privacy')}</p>
    </div>
  )
}
