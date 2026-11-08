import { useEffect, useRef, useState } from 'react'
import { ChevronsLeftRight } from 'lucide-react'
import { useLang } from '@/components/landing/i18n'

type Tab = { name: string; color: string }

/** Les onglets que tout le monde laisse ouverts, avec la couleur de leur site. */
const TABS: Tab[] = [
  { name: 'Le Monde', color: '#2b4a7a' },
  { name: 'GitHub', color: '#24292f' },
  { name: 'Notion', color: '#37352f' },
  { name: 'Gmail', color: '#ea4335' },
  { name: 'YouTube', color: '#ff0000' },
  { name: 'Figma', color: '#a259ff' },
  { name: 'MDN', color: '#1b1b1b' },
  { name: 'Booking', color: '#003580' },
  { name: 'Airbnb', color: '#ff5a5f' },
  { name: 'LinkedIn', color: '#0a66c2' },
  { name: 'Reddit', color: '#ff4500' },
  { name: 'Netflix', color: '#e50914' },
  { name: 'Amazon', color: '#ff9900' },
  { name: 'Google Docs', color: '#4285f4' },
  { name: 'Trello', color: '#0079bf' },
  { name: 'Slack', color: '#611f69' },
  { name: 'Wikipédia', color: '#636466' },
  { name: 'leboncoin', color: '#ff6e14' },
  { name: 'BlaBlaCar', color: '#00aff0' },
  { name: 'Stack Overflow', color: '#f48024' },
  { name: 'Vinted', color: '#007782' },
  { name: 'Doctolib', color: '#107aca' },
  { name: 'Pinterest', color: '#e60023' },
  { name: 'Twitch', color: '#9146ff' },
  { name: 'Deezer', color: '#a238ff' },
  { name: 'Spotify', color: '#1db954' },
  { name: 'Drive', color: '#0f9d58' },
  { name: 'Finary', color: '#2f6bff' },
]

// 176 onglets : le mur dépasse volontairement du cadre.
const WALL = Array.from({ length: 176 }, (_, index) => {
  const offset = Math.floor(index / 8) * 5
  return TABS[(index * 11 + offset) % TABS.length]
})

const CYCLE = 12000
const MAX = 100
const MIN = 0

const ease = (value: number) => value * value * (3 - 2 * value)

/** Position du séparateur au fil du cycle : repos sur l'avant, glisse vers l'après, repos, retour. */
function splitFor(time: number): number {
  if (time < 0.1) return MAX
  if (time < 0.42) return MAX - (MAX - MIN) * ease((time - 0.1) / 0.32)
  if (time < 0.58) return MIN
  if (time < 0.9) return MIN + (MAX - MIN) * ease((time - 0.58) / 0.32)
  return MAX
}

/**
 * Comparaison avant / après : le mur d'onglets ouverts, puis la même navigation
 * rangée dans Filnest. Le séparateur glisse tout seul ; la souris le met en pause,
 * le clavier et la poignée permettent de le déplacer à la main.
 */
export function BeforeAfter() {
  const { t } = useLang()
  const panelRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      panel.style.setProperty('--split', '50%')
      return
    }
    // Dès que la personne déplace la poignée elle-même, l'animation s'arrête.
    if (!auto) return

    let frame = 0
    let last = performance.now()
    let clock = 0

    const tick = (now: number) => {
      const delta = now - last
      last = now
      if (!pausedRef.current) clock += delta
      panel.style.setProperty('--split', `${splitFor((clock % CYCLE) / CYCLE)}%`)
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [auto])

  function moveTo(value: number) {
    setAuto(false)
    panelRef.current?.style.setProperty('--split', `${value}%`)
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-1 text-xs text-field-muted">
        <span>{t('compare.before')}</span>
        <span>{t('compare.after')}</span>
      </div>

      <div
        ref={panelRef}
        className="before-after relative aspect-[16/10] w-full overflow-hidden rounded-[1.5rem] bg-[#26332b] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-[#e8a13c]"
        onPointerEnter={() => {
          pausedRef.current = true
        }}
        onPointerLeave={() => {
          pausedRef.current = false
        }}
      >
        {/* Après : la même navigation, rangée (toujours entière sous le mur) */}
        <img
          src="/screenshots/dashboard-pages.png"
          alt={t('compare.alt')}
          width={1024}
          height={604}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />

        {/* Avant : le mur d'onglets, découpé par le séparateur */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#26332b]"
          style={{ clipPath: 'inset(0 calc(100% - var(--split, 100%)) 0 0)' }}
        >
          <div className="grid h-full w-full grid-cols-4 content-start gap-1.5 p-3 sm:grid-cols-6 sm:gap-2 sm:p-4 lg:grid-cols-8 lg:p-5">
            {WALL.map((tab, index) => (
              <div
                key={`${tab.name}-${index}`}
                className="flex h-7 min-w-0 items-center gap-1.5 rounded-md bg-white/[0.07] px-2 text-[10px] text-[#f6f1e4]/70 sm:h-8 sm:text-[11px]"
              >
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tab.color }}
                />
                <span className="truncate">{tab.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Poignée : la ligne suit le séparateur, le bouton reste dans le cadre. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-[#e8a13c]"
          style={{ left: 'var(--split, 100%)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#e8a13c] text-[#241a08]"
          style={{ left: 'clamp(22px, var(--split, 100%), calc(100% - 22px))' }}
        >
          <ChevronsLeftRight className="size-4" aria-hidden="true" />
        </div>

        {/* Contrôle clavier et tactile (invisible, au-dessus de la comparaison). */}
        <input
          type="range"
          min={0}
          max={100}
          defaultValue={MAX}
          step={1}
          aria-label={t('compare.label')}
          onChange={(event) => moveTo(Number(event.target.value))}
          className="absolute inset-0 h-full w-full cursor-ew-resize touch-pan-y opacity-0"
        />
      </div>
    </div>
  )
}
