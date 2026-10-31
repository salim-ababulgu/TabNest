import type { ReactNode } from 'react'
import { ArrowRight, Check, Clock, Sparkles } from 'lucide-react'

type LandingProps = { onStart: () => void }

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
  return (
    <div id="top" className="min-h-screen bg-cream text-ink">
      <header className="sticky top-0 z-40 px-4 pt-4">
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
          <PillButton onClick={onStart} className="bg-lime text-lime-foreground hover:bg-lime/90">
            Essayer <ArrowRight className="size-3.5" />
          </PillButton>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-ink px-6 pt-16 pb-24 text-cream">
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          <div className="absolute top-[26%] left-[5%] -rotate-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left">
            <p className="text-[10px] text-cream/40">developer.mozilla.org</p>
            <p className="font-heading text-sm">Web Storage API</p>
          </div>
          <div className="absolute top-[20%] right-[5%] rotate-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left">
            <p className="text-[10px] text-cream/40">welcome-to-the-jungle.com</p>
            <p className="font-heading text-sm">Product Designer — Linear</p>
          </div>
          <div className="absolute bottom-[16%] left-[8%] rotate-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left">
            <p className="text-[10px] text-cream/40">citymapper.com</p>
            <p className="font-heading text-sm">Paris — Tokyo</p>
          </div>
          <div className="absolute right-[9%] bottom-[14%] -rotate-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left">
            <p className="text-[10px] text-cream/40">notion.so</p>
            <p className="font-heading text-sm">A guide to habits</p>
          </div>
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-[11px] font-medium tracking-[0.3em] text-lime uppercase">Avant → Après</p>
          <h1 className="mt-6 font-heading text-5xl leading-[0.98] tracking-tight md:text-7xl">
            Vous laissez les pages
            <span className="block">ouvertes</span>
            <span className="block text-[#8f9484] italic">pour ne pas perdre la suite.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-cream/55">
            Puis les onglets s'empilent. Les favoris débordent. L'historique devient introuvable.
            Le problème n'est pas de sauvegarder plus.
          </p>
        </div>

        <div className="relative mt-16 text-center text-[10px] tracking-[0.3em] text-cream/35 uppercase">
          Faire défiler
        </div>
      </section>

      {/* Le principe */}
      <section id="principe" className="grid md:grid-cols-2">
        <div className="bg-cream px-8 py-20 md:px-14">
          <p className="text-[11px] font-medium tracking-[0.25em] text-[#5f6b4f] uppercase">
            Le point de départ
          </p>
          <h2 className="mt-6 font-heading text-5xl leading-[0.98] tracking-tight md:text-6xl">
            Vous ne gardez pas des onglets.
            <span className="mt-2 block text-[#5f6b4f] italic">Vous gardez des intentions.</span>
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink/60">
            Lire, comparer, postuler, acheter, apprendre. Fermer une page donne l'impression
            d'abandonner ce que vous vouliez en faire.
          </p>
        </div>
        <div className="relative bg-ink px-8 py-20 md:px-14">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="grid grid-cols-3 gap-3 text-center text-[11px] text-cream/50">
              <div className="rounded-lg border border-white/10 px-2 py-3">Onglets</div>
              <div className="rounded-lg border border-white/10 px-2 py-3">Favoris</div>
              <div className="rounded-lg border border-white/10 px-2 py-3">Historique</div>
            </div>
            <div className="mt-6 rounded-xl bg-lime px-4 py-8 text-center text-lime-foreground">
              <Sparkles className="mx-auto size-6" />
              <p className="mt-2 font-heading text-2xl">Tout est là.</p>
              <p className="mt-1 text-xs opacity-70">Rien ne demande votre attention maintenant.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dark centered */}
      <section className="bg-ink px-6 py-24 text-center text-cream">
        <h2 className="mx-auto max-w-4xl font-heading text-4xl leading-[1.02] tracking-tight md:text-6xl">
          Réunir les pages ne suffit pas.
          <span className="mt-2 block text-[#8f9484] italic">
            Sinon TabNest ne serait qu'un favori de plus.
          </span>
        </h2>
      </section>

      {/* L'automatisation */}
      <section id="automatisation" className="grid md:grid-cols-2">
        <div className="bg-ink px-8 py-20 text-cream md:px-14">
          <p className="text-[11px] font-medium tracking-[0.25em] text-lime uppercase">
            Ce qui change tout
          </p>
          <p className="mt-8 text-[11px] tracking-[0.25em] text-cream/40 uppercase">01 · Observer</p>
          <h2 className="mt-4 font-heading text-5xl leading-[0.98] tracking-tight md:text-6xl">
            TabNest comprend la page.
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-cream/55">
            Une documentation visitée quatre fois n'a pas la même valeur qu'une offre expirée
            ouverte une seule fois.
          </p>
        </div>
        <div className="relative bg-ink px-8 py-20 md:px-14">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-wrap gap-2 text-[11px] text-cream/60">
              <span className="rounded-full border border-white/10 px-3 py-1">Visites régulières</span>
              <span className="rounded-full border border-white/10 px-3 py-1">Documentation</span>
              <span className="rounded-full border border-lime/40 bg-lime/10 px-3 py-1 text-lime">
                Projet · code
              </span>
            </div>
            <div className="mt-6 rounded-xl bg-cream p-4 text-ink">
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
        </div>
      </section>

      {/* Les projets */}
      <section id="projets" className="grid md:grid-cols-2">
        <div className="bg-cream px-8 py-20 md:px-14">
          <p className="text-[11px] font-medium tracking-[0.25em] text-[#5f6b4f] uppercase">
            Et le contexte ?
          </p>
          <h2 className="mt-6 font-heading text-5xl leading-[0.98] tracking-tight md:text-6xl">
            Les pages ne vivent pas seules.
            <span className="mt-2 block text-[#5f6b4f] italic">
              Elles appartiennent à vos projets.
            </span>
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink/60">
            Une offre, un comparatif et une documentation n'ont de sens que reliés à ce que vous
            essayez de faire. TabNest crée ce lien, puis archive le tout quand le projet est terminé.
          </p>
        </div>
        <div className="relative bg-cream px-8 py-20 md:px-14">
          <div className="space-y-3">
            {PROJECTS.map((project) => (
              <div
                key={project.n}
                className={'flex items-center gap-4 rounded-2xl px-5 py-4 ' + project.color}
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
        </div>
      </section>

      {/* Espace de travail */}
      <section className="grid md:grid-cols-2">
        <div className="bg-ink px-8 py-20 text-cream md:px-14">
          <p className="text-[11px] font-medium tracking-[0.25em] text-lime uppercase">Après TabNest</p>
          <h2 className="mt-6 font-heading text-5xl leading-[0.98] tracking-tight md:text-6xl">
            Votre navigateur peut enfin redevenir
            <span className="mt-2 block text-[#8f9484] italic">un espace de travail.</span>
          </h2>
          <ul className="mt-8 space-y-3 text-sm text-cream/65">
            <li className="flex items-center gap-2">
              <Check className="size-4 text-lime" /> Les pages importantes restent accessibles.
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-4 text-lime" /> Les pages temporaires disparaissent naturellement.
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-4 text-lime" /> Vous ne triez que les décisions qui comptent.
            </li>
          </ul>
        </div>
        <div className="relative grid place-items-center bg-ink px-8 py-20">
          <div className="grid size-64 place-items-center rounded-full border border-white/10">
            <div className="grid size-44 place-items-center rounded-full border border-white/10">
              <div className="grid size-28 place-items-center rounded-full bg-lime text-center text-lime-foreground">
                <span>
                  <span className="block font-heading text-3xl">1</span>
                  <span className="block text-[10px] tracking-wider uppercase">onglet ouvert</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-lime px-6 py-24 text-center text-lime-foreground">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-ink text-lime">
          <Sparkles className="size-5" />
        </span>
        <p className="mt-6 text-[11px] font-medium tracking-[0.25em] uppercase opacity-70">
          La suite commence ici.
        </p>
        <h2 className="mx-auto mt-4 max-w-3xl font-heading text-5xl leading-[0.98] tracking-tight md:text-7xl">
          Fermez tous les autres.
          <span className="mt-2 block text-[#5f6b4f] italic">Gardez TabNest.</span>
        </h2>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onStart()
          }}
          className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-full bg-cream p-1.5"
        >
          <input
            type="email"
            aria-label="Votre adresse e-mail"
            placeholder="vous@exemple.fr"
            className="h-9 min-w-0 flex-1 bg-transparent px-4 text-left text-sm text-ink outline-none placeholder:text-ink/40"
          />
          <button
            type="submit"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-medium text-cream transition-colors hover:bg-ink/90"
          >
            Commencer <ArrowRight className="size-3.5" />
          </button>
        </form>
        <p className="mt-4 text-xs text-ink/50">Gratuit pour commencer. Aucun spam.</p>
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
            <a href="#top" className="hover:text-ink">
              Confidentialité
            </a>
            <a href="#top" className="hover:text-ink">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
