import { useEffect, useRef } from 'react'
import gsap from 'gsap'

type Tone = 'dark' | 'light' | 'paper'

type FanWindow = {
  title: string
  tone: Tone
  left: string
  top: string
  rotate: number
  z: number
}

const WINDOWS: FanWindow[] = [
  { title: 'Netflix', tone: 'dark', left: '0%', top: '66%', rotate: -9, z: 1 },
  { title: '2020 Product Strategy', tone: 'dark', left: '13%', top: '38%', rotate: -6, z: 2 },
  { title: 'Write a note…', tone: 'paper', left: '27%', top: '20%', rotate: -3, z: 3 },
  { title: 'Search Tags…', tone: 'dark', left: '41%', top: '10%', rotate: 0, z: 5 },
  { title: 'Figma Receipt', tone: 'dark', left: '55%', top: '20%', rotate: 3, z: 4 },
  { title: 'Browser C…', tone: 'light', left: '69%', top: '38%', rotate: 6, z: 3 },
  { title: 'YouTube', tone: 'dark', left: '83%', top: '64%', rotate: 9, z: 2 },
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

export function WindowFan() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const context = gsap.context(() => {
      gsap.set('.fan-card', { y: 70, opacity: 0 })
    }, ref)

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          gsap.to(element.querySelectorAll('.fan-card'), {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.07,
            ease: 'power3.out',
          })
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(element)

    return () => {
      observer.disconnect()
      context.revert()
    }
  }, [])

  return (
    <div
      ref={ref}
      className="relative mx-auto mt-10 h-[330px] w-full overflow-hidden sm:h-[380px]"
    >
      {WINDOWS.map((item) => {
        const tone = TONES[item.tone]
        return (
          <div
            key={item.title}
            className="absolute w-[230px] sm:w-[260px]"
            style={{
              left: item.left,
              top: item.top,
              zIndex: item.z,
              transform: `rotate(${item.rotate}deg)`,
            }}
          >
            <div className={`fan-card overflow-hidden rounded-xl border shadow-2xl ${tone.card} ${tone.border}`}>
              <div className={`flex items-center gap-1.5 border-b px-3 py-2 ${tone.bar}`}>
                <span className="size-2 rounded-full bg-[#ff5f57]" />
                <span className="size-2 rounded-full bg-[#febc2e]" />
                <span className="size-2 rounded-full bg-[#28c840]" />
                <span className={`ml-2 truncate text-[10px] ${tone.title}`}>{item.title}</span>
              </div>
              <div className="space-y-1.5 p-3">
                <div className={`h-1.5 w-3/4 rounded ${tone.line}`} />
                <div className={`h-1.5 w-1/2 rounded ${tone.line}`} />
                <div className={`h-1.5 w-2/3 rounded ${tone.line}`} />
                <div className={`h-1.5 w-2/5 rounded ${tone.line}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
