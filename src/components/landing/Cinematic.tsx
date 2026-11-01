import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, Sparkles } from 'lucide-react'

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
    card: 'bg-[#1b1b1b]',
    bar: 'border-white/10 bg-white/[0.03]',
    line: 'bg-white/10',
    title: 'text-white/45',
    border: 'border-white/10',
  },
  light: {
    card: 'bg-[#f4f1e8]',
    bar: 'border-black/10 bg-black/[0.03]',
    line: 'bg-black/10',
    title: 'text-ink/45',
    border: 'border-black/10',
  },
  paper: {
    card: 'bg-[#efe9dc]',
    bar: 'border-black/10 bg-black/[0.03]',
    line: 'bg-black/10',
    title: 'text-ink/45',
    border: 'border-black/10',
  },
}

const FAN = [
  { x: -0.46, y: 0.36, rotate: -8 },
  { x: -0.33, y: 0.42, rotate: -6 },
  { x: -0.19, y: 0.38, rotate: -3 },
  { x: -0.06, y: 0.44, rotate: 0 },
  { x: 0.07, y: 0.38, rotate: 2 },
  { x: 0.2, y: 0.44, rotate: 4 },
  { x: 0.33, y: 0.38, rotate: 6 },
  { x: 0.46, y: 0.42, rotate: 8 },
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

export function Cinematic({ onStart }: { onStart: () => void }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const stage = stageRef.current
    if (!wrapper || !stage) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const context = gsap.context(() => {
      const windows = gsap.utils.toArray<HTMLElement>('.cine-window')
      const vw = window.innerWidth
      const vh = window.innerHeight

      gsap.set(windows, {
        xPercent: -50,
        yPercent: -50,
        x: (index: number) => FAN[index].x * vw,
        y: (index: number) => FAN[index].y * vh,
        rotate: (index: number) => FAN[index].rotate,
      })
      gsap.set('.cine-logo', { opacity: 0, scale: 0.7 })
      gsap.set('.cine-page', { opacity: 0, scale: 0.9 })

      gsap.from('.cine-line', {
        y: 90,
        opacity: 0,
        duration: 1.1,
        stagger: 0.14,
        ease: 'power4.out',
        delay: 0.25,
      })
      gsap.from('.cine-eyebrow', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.05,
      })
      gsap.from('.cine-sub', {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.55,
      })
      gsap.from('.cine-cta', {
        y: 24,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.75,
      })

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      })

      timeline
        .to('.cine-hero', { opacity: 0, y: -40, duration: 0.3 }, 0.05)
        .to(
          windows,
          {
            x: 0,
            y: 0,
            rotate: 0,
            duration: 0.5,
            stagger: 0.02,
            ease: 'power2.inOut',
          },
          0.25,
        )
        .to('.cine-logo', { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(1.6)' }, 0.55)
        .to(
          windows,
          {
            scale: 0.12,
            opacity: 0,
            duration: 0.25,
            stagger: 0.01,
            ease: 'power2.in',
          },
          0.72,
        )
        .to('.cine-page', { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(1.4)' }, 0.82)
    }, wrapper)

    return () => context.revert()
  }, [])

  return (
    <div ref={wrapperRef} className="relative h-[280vh] bg-ink">
      <div
        ref={stageRef}
        className="sticky top-0 flex h-screen items-center justify-center overflow-hidden"
      >
        {/* fenêtres */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {WINDOWS.map((item) => (
            <div
              key={item.title}
              className="cine-window absolute top-1/2 left-1/2 w-[170px] sm:w-[210px]"
            >
              <WindowCard title={item.title} tone={item.tone} />
            </div>
          ))}
        </div>

        {/* logo */}
        <div className="cine-logo absolute top-1/2 left-1/2 z-30 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-lime text-lime-foreground shadow-[0_0_80px_rgba(200,240,90,0.35)]">
          <Sparkles className="size-9" />
        </div>

        {/* page finale */}
        <div className="cine-page absolute top-1/2 left-1/2 z-40 w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#1b1b1b] p-5 shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-lime text-lime-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="font-heading text-sm text-cream">TabNest</span>
            <span className="ml-auto text-[10px] text-cream/40">rangé</span>
          </div>
          <div className="mt-4 space-y-2">
            {['Netflix', 'Figma', 'Google', 'Framer'].map((name) => (
              <div
                key={name}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2"
              >
                <span className="size-5 rounded bg-white/10" />
                <span className="text-xs text-cream/70">{name}</span>
                <span className="ml-auto text-[10px] text-lime">gardé</span>
              </div>
            ))}
          </div>
        </div>

        {/* texte du hero */}
        <div className="cine-hero relative z-20 mx-auto w-full max-w-3xl px-6 text-center text-cream">
          <p className="cine-eyebrow text-[11px] font-medium tracking-[0.3em] text-lime uppercase">
            Votre mémoire de navigation
          </p>
          <h1 className="mt-6 font-heading text-4xl leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
            <span className="cine-line block">TabNest garde les pages</span>
            <span className="cine-line block">que vous visitez.</span>
            <span className="cine-line block text-[#8f9484] italic">
              Vous fermez vos onglets. Rien n'est perdu.
            </span>
          </h1>
          <p className="cine-sub mx-auto mt-6 max-w-xl text-sm leading-relaxed text-cream/55">
            Une extension qui enregistre automatiquement vos pages, les range par projets et leur
            donne une durée de vie. Fini les 50 onglets ouverts par peur de perdre le fil.
          </p>
          <div className="cine-cta mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-lime px-6 text-sm font-semibold text-lime-foreground transition-colors hover:bg-lime/90"
            >
              Commencer gratuitement <ArrowRight className="size-4" />
            </button>
            <a
              href="#comment"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-6 text-sm font-medium text-cream/80 transition-colors hover:border-white/30 hover:text-cream"
            >
              Comment ça marche
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
