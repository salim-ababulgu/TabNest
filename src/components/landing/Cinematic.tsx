import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Sparkles } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

type Tone = 'dark' | 'light' | 'paper'

type WindowItem = { title: string; tone: Tone }

const WINDOWS: WindowItem[] = [
  { title: 'Netflix', tone: 'dark' },
  { title: '2020 Product Strategy', tone: 'dark' },
  { title: 'Write a note…', tone: 'paper' },
  { title: 'Search Tags…', tone: 'dark' },
  { title: 'Figma Receipt', tone: 'dark' },
  { title: 'Browser C…', tone: 'light' },
  { title: 'YouTube', tone: 'dark' },
  { title: 'Gmail', tone: 'light' },
]

const TONES: Record<
  Tone,
  { card: string; bar: string; line: string; title: string; border: string }
> = {
  dark: {
    card: 'bg-[#2c3d33]',
    bar: 'border-white/15 bg-white/[0.05]',
    line: 'bg-white/20',
    title: 'text-cream/70',
    border: 'border-white/15',
  },
  light: {
    card: 'bg-[#f4efe1]',
    bar: 'border-black/10 bg-black/[0.04]',
    line: 'bg-black/15',
    title: 'text-ink/60',
    border: 'border-black/10',
  },
  paper: {
    card: 'bg-[#efe8d5]',
    bar: 'border-black/10 bg-black/[0.04]',
    line: 'bg-black/15',
    title: 'text-ink/60',
    border: 'border-black/10',
  },
}

// Éventail du départ : en bas de l'écran.
const FAN = [
  { x: -0.44, y: 0.36, rotate: -9 },
  { x: -0.31, y: 0.41, rotate: -6 },
  { x: -0.17, y: 0.37, rotate: -3 },
  { x: -0.05, y: 0.43, rotate: 0 },
  { x: 0.07, y: 0.37, rotate: 2 },
  { x: 0.19, y: 0.42, rotate: 4 },
  { x: 0.31, y: 0.37, rotate: 6 },
  { x: 0.44, y: 0.41, rotate: 8 },
]

// Convergence : les fenêtres se réunissent autour de la carte centrale.
const CONVERGE = [
  { x: -168, y: 26, rotate: -7 },
  { x: -120, y: -44, rotate: -4 },
  { x: -62, y: 60, rotate: -2 },
  { x: -15, y: -66, rotate: 0 },
  { x: 38, y: 64, rotate: 2 },
  { x: 96, y: -48, rotate: 4 },
  { x: 148, y: 36, rotate: 6 },
  { x: 196, y: -24, rotate: 8 },
]

function WindowCard({ title, tone }: { title: string; tone: Tone }) {
  const t = TONES[tone]
  return (
    <div className={`overflow-hidden rounded-xl border shadow-2xl ${t.card} ${t.border}`}>
      <div className={`flex items-center gap-1.5 border-b px-3 py-2 ${t.bar}`}>
        <span className="size-2 rounded-full bg-[#ff5f57]" />
        <span className="size-2 rounded-full bg-[#febc2e]" />
        <span className="size-2 rounded-full bg-[#28c840]" />
        <span className={`ml-2 truncate text-[10px] ${t.title}`}>{title}</span>
      </div>
      <div className="space-y-1.5 p-3">
        <div className={`h-1.5 w-3/4 rounded ${t.line}`} />
        <div className={`h-1.5 w-1/2 rounded ${t.line}`} />
        <div className={`h-1.5 w-2/3 rounded ${t.line}`} />
        <div className={`h-1.5 w-2/5 rounded ${t.line}`} />
      </div>
    </div>
  )
}

const SIDEBAR = [
  ["Aujourd'hui", 6],
  ['À finir', 3],
  ['Pistes', 4],
  ['À retenir', 8],
] as const

const STORIES = [
  { letter: 'N', gradient: 'from-[#dfe7c8] to-[#b9d48a]' },
  { letter: 'F', gradient: 'from-[#f3e2c7] to-[#e0b98a]' },
  { letter: 'G', gradient: 'from-[#d9ebf2] to-[#a9cfe0]' },
  { letter: 'Fr', gradient: 'from-[#e6e1f5] to-[#c3b8e8]' },
  { letter: 'Y', gradient: 'from-[#f5dcd6] to-[#e8b0a4]' },
]

const CARDS = [
  { name: 'Netflix', meta: 'À retenir · 90 j', gradient: 'from-[#dfe7c8] to-[#b9d48a]' },
  { name: 'figma.com', meta: '3 pages, 9 visites', gradient: 'from-[#d9ebf2] to-[#a9cfe0]' },
  { name: 'google.com', meta: 'Piste · 14 j', gradient: 'from-[#f3e2c7] to-[#e0b98a]' },
]

/** Aperçu fidèle du tableau de bord (allégé), utilisé en fin de cinématique. */
function DashboardPreview() {
  return (
    <div className="cine-preview absolute top-[56%] left-1/2 z-40 w-[92vw] max-w-[720px] -translate-x-1/2 -translate-y-1/2 opacity-0">
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-cream text-ink shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-1.5 border-b border-black/10 bg-[#eee7d6] px-4 py-2.5">
          <span className="size-2 rounded-full bg-[#ff5f57]" />
          <span className="size-2 rounded-full bg-[#febc2e]" />
          <span className="size-2 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-[10px] text-ink/45">tabnest.app</span>
        </div>

        <div className="flex">
          <aside className="hidden w-40 shrink-0 flex-col bg-[#1f2c25] p-3.5 text-cream sm:flex">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-md bg-lime text-lime-foreground">
                <Sparkles className="size-3.5" />
              </span>
              <span className="font-heading text-sm">TabNest</span>
            </div>
            <div className="mt-4 space-y-0.5">
              {SIDEBAR.map(([label, count], index) => (
                <div
                  key={label}
                  className={`flex items-center justify-between rounded-md px-2 py-1.5 text-[11px] ${
                    index === 0 ? 'bg-white/10 text-cream' : 'text-cream/70'
                  }`}
                >
                  <span>{label}</span>
                  <span className="text-cream/40">{count}</span>
                </div>
              ))}
            </div>
          </aside>

          <div className="flex-1 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="font-heading text-base">Tous les retours</p>
              <span className="text-[10px] text-ink/40">12 sites</span>
            </div>

            <div className="mt-3 flex gap-2">
              {STORIES.map((story) => (
                <span
                  key={story.letter}
                  className={`grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br font-heading text-sm text-ink/55 ${story.gradient}`}
                >
                  {story.letter}
                </span>
              ))}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {CARDS.map((card) => (
                <div
                  key={card.name}
                  className="overflow-hidden rounded-lg border border-black/10 bg-[#fcf9f0]"
                >
                  <div className={`h-14 bg-gradient-to-br ${card.gradient}`} />
                  <div className="p-2">
                    <p className="truncate font-heading text-[11px]">{card.name}</p>
                    <p className="text-[9px] text-ink/45">{card.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Cinematic({ onStart }: { onStart: () => void }) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(wrapper, { height: '100vh' })
      gsap.set('.cine-window, .cine-center, .cine-preview', { opacity: 0 })
      return
    }

    const context = gsap.context(() => {
      const windows = gsap.utils.toArray<HTMLElement>('.cine-window')
      const vw = window.innerWidth
      const vh = window.innerHeight
      const scale = Math.min(1, vw / 1200)

      gsap.set(windows, {
        xPercent: -50,
        yPercent: -50,
        x: (index: number) => FAN[index].x * vw,
        y: (index: number) => FAN[index].y * vh,
        rotate: (index: number) => FAN[index].rotate,
      })
      gsap.set('.cine-center', { xPercent: -50, yPercent: -50 })
      gsap.set('.cine-preview', { scale: 0.94, y: 18 })

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
        },
      })

      timeline
        // 1. le titre s'efface, la petite carte reste
        .to('.cine-hero', { opacity: 0, y: -30, duration: 0.26, ease: 'power1.in' }, 0.02)
        // 2. les fenêtres se réunissent autour de la carte (positionnée à 78 %)
        .to(
          windows,
          {
            x: (index: number) => CONVERGE[index].x * scale,
            y: (index: number) => CONVERGE[index].y * scale + vh * 0.28,
            rotate: 0,
            duration: 0.5,
            stagger: 0.022,
            ease: 'power2.inOut',
          },
          0.22,
        )
        // 3. la carte accuse réception puis laisse place à l'aperçu
        .to('.cine-center', { scale: 1.06, duration: 0.1, ease: 'power2.out' }, 0.76)
        .to('.cine-center', { opacity: 0, scale: 0.92, duration: 0.14, ease: 'power2.in' }, 0.84)
        .to(
          windows,
          { scale: 0.5, opacity: 0, duration: 0.14, stagger: 0.01, ease: 'power2.in' },
          0.8,
        )
        // 4. l'aperçu du dashboard se déploie
        .to('.cine-preview', { opacity: 1, scale: 1, y: 0, duration: 0.16, ease: 'power2.out' }, 0.86)
    }, wrapper)

    return () => context.revert()
  }, [])

  return (
    <div ref={wrapperRef} className="relative h-[300vh] bg-ink">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_62%,rgba(232,161,60,0.18),transparent_46%)]"
        />

        {/* fenêtres qui convergent */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {WINDOWS.map((item) => (
            <div
              key={item.title}
              className="cine-window absolute top-1/2 left-1/2 w-[168px] sm:w-[205px]"
            >
              <WindowCard title={item.title} tone={item.tone} />
            </div>
          ))}
        </div>

        {/* petite carte centrale, autour de laquelle tout se réunit */}
        <div className="cine-center absolute top-[78%] left-1/2 z-30 flex w-[240px] -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-2xl border border-black/10 bg-cream p-3.5 text-ink shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]">
          <span className="flex size-8 items-center justify-center rounded-lg bg-lime text-lime-foreground">
            <Sparkles className="size-4" />
          </span>
          <span className="font-heading text-sm font-semibold">TabNest</span>
          <span className="ml-auto text-[10px] text-ink/45">rangé</span>
        </div>

        {/* aperçu final */}
        <DashboardPreview />

        {/* texte du hero */}
        <div className="cine-hero absolute inset-x-0 top-[12%] z-20 mx-auto w-full max-w-6xl px-6 text-left text-cream">
          <h1 className="max-w-3xl font-heading text-4xl leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
            <span className="cine-line block">TabNest garde les pages</span>
            <span className="cine-line block">que vous visitez.</span>
            <span className="cine-line block text-[#96a08e] italic">
              Vous fermez vos onglets. Rien n'est perdu.
            </span>
          </h1>
          <p className="cine-sub mt-6 max-w-xl text-sm leading-relaxed text-cream/60">
            Une extension qui enregistre automatiquement vos pages, les range par projets et leur
            donne une durée de vie. Fini les 50 onglets ouverts par peur de perdre le fil.
          </p>
          <div className="cine-cta mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-lime px-6 text-sm font-semibold text-lime-foreground transition-colors hover:bg-lime/90"
            >
              Commencer gratuitement
            </button>
            <a
              href="#comment"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-6 text-sm font-medium text-cream/85 transition-colors hover:border-white/40 hover:text-cream"
            >
              Comment ça marche
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
