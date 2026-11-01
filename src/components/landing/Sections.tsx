import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EyeOff, Pin, Bookmark, Clock, FolderOpen, ShieldCheck } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const SITES = [
  'Netflix',
  'Figma',
  'Google',
  'Notion',
  'Framer',
  'YouTube',
  'GitHub',
  'Linear',
  'Supabase',
  'Wikipedia',
  'Le Monde',
  'Leboncoin',
]

/** Bandeau défilant des sites que l’on garde (décoratif). */
export function SiteMarquee() {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const tween = gsap.to(track, { xPercent: -50, duration: 32, ease: 'none', repeat: -1 })
    return () => {
      tween.kill()
    }
  }, [])

  return (
    <div aria-hidden="true" className="overflow-hidden border-y border-border bg-card py-5">
      <div ref={trackRef} className="flex w-max items-center gap-10 px-6">
        {[...SITES, ...SITES].map((site, index) => (
          <span
            key={`${site}-${index}`}
            className="font-heading text-lg whitespace-nowrap text-muted-foreground/70"
          >
            {site}
          </span>
        ))}
      </div>
    </div>
  )
}

const STEPS = [
  {
    n: '01',
    title: "Installez l'extension",
    text: "Chrome ou Edge. Un dossier, deux clics, et la capture est active.",
  },
  {
    n: '02',
    title: 'Naviguez normalement',
    text: 'Chaque page visitée est enregistrée, sans rien faire. Le bruit reste dehors.',
  },
  {
    n: '03',
    title: 'Retrouvez tout',
    text: 'Vos pages sont rangées par sites et projets, avec une durée de vie.',
  },
]

/** « Comment ça marche » épinglé : la séquence avance avec le scroll. */
export function PinnedSteps() {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
        },
      })

      timeline
        .to('.pinned-progress', { scaleY: 1, duration: 1, ease: 'none' }, 0)
        .to('.pinned-step-0', { opacity: 1, duration: 0.1 }, 0)
        .to('.pinned-step-1', { opacity: 1, duration: 0.1 }, 0.42)
        .to('.pinned-step-2', { opacity: 1, duration: 0.1 }, 0.84)
        .to('.pinned-visual-1', { opacity: 1, duration: 0.15 }, 0.38)
        .to('.pinned-visual-2', { opacity: 1, duration: 0.15 }, 0.8)
    }, wrapper)

    return () => context.revert()
  }, [])

  return (
    <div ref={wrapperRef} className="relative h-[240vh] bg-cream">
      <div className="sticky top-0 flex min-h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="max-w-md font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
              Trois étapes, et vous ne perdez plus rien.
            </h2>
            <div className="relative mt-10 pl-8">
              <span
                aria-hidden="true"
                className="absolute top-1 bottom-1 left-[7px] w-px bg-border"
              />
              <span
                aria-hidden="true"
                className="pinned-progress absolute top-1 bottom-1 left-[7px] w-px origin-top scale-y-0 bg-lime"
              />
              <ol className="space-y-9">
                {STEPS.map((step, index) => (
                  <li
                    key={step.n}
                    className={`pinned-step-${index} relative opacity-35 transition-none`}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute top-1.5 -left-8 size-3.5 rounded-full border-2 border-lime bg-background"
                    />
                    <p className="font-heading text-sm text-muted-foreground">{step.n}</p>
                    <h3 className="mt-1 font-heading text-xl font-medium">{step.title}</h3>
                    <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-foreground/70">
                      {step.text}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="relative hidden h-[380px] md:block">
            <div className="pinned-visual-0 absolute inset-0 flex items-center justify-center rounded-3xl border border-border bg-card p-8">
              <div className="w-full max-w-xs">
                <p className="text-xs text-muted-foreground">Extension TabNest</p>
                <p className="mt-2 font-heading text-2xl">Capture activée</p>
                <div className="mt-6 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-xs">
                  <span className="size-2 rounded-full bg-lime" />
                  1 page enregistrée
                </div>
              </div>
            </div>

            <div className="pinned-visual-1 absolute inset-0 flex items-center justify-center rounded-3xl border border-border bg-secondary/60 p-8 opacity-0">
              <div className="w-full max-w-xs space-y-2">
                {['developer.mozilla.org', 'figma.com', 'netflix.com'].map((site) => (
                  <div
                    key={site}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs"
                  >
                    <span className="size-2 rounded-full bg-lime" />
                    {site}
                  </div>
                ))}
              </div>
            </div>

            <div className="pinned-visual-2 absolute inset-0 flex items-center justify-center rounded-3xl border border-border bg-card p-8 opacity-0">
              <div className="w-full max-w-xs space-y-2">
                {[
                  { name: 'Netflix', meta: 'À retenir · 90 j' },
                  { name: 'Figma', meta: 'À finir · 7 j' },
                  { name: 'Google', meta: 'Piste · 14 j' },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs"
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{item.meta}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const BENTO = [
  {
    icon: Clock,
    title: 'Quatre raisons de garder',
    text: 'À décider, à finir, piste, à retenir. Chaque raison fixe la durée de vie de la page.',
    span: 'sm:col-span-2',
  },
  {
    icon: Pin,
    title: 'Épingler',
    text: 'Un site comme Netflix reste en tête de liste.',
  },
  {
    icon: Bookmark,
    title: 'Ressources',
    text: 'Les sites visités une seule fois, rangés à part.',
  },
  {
    icon: EyeOff,
    title: 'Aucune capture d’écran',
    text: 'URL, titre et image publique uniquement. Jamais le contenu de la page.',
  },
  {
    icon: FolderOpen,
    title: 'Par projets',
    text: 'Emploi, achat de voiture, apprentissage : chaque page retrouve son contexte.',
  },
  {
    icon: ShieldCheck,
    title: 'Cloisonné par compte',
    text: 'Vos pages ne sont visibles que par vous, jamais par un autre utilisateur.',
  },
]

/** Bento grid : ce que le produit fait vraiment, avec une entrée orchestrée. */
export function BentoSection() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const context = gsap.context(() => {
      gsap.from('.bento-card', {
        y: 44,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 78%' },
      })
    }, ref)

    return () => context.revert()
  }, [])

  return (
    <section id="produit" ref={ref} className="px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="max-w-2xl font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
          Ce que TabNest fait vraiment.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/70">
          Pas un énième gestionnaire de favoris. Un système qui décide avec vous, et oublie pour
          vous.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENTO.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className={`bento-card rounded-2xl border border-border bg-card p-6 ${item.span ?? ''}`}
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary">
                  <Icon className="size-4" />
                </span>
                <h3 className="mt-4 font-heading text-lg font-medium">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{item.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

const FAQ = [
  {
    question: 'TabNest lit-il le contenu de mes pages ?',
    answer:
      'Non. Seules les métadonnées publiques sont enregistrées : adresse, titre, icône du site, image de partage et couleur dominante. Aucune capture d’écran, aucun texte de page.',
  },
  {
    question: 'Où sont stockées mes données ?',
    answer:
      'Dans votre compte, sur notre base de données (Supabase). Chaque utilisateur ne peut accéder qu’à ses propres pages : le cloisonnement est appliqué au niveau de la base elle-même.',
  },
  {
    question: 'Puis-je désactiver la capture automatique ?',
    answer:
      'Oui, à tout moment depuis le tableau de bord. L’extension arrête immédiatement d’enregistrer vos visites, sans désinstallation.',
  },
  {
    question: 'Que deviennent les pages expirées ?',
    answer:
      'Elles basculent dans les archives et ne sont plus affichées. Vous pouvez les supprimer définitivement à tout moment, et la suppression de votre compte efface toutes vos données.',
  },
  {
    question: 'TabNest fonctionne-t-il sur mobile ?',
    answer:
      'L’extension est disponible sur les navigateurs de bureau (Chrome, Edge). Les navigateurs mobiles limitent les extensions ; nous travaillons sur une solution pour téléphone.',
  },
  {
    question: 'Est-ce gratuit ?',
    answer:
      'Oui, gratuit aujourd’hui. Une formule payante viendra plus tard pour les besoins avancés, sans supprimer la version gratuite.',
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto w-full max-w-3xl">
        <h2 className="font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
          Questions fréquentes.
        </h2>

        <div className="mt-10 divide-y divide-border border-y border-border">
          {FAQ.map((item) => (
            <details key={item.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                {item.question}
                <span
                  aria-hidden="true"
                  className="text-muted-foreground transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
