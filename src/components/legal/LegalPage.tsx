import { Sparkles } from 'lucide-react'
import { LEGAL_DOCS, type LegalSlug } from '@/components/legal/legal-content'

const NAV: { slug: LegalSlug; label: string }[] = [
  { slug: 'confidentialite', label: 'Confidentialité' },
  { slug: 'cgu', label: "Conditions d'utilisation" },
  { slug: 'cookies', label: 'Cookies' },
  { slug: 'remboursement', label: 'Remboursement' },
]

export function LegalPage({ slug }: { slug: LegalSlug }) {
  const doc = LEGAL_DOCS[slug]

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

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-heading text-3xl leading-tight font-medium tracking-tight sm:text-4xl">
          {doc.title}
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Dernière mise à jour : {doc.updated}
        </p>
        <p className="mt-6 text-sm leading-relaxed text-foreground/85">{doc.intro}</p>

        <div className="mt-10 space-y-9">
          {doc.sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-heading text-xl font-medium tracking-tight">{section.title}</h2>

              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-relaxed text-foreground/85">
                  {paragraph}
                </p>
              ))}

              {section.list && (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/85">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}

              {section.table && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {section.table.head.map((heading) => (
                          <th key={heading} scope="col" className="py-2 pr-4 font-medium">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row) => (
                        <tr key={row[0]} className="border-b border-border/60 align-top">
                          {row.map((cell, index) => (
                            <td key={index} className="py-2 pr-4 text-foreground/85">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {section.paragraphsAfter?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-relaxed text-foreground/85">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <nav aria-label="Autres documents légaux" className="mt-12 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">Autres documents</p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {NAV.filter((item) => item.slug !== slug).map((item) => (
              <li key={item.slug}>
                <a
                  href={`/${item.slug}`}
                  className="underline-offset-2 hover:text-foreground hover:underline"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="mailto:salimababulgu@gmail.com"
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-6 text-xs text-muted-foreground">
          TabNest, édité par ABA (personne physique, activité non immatriculée à ce jour). Contact :
          salimababulgu@gmail.com. Ces documents doivent être relus par un professionnel du droit.
        </div>
      </footer>
    </div>
  )
}
