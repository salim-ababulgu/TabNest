import { ArrowRight, EyeOff, Puzzle, ShieldCheck, Sparkles } from 'lucide-react'

const STEPS = [
  {
    n: '01',
    title: 'Téléchargez le dossier de l’extension',
    text: 'Le dossier « extension » du projet contient le manifeste, les scripts et l’interface de l’extension (version de test).',
  },
  {
    n: '02',
    title: 'Chrome ou Edge : ouvrez « chrome://extensions »',
    text: 'Activez le mode développeur (interrupteur en haut à droite), puis cliquez sur « Charger l’extension non empaquetée » et sélectionnez le dossier.',
  },
  {
    n: '03',
    title: 'Connectez l’extension à votre compte',
    text: 'Cliquez sur l’icône TabNest dans la barre du navigateur, puis connectez-vous avec l’adresse e-mail de votre compte TabNest.',
  },
  {
    n: '04',
    title: 'Naviguez : c’est tout',
    text: 'Chaque page visitée est enregistrée automatiquement. Elle apparaît dans votre tableau de bord, rangée par site.',
  },
]

export function ExtensionPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-lime text-lime-foreground">
              <Sparkles className="size-4" />
            </span>
            <span className="font-heading text-lg font-semibold">TabNest</span>
          </a>
          <a
            href="/"
            className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Retour au site
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          <Puzzle className="size-3.5" aria-hidden="true" />
          Chrome et Edge · version de test
        </p>

        <h1 className="mt-5 font-heading text-3xl leading-tight font-medium tracking-tight sm:text-4xl">
          Installez l’extension, gardez tout le reste.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-foreground/75">
          L’extension est ce qui rend TabNest magique : elle enregistre les pages que vous visitez,
          sans que vous ayez à cliquer. Quatre étapes, une seule fois.
        </p>

        <ol className="mt-10 space-y-6">
          {STEPS.map((step) => (
            <li key={step.n} className="flex gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary font-heading text-sm">
                {step.n}
              </span>
              <div>
                <h2 className="font-heading text-lg font-medium">{step.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-heading text-base font-medium">
            <ShieldCheck className="size-4 text-lime" aria-hidden="true" />
            Ce que l’extension voit — et ne voit jamais
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/70">
            <li className="flex gap-2">
              <EyeOff className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              Elle lit l’adresse, le titre, l’icône du site, l’image de partage publique et la
              couleur dominante de la page.
            </li>
            <li className="flex gap-2">
              <EyeOff className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              Elle ne lit jamais le contenu de la page, ne prend aucune capture d’écran et
              n’enregistre pas vos mots de passe.
            </li>
            <li className="flex gap-2">
              <EyeOff className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              Vous pouvez la désactiver d’un clic, sans la désinstaller.
            </li>
          </ul>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
          La version publique de l’extension sera publiée sur le Chrome Web Store. En attendant,
          cette installation manuelle est réservée aux tests : elle demande le mode développeur de
          Chrome.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-lime px-6 text-sm font-semibold text-lime-foreground"
          >
            Ouvrir l’application
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <a
            href="/#comment"
            className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium hover:bg-accent"
          >
            Comment ça marche
          </a>
        </div>
      </main>
    </div>
  )
}
