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

// Éventail statique, en bas de la section (coupé par le bord).
const FAN = [
  { left: '-4%', top: '22px', rotate: -9 },
  { left: '9%', top: '52px', rotate: -6 },
  { left: '22%', top: '16px', rotate: -3 },
  { left: '35%', top: '46px', rotate: 0 },
  { left: '48%', top: '12px', rotate: 2 },
  { left: '61%', top: '50px', rotate: 4 },
  { left: '74%', top: '18px', rotate: 6 },
  { left: '87%', top: '54px', rotate: 8 },
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

/** Hero statique : le texte et les boutons au-dessus, les fenêtres en éventail en bas. */
export function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative flex min-h-screen flex-col bg-ink text-cream">
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pt-28 pb-10">
        <h1 className="max-w-3xl font-heading text-4xl leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
          <span className="block">TabNest garde les pages</span>
          <span className="block">que vous visitez.</span>
          <span className="block text-[#96a08e] italic">
            Vous fermez vos onglets. Rien n'est perdu.
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-cream/60">
          Une extension qui enregistre automatiquement vos pages, les range par projets et leur
          donne une durée de vie. Fini les 50 onglets ouverts par peur de perdre le fil.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-lime px-6 text-sm font-semibold text-lime-foreground transition-colors hover:bg-lime/90"
          >
            Commencer gratuitement
          </button>
          <a
            href="#comment"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-ink/60 px-6 text-sm font-medium text-cream/85 transition-colors hover:border-white/40 hover:text-cream"
          >
            Comment ça marche
          </a>
        </div>
      </div>

      <div aria-hidden="true" className="relative h-[190px] w-full overflow-hidden sm:h-[220px]">
        {WINDOWS.map((item, index) => {
          const position = FAN[index]
          return (
            <div
              key={item.title}
              className="absolute w-[180px] sm:w-[220px]"
              style={{
                left: position.left,
                top: position.top,
                transform: `rotate(${position.rotate}deg)`,
              }}
            >
              <WindowCard title={item.title} tone={item.tone} />
            </div>
          )
        })}
      </div>
    </section>
  )
}
