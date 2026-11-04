import { useState } from 'react'
import type { ReactNode } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { Hero } from '@/components/landing/Hero'
import { BentoSection, FaqSection, PageTypeMarquee, PinnedSteps } from '@/components/landing/Sections'
import { ComparisonSection } from '@/components/landing/Comparison'
import { ScreenshotFrame } from '@/components/landing/ScreenshotFrame'
import { PricingSection } from '@/components/landing/Pricing'

type LandingProps = { onStart: (email?: string) => void }

function Reveal({
  children,
  className,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return <div className={className}>{children}</div>
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

export function Landing({ onStart }: LandingProps) {
  const [email, setEmail] = useState('')

  return (
    <div id="top" className="relative bg-cream text-ink">
      <header className="fixed top-0 right-0 left-0 z-40 px-4 pt-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border border-white/10 bg-ink px-4 py-2.5">
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
            <a href="#produit" className="transition-colors hover:text-cream">
              Le produit
            </a>
            <a href="#automatisation" className="transition-colors hover:text-cream">
              L'automatisation
            </a>
            <a href="#projets" className="transition-colors hover:text-cream">
              Les projets
            </a>
          </nav>
          <PillButton onClick={() => onStart()} className="bg-lime text-lime-foreground hover:bg-lime/90">
            Essayer
          </PillButton>
        </div>
      </header>

      <Hero onStart={() => onStart()} />

      <PageTypeMarquee />

      {/* Comment ça marche */}
      <div id="comment" className="scroll-mt-24">
        <PinnedSteps />
      </div>

      <BentoSection />

      <ComparisonSection />

      <PricingSection />

      {/* Le principe */}
      <section id="principe" className="grid md:grid-cols-2">
        <div className="flex items-center bg-cream px-8 py-24 md:px-14 md:py-28">
          <Reveal className="w-full">
            <h2 className="font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl">
              Vous ne gardez pas des onglets. Vous gardez des intentions.
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink/60">
              Lire, comparer, postuler, acheter, apprendre. Fermer une page donne l'impression
              d'abandonner ce que vous vouliez en faire.
            </p>
          </Reveal>
        </div>
        <div className="flex items-center bg-ink px-8 py-24 text-cream md:px-14 md:py-28">
          <Reveal delay={150} className="w-full">
            <ScreenshotFrame
              src="/screenshots/dashboard-mobile.png"
              alt="TabNest sur mobile : les pages gardées, triées par site"
              tone="dark"
              portrait
              className="mx-auto max-w-[240px]"
            />
          </Reveal>
        </div>
      </section>

      {/* Dark centered */}
      <section className="flex items-center bg-ink px-6 py-24 text-center text-cream md:py-32">
        <Reveal className="mx-auto max-w-5xl">
          <h2 className="font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl">
            Réunir les pages ne suffit pas. Sinon TabNest ne serait qu'un favori de plus.
          </h2>
        </Reveal>
      </section>

      {/* L'automatisation */}
      <section id="automatisation" className="grid md:grid-cols-2">
        <div className="flex items-center bg-ink px-8 py-24 text-cream md:px-14 md:py-28">
          <Reveal className="w-full">
            <h2 className="font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
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
            <ScreenshotFrame
              src="/screenshots/dashboard-detail.png"
              alt="Le détail d'une page dans TabNest : raison, durée de vie et visites"
              tone="dark"
              crop="center"
            />
          </Reveal>
        </div>
      </section>

      {/* Les projets */}
      <section id="projets" className="grid md:grid-cols-2">
        <div className="flex items-center bg-cream px-8 py-24 md:px-14 md:py-28">
          <Reveal className="w-full">
            <h2 className="font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl">
              Les pages ne vivent pas seules. Elles appartiennent à vos projets.
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
            <ScreenshotFrame
              src="/screenshots/dashboard-grid.png"
              alt="Les sites empilés dans TabNest, avec les projets dans le menu"
              tone="light"
            />
          </Reveal>
        </div>
      </section>

      {/* Espace de travail */}
      <section className="grid md:grid-cols-2">
        <div className="flex items-center bg-ink px-8 py-24 text-cream md:px-14 md:py-28">
          <Reveal className="w-full">
            <h2 className="font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl">
              Votre navigateur peut enfin redevenir un espace de travail.
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
                    <span className="block text-xs">onglet ouvert</span>
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <FaqSection />

      {/* CTA final */}
      <section className="flex items-center bg-lime px-6 py-24 text-center text-lime-foreground md:py-32">
        <div className="mx-auto w-full max-w-3xl">
          <Reveal>
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-ink text-lime">
              <Sparkles className="size-5" />
            </span>
            <h2 className="mx-auto mt-4 max-w-4xl font-heading text-3xl leading-[1.02] tracking-tight sm:text-4xl md:text-5xl">
              Fermez tous les autres. Gardez TabNest.
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
                Commencer
              </button>
            </form>
            <p className="mt-4 text-xs text-ink/50">Gratuit pour commencer. Aucun spam.</p>
          </Reveal>
        </div>
      </section>

      {/* Confidentialité */}
      <section id="confidentialite" className="flex items-center bg-cream px-6 py-24 md:py-32">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
            Vos pages restent les vôtres.
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-ink/60">
            TabNest stocke l'adresse, le titre et l'image publique de vos pages. Pas de capture
            d'écran, pas de contenu privé, pas de revente. Vous supprimez ce que vous voulez, quand
            vous voulez.
          </p>
        </Reveal>
      </section>

      <footer className="border-t border-border bg-cream px-6 py-12 text-ink">
        <div className="mx-auto grid max-w-6xl gap-10 text-sm sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-lime text-lime-foreground">
                <Sparkles className="size-4" />
              </span>
              <span className="font-heading text-lg font-semibold">TabNest</span>
            </div>
            <p className="mt-3 max-w-[22ch] text-ink/50">Un onglet pour garder le fil.</p>
          </div>

          <div>
            <p className="text-xs font-medium text-ink/45">Produit</p>
            <ul className="mt-3 space-y-2 text-ink/70">
              <li>
                <a href="#comment" className="hover:text-ink">
                  Comment ça marche
                </a>
              </li>
              <li>
                <a href="#produit" className="hover:text-ink">
                  Le produit
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-ink">
                  Questions fréquentes
                </a>
              </li>
              <li>
                <a href="/extension" className="hover:text-ink">
                  Installer l’extension
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium text-ink/45">Légal</p>
            <ul className="mt-3 space-y-2 text-ink/70">
              <li>
                <a href="/confidentialite" className="hover:text-ink">
                  Confidentialité
                </a>
              </li>
              <li>
                <a href="/cgu" className="hover:text-ink">
                  Conditions d’utilisation
                </a>
              </li>
              <li>
                <a href="/cookies" className="hover:text-ink">
                  Cookies
                </a>
              </li>
              <li>
                <a href="/remboursement" className="hover:text-ink">
                  Remboursement
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium text-ink/45">Contact</p>
            <ul className="mt-3 space-y-2 text-ink/70">
              <li>
                <a href="mailto:salimababulgu@gmail.com" className="hover:text-ink">
                  Écrire un e-mail
                </a>
              </li>
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-ink/40">
              Édité par ABA, personne physique. Activité non immatriculée à ce jour.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
