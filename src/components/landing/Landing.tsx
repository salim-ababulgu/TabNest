import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import gsap from 'gsap'
import { ArrowRight, Check, Clock, Sparkles } from 'lucide-react'
import { Cinematic } from '@/components/landing/Cinematic'

type LandingProps = { onStart: (email?: string) => void }

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    gsap.set(element, { y: 42, opacity: 0 })
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          gsap.to(element, {
            y: 0,
            opacity: 1,
            duration: 0.9,
            delay: delay / 1000,
            ease: 'power3.out',
          })
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

function PillButton({
  children,
  onClick,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors ' +
        (className ?? '')
      }
    >
      {children}
    </button>
  )
}

const PROJECTS = [
  { n: '01', name: "Recherche d'emploi", count: '12 pages', color: 'bg-[#dbe3ff]' },
  { n: '02', name: 'Achat de voiture', count: '8 pages', color: 'bg-[#ffe0cf]' },
  { n: '03', name: 'Apprendre React', count: '21 pages', color: 'bg-[#d9f2c4]' },
]

export function Landing({ onStart }: LandingProps) {
  const [email, setEmail] = useState('')

  return (
    <div id="top" className="relative bg-cream text-ink">
      <header className="fixed top-0 right-0 left-0 z-40 px-4 pt-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border border-white/10 bg-ink/90 px-4 py-2.5 backdrop-blur">
          <a href="#top" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-lime text-lime-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="font-heading text-lg font-semibold text-cream">TabNest</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-cream/60 md:flex">
            <a href="#principe" className="transition-colors hover:text-cream">
              Le principe
            </a>
            <a href="#automatisation" className="transition-colors hover:text-cream">
              L'automatisation
            </a>
            <a href="#projets" className="transition-colors hover:text-cream">
              Les projets
            </a>
          </nav>
          <PillButton onClick={() => onStart()} className="bg-lime text-lime-foreground hover:bg-lime/90">
            Essayer <ArrowRight className="size-3.5" />
          </PillButton>
        </div>
      </header>

      <Cinematic onStart={() => onStart()} />

      {/* Comment ça marche */}
      <section id="comment" className="px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto w-full max-w-6xl">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium tracking-[0.25em] text-[#5f6b4f] uppercase">
                Comment ça marche
              </p>
              <h2 className="mt-4 font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
                Trois étapes, et vous ne perdez plus rien.
              </h2>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                n: '01',
                title: "Installez l'extension",
                text: 'Chrome ou Edge. Un dossier, deux clics, et la capture est active.',
              },
              {
                n: '02',
                title: 'Naviguez normalement',
                text: 'Chaque page visitée est enregistrée, sans rien faire.',
              },
              {
                n: '03',
                title: 'Retrouvez tout',
                text: 'Vos pages sont rangées par projets, avec une durée de vie.',
              },
            ].map((step, index) => (
              <Reveal key={step.n} delay={index * 120}>
                <div className="h-full rounded-2xl border bg-card p-7 transition-transform hover:-translate-y-1">
                  <span className="font-heading text-3xl text-[#5f6b4f]">{step.n}</span>
                  <h3 className="mt-4 font-heading text-xl">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={400}>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { t: 'Documentation', g: 'from-[#dfe7c8] to-[#b9d48a]' },
                { t: 'Emploi', g: 'from-[#dbe3ff] to-[#a9cfe0]' },
                { t: 'Achat voiture', g: 'from-[#ffe0cf] to-[#e8b0a4]' },
              ].map((item) => (
                <div key={item.t} className="overflow-hidden rounded-xl border bg-card">
                  <div className={'h-24 bg-gradient-to-br ' + item.g} />
                  <div className="p-4">
                    <p className="font-heading text-sm">{item.t}</p>
                    <p className="text-[11px] text-ink/50">3 pages · Favori</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Le principe */}
      <section id="principe" className="grid md:grid-cols-2">
        <div className="flex items-center bg-cream px-8 py-24 md:px-14 md:py-28">
          <Reveal className="w-full">
            <p className="text-[11px] font-medium tracking-[0.25em] text-[#5f6b4f] uppercase">
              Le point de départ
            </p>
            <h2 className="mt-6 font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
              Vous ne gardez pas des onglets.
              <span className="mt-2 block text-[#5f6b4f] italic">Vous gardez des intentions.</span>
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink/60">
              Lire, comparer, postuler, acheter, apprendre. Fermer une page donne l'impression
              d'abandonner ce que vous vouliez en faire.
            </p>
          </Reveal>
        </div>
        <div className="flex items-center bg-ink px-8 py-24 text-cream md:px-14 md:py-28">
          <Reveal delay={150} className="w-full">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <div className="grid grid-cols-3 gap-3 text-center text-[11px] text-cream/50">
                <div className="rounded-lg border border-white/10 px-2 py-4">Onglets</div>
                <div className="rounded-lg border border-white/10 px-2 py-4">Favoris</div>
                <div className="rounded-lg border border-white/10 px-2 py-4">Historique</div>
              </div>
              <div className="mt-6 rounded-xl bg-lime px-4 py-10 text-center text-lime-foreground">
                <Sparkles className="mx-auto size-7" />
                <p className="mt-3 font-heading text-2xl">Tout est là.</p>
                <p className="mt-1 text-xs opacity-70">
                  Rien ne demande votre attention maintenant.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Dark centered */}
      <section className="flex items-center bg-ink px-6 py-24 text-center text-cream md:py-32">
        <Reveal className="mx-auto max-w-4xl">
          <h2 className="font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-6xl">
            Réunir les pages ne suffit pas.
            <span className="mt-2 block text-[#8f9484] italic">
              Sinon TabNest ne serait qu'un favori de plus.
            </span>
          </h2>
        </Reveal>
      </section>

      {/* L'automatisation */}
      <section id="automatisation" className="grid md:grid-cols-2">
        <div className="flex items-center bg-ink px-8 py-24 text-cream md:px-14 md:py-28">
          <Reveal className="w-full">
            <p className="text-[11px] font-medium tracking-[0.25em] text-lime uppercase">
              Ce qui change tout
            </p>
            <p className="mt-8 text-[11px] tracking-[0.25em] text-cream/40 uppercase">Observer</p>
            <h2 className="mt-4 font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
              TabNest comprend la page.
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-cream/55">
              Une documentation visitée quatre fois n'a pas la même valeur qu'une offre expirée
              ouverte une seule fois.
            </p>
          </Reveal>
        </div>
        <div className="flex items-center bg-ink px-8 py-24 md:px-14 md:py-28">
          <Reveal delay={150} className="w-full">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <div className="flex flex-wrap gap-2 text-[11px] text-cream/60">
                <span className="rounded-full border border-white/10 px-3 py-1">
                  Visites régulières
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1">Documentation</span>
                <span className="rounded-full border border-lime/40 bg-lime/10 px-3 py-1 text-lime">
                  Projet · code
                </span>
              </div>
              <div className="mt-6 rounded-xl bg-cream p-5 text-ink">
                <p className="text-[10px] text-ink/50">developer.mozilla.org</p>
                <p className="mt-1 font-heading text-lg">Using the Web Storage API</p>
                <div className="mt-3 flex gap-4 text-[11px] text-ink/50">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" /> 4 visites
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" /> vue hier
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Les projets */}
      <section id="projets" className="grid md:grid-cols-2">
        <div className="flex items-center bg-cream px-8 py-24 md:px-14 md:py-28">
          <Reveal className="w-full">
            <p className="text-[11px] font-medium tracking-[0.25em] text-[#5f6b4f] uppercase">
              Et le contexte ?
            </p>
            <h2 className="mt-6 font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
              Les pages ne vivent pas seules.
              <span className="mt-2 block text-[#5f6b4f] italic">
                Elles appartiennent à vos projets.
              </span>
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink/60">
              Une offre, un comparatif et une documentation n'ont de sens que reliés à ce que vous
              essayez de faire. TabNest crée ce lien, puis archive le tout quand le projet est
              terminé.
            </p>
          </Reveal>
        </div>
        <div className="flex items-center bg-cream px-8 py-24 md:px-14 md:py-28">
          <Reveal delay={150} className="w-full">
            <div className="space-y-4">
              {PROJECTS.map((project) => (
                <div
                  key={project.n}
                  className={'flex items-center gap-4 rounded-2xl px-5 py-5 transition-transform hover:translate-x-1 ' + project.color}
                >
                  <span className="font-heading text-2xl">{project.n}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] tracking-wider text-ink/40 uppercase">Projet actif</p>
                    <p className="font-heading text-lg">{project.name}</p>
                  </div>
                  <span className="shrink-0 text-xs text-ink/50">{project.count}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Espace de travail */}
      <section className="grid md:grid-cols-2">
        <div className="flex items-center bg-ink px-8 py-24 text-cream md:px-14 md:py-28">
          <Reveal className="w-full">
            <p className="text-[11px] font-medium tracking-[0.25em] text-lime uppercase">
              Après TabNest
            </p>
            <h2 className="mt-6 font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
              Votre navigateur peut enfin redevenir
              <span className="mt-2 block text-[#8f9484] italic">un espace de travail.</span>
            </h2>
            <ul className="mt-8 space-y-3 text-sm text-cream/65">
              <li className="flex items-center gap-2">
                <Check className="size-4 text-lime" /> Les pages importantes restent accessibles.
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 text-lime" /> Les pages temporaires disparaissent
                naturellement.
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 text-lime" /> Vous ne triez que les décisions qui comptent.
              </li>
            </ul>
          </Reveal>
        </div>
        <div className="flex items-center justify-center bg-ink px-8 py-24 md:px-14 md:py-28">
          <Reveal delay={150}>
            <div className="grid size-64 place-items-center rounded-full border border-white/10 sm:size-72">
              <div className="grid size-44 place-items-center rounded-full border border-white/10 sm:size-52">
                <div className="grid size-28 place-items-center rounded-full bg-lime text-center text-lime-foreground sm:size-32">
                  <span>
                    <span className="block font-heading text-3xl">1</span>
                    <span className="block text-[10px] tracking-wider uppercase">onglet ouvert</span>
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA final */}
      <section className="flex items-center bg-lime px-6 py-24 text-center text-lime-foreground md:py-32">
        <div className="mx-auto w-full max-w-3xl">
          <Reveal>
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-ink text-lime">
              <Sparkles className="size-5" />
            </span>
            <p className="mt-6 text-[11px] font-medium tracking-[0.25em] uppercase opacity-70">
              La suite commence ici.
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl font-heading text-4xl leading-[1.02] tracking-tight sm:text-5xl md:text-7xl">
              Fermez tous les autres.
              <span className="mt-2 block text-[#5f6b4f] italic">Gardez TabNest.</span>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                onStart(email)
              }}
              className="mx-auto mt-10 flex max-w-md items-center gap-2 rounded-full bg-cream p-1.5"
            >
              <input
                type="email"
                aria-label="Votre adresse e-mail"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@exemple.fr"
                className="h-10 min-w-0 flex-1 bg-transparent px-4 text-left text-sm text-ink outline-none placeholder:text-ink/40"
              />
              <button
                type="submit"
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-medium text-cream transition-colors hover:bg-ink/90"
              >
                Commencer <ArrowRight className="size-3.5" />
              </button>
            </form>
            <p className="mt-4 text-xs text-ink/50">Gratuit pour commencer. Aucun spam.</p>
          </Reveal>
        </div>
      </section>

      {/* Confidentialité */}
      <section id="confidentialite" className="flex items-center bg-cream px-6 py-24 md:py-32">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-medium tracking-[0.25em] text-[#5f6b4f] uppercase">
            Confidentialité
          </p>
          <h2 className="mt-4 font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
            Vos pages restent les vôtres.
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-ink/60">
            TabNest stocke l'adresse, le titre et l'image publique de vos pages. Pas de capture
            d'écran, pas de contenu privé, pas de revente. Vous supprimez ce que vous voulez, quand
            vous voulez.
          </p>
        </Reveal>
      </section>

      <footer className="bg-cream px-6 py-10 text-ink">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm md:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-lime text-lime-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="font-heading text-lg font-semibold">TabNest</span>
          </div>
          <p className="text-ink/50">Un onglet pour garder le fil.</p>
          <div className="flex gap-5 text-ink/50">
            <a href="#confidentialite" className="hover:text-ink">
              Confidentialité
            </a>
            <a href="mailto:salimababulgu@gmail.com" className="hover:text-ink">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
