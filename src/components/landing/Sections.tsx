import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EyeOff, Pin, Bookmark, Clock, FolderOpen, ShieldCheck } from 'lucide-react'
import { ScreenshotFrame } from '@/components/landing/ScreenshotFrame'

gsap.registerPlugin(ScrollTrigger)

// Types de pages que l’on garde — aucun nom de marque : ce ne sont pas des partenariats.
const PAGE_TYPES = [
  'Documentation',
  'Offre d’emploi',
  'Comparatif',
  'Annonce immobilière',
  'Traduction',
  'Tutoriel',
  'Achat de voiture',
  'Article de fond',
  'Recette',
  'Série à regarder',
]

/** Bandeau défilant des types de pages conservées. */
export function PageTypeMarquee() {
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
    <section
      aria-label="Types de pages que TabNest conserve"
      className="overflow-hidden border-y border-border bg-card py-5"
    >
      <div ref={trackRef} className="flex w-max items-center gap-10 px-6">
        {[...PAGE_TYPES, ...PAGE_TYPES].map((label, index) => (
          <span
            key={`${label}-${index}`}
            aria-hidden={index >= PAGE_TYPES.length}
            className="font-heading text-lg whitespace-nowrap text-muted-foreground/80"
          >
            {label}
          </span>
        ))}
      </div>
    </section>
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
              Trois étapes suffisent.
            </h2>
            <div className="relative mt-10 pl-8">
              <span
                aria-hidden="true"
                className="absolute top-1 bottom-1 left-[5px] w-1 rounded-full bg-border"
              />
              <span
                aria-hidden="true"
                className="pinned-progress absolute top-1 bottom-1 left-[5px] w-1 origin-top scale-y-0 rounded-full bg-lime"
              />
              <ol className="space-y-9">
                {STEPS.map((step, index) => (
                  <li
                    key={step.title}
                    className={`pinned-step-${index} relative opacity-35 transition-none`}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute top-1.5 -left-8 size-3.5 rounded-full bg-lime"
                    />
                    <h3 className="font-heading text-xl font-medium">{step.title}</h3>
                    <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-foreground/70">
                      {step.text}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="relative hidden h-[380px] md:block">
            <div className="pinned-visual-0 absolute inset-0 flex items-center justify-center">
              <ScreenshotFrame
                src="/screenshots/dashboard-overview.png"
                alt="Le tableau de bord TabNest à la première connexion"
                className="w-full max-w-sm"
              />
            </div>

            <div className="pinned-visual-1 absolute inset-0 flex items-center justify-center opacity-0">
              <ScreenshotFrame
                src="/screenshots/dashboard-grid.png"
                alt="Les sites enregistrés, empilés par visites"
                className="w-full max-w-sm"
              />
            </div>

            <div className="pinned-visual-2 absolute inset-0 flex items-center justify-center opacity-0">
              <ScreenshotFrame
                src="/screenshots/dashboard-detail.png"
                alt="Le détail d'une page : sa raison et sa durée de vie"
                crop="center"
                className="w-full max-w-sm"
              />
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
    <section id="produit" ref={ref} className="scroll-mt-24 px-6 py-24 md:px-10 md:py-32">
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
    question: 'Pourquoi pas une extension de gestion d’onglets ou de favoris ?',
    answer:
      'Les extensions classiques gardent des sessions ou des favoris sur un seul navigateur. TabNest garde la page avec la raison de la garder et une durée de vie, puis la retrouve sur tous vos appareils grâce à votre compte.',
  },
  {
    question: 'Je change d’ordinateur : je retrouve mes pages ?',
    answer:
      'Oui. Vos pages sont dans votre compte, pas dans le navigateur : connectez-vous depuis un autre appareil et elles sont là.',
  },
  {
    question: 'Quelles permissions l’extension demande-t-elle ?',
    answer:
      'Lire l’adresse et le titre de la page active, et stocker votre session. Elle n’a accès ni au contenu des pages, ni à vos mots de passe, ni à vos autres onglets.',
  },
  {
    question: 'Que se passe-t-il si je ferme un onglet ou si le navigateur redémarre ?',
    answer:
      'Rien n’est perdu : la page a déjà été enregistrée au moment de la visite. C’est l’inverse de la session qui dépend du navigateur.',
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
    <section id="faq" className="scroll-mt-24 px-6 py-24 md:px-10 md:py-32">
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
