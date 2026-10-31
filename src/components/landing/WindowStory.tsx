import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { Sparkles } from 'lucide-react'

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

const HERO_POSITIONS = [
  { left: '-3%', bottom: '4%', rotate: -8 },
  { left: '10%', bottom: '18%', rotate: -5 },
  { left: '23%', bottom: '2%', rotate: -2 },
  { left: '36%', bottom: '14%', rotate: 1 },
  { left: '49%', bottom: '0%', rotate: 2 },
  { left: '62%', bottom: '16%', rotate: 4 },
  { left: '75%', bottom: '4%', rotate: 6 },
  { left: '87%', bottom: '20%', rotate: 8 },
]

export function HeroWindows() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const cards = element.querySelectorAll('.hero-window-card')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const context = gsap.context(() => {
      gsap.from(cards, {
        y: 140,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: 'power3.out',
      })
      cards.forEach((card, index) => {
        gsap.to(card, {
          y: -8,
          duration: 2.6 + index * 0.25,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 1.2 + index * 0.12,
        })
      })
    }, ref)

    return () => context.revert()
  }, [])

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] overflow-hidden"
    >
      {WINDOWS.map((item, index) => {
        const position = HERO_POSITIONS[index]
        return (
          <div
            key={item.title}
            className="absolute w-[180px] sm:w-[220px]"
            style={{
              left: position.left,
              bottom: position.bottom,
              transform: `rotate(${position.rotate}deg)`,
            }}
          >
            <div className="hero-window-card">
              <WindowCard title={item.title} tone={item.tone} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

const SCATTER = [
  { x: -250, y: 60, rotate: -8 },
  { x: -170, y: -110, rotate: -5 },
  { x: -80, y: 110, rotate: -3 },
  { x: -20, y: -50, rotate: 0 },
  { x: 70, y: 90, rotate: 3 },
  { x: 150, y: -100, rotate: 5 },
  { x: 230, y: 40, rotate: 7 },
  { x: 300, y: -20, rotate: 9 },
]

export function OrganizeStage() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const windows = element.querySelectorAll('.story-window')
    const page = element.querySelector('.story-page')
    const logo = element.querySelector('.story-logo')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    gsap.set(windows, { xPercent: -50, yPercent: -50, y: -720, opacity: 0, x: 0, rotate: 0 })
    gsap.set(page, { xPercent: -50, yPercent: -50, opacity: 0, scale: 0.9 })
    gsap.set(logo, { xPercent: -50, yPercent: -50, opacity: 0.3, scale: 0.85 })

    if (reduce) {
      gsap.set(windows, { opacity: 0 })
      gsap.set(page, { opacity: 1, scale: 1 })
      return
    }

    const scale = Math.min(1, window.innerWidth / 1100)
    const timeline = gsap.timeline({ paused: true })
    timeline
      .to(windows, {
        y: (index: number) => SCATTER[index].y * scale,
        x: (index: number) => SCATTER[index].x * scale,
        rotate: (index: number) => SCATTER[index].rotate,
        opacity: 1,
        duration: 0.8,
        stagger: 0.06,
        ease: 'power3.out',
      })
      .to(logo, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' })
      .to(
        windows,
        {
          x: 0,
          y: 0,
          rotate: 0,
          scale: 0.16,
          opacity: 0,
          duration: 0.9,
          stagger: 0.04,
          ease: 'power2.inOut',
        },
        '+=0.1',
      )
      .to(page, { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.4)' }, '-=0.3')

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          timeline.play()
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(element)

    return () => {
      observer.disconnect()
      timeline.kill()
    }
  }, [])

  return (
    <div ref={ref} className="relative mx-auto mt-6 h-[420px] w-full max-w-4xl sm:h-[480px]">
      <div className="story-logo absolute top-1/2 left-1/2 z-10 flex size-16 items-center justify-center rounded-2xl bg-lime text-lime-foreground shadow-[0_0_60px_rgba(200,240,90,0.35)]">
        <Sparkles className="size-7" />
      </div>

      {WINDOWS.map((item) => (
        <div
          key={item.title}
          className="story-window absolute top-1/2 left-1/2 w-[170px] sm:w-[210px]"
        >
          <WindowCard title={item.title} tone={item.tone} />
        </div>
      ))}

      <div className="story-page absolute top-1/2 left-1/2 z-20 w-[280px] rounded-2xl border border-white/10 bg-[#1b1b1b] p-4 shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-lime text-lime-foreground">
            <Sparkles className="size-4" />
          </span>
          <span className="font-heading text-sm text-cream">TabNest</span>
          <span className="ml-auto text-[10px] text-cream/40">rangé</span>
        </div>
        <div className="mt-3 space-y-2">
          {['Netflix', 'Figma', 'Google', 'Framer'].map((name) => (
            <div
              key={name}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5"
            >
              <span className="size-5 rounded bg-white/10" />
              <span className="text-xs text-cream/70">{name}</span>
              <span className="ml-auto text-[10px] text-lime">gardé</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
