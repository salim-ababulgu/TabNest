const ROWS = [
  {
    label: 'Ce qui est gardé',
    local: 'Une session du navigateur, ou un favori rangé dans un dossier.',
    tabnest: 'La page elle-même, avec la raison de la garder et sa date d’expiration.',
  },
  {
    label: 'Comment on trie',
    local: 'Des dossiers à nommer et à maintenir à la main.',
    tabnest: 'Quatre raisons (à décider, à finir, piste, à retenir) et des projets.',
  },
  {
    label: 'Où on la retrouve',
    local: 'Sur ce navigateur, sur cet appareil, uniquement.',
    tabnest: 'Sur tous vos appareils, via votre compte.',
  },
  {
    label: 'Ce qu’on oublie',
    local: 'Rien ne se vide jamais : la liste grossit indéfiniment.',
    tabnest: 'Chaque page a une durée de vie, qui s’allonge quand vous la revisitez.',
  },
  {
    label: 'Vie privée',
    local: 'Aucun compte, données locales, aucune synchro possible.',
    tabnest: 'Compte cloisonné, aucune capture d’écran, aucune revente de données.',
  },
]

/**
 * Comparatif honnête avec les extensions locales de gestion d'onglets et de favoris.
 * On ne nomme aucun concurrent : on décrit une catégorie de produit.
 */
export function ComparisonSection() {
  return (
    <section className="px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto w-full max-w-5xl">
        <h2 className="max-w-2xl font-heading text-3xl leading-[1.05] tracking-tight sm:text-4xl">
          Un gestionnaire d’onglets range. TabNest se souvient.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/70">
          Les extensions classiques gardent des sessions ou des favoris, sur un seul navigateur.
          TabNest garde la page avec son intention et sa durée de vie, et la retrouve partout.
        </p>

        <table className="mt-10 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="w-1/4 py-3 pr-4 font-medium" />
              <th scope="col" className="py-3 pr-4 font-medium text-foreground/60">
                Une extension locale
              </th>
              <th scope="col" className="py-3 font-medium">
                TabNest
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-b border-border align-top">
                <th scope="row" className="py-4 pr-4 font-medium">
                  {row.label}
                </th>
                <td className="py-4 pr-4 leading-relaxed text-foreground/60">{row.local}</td>
                <td className="py-4 leading-relaxed">{row.tabnest}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Description d’une catégorie de produit, pas d’un concurrent précis : la plupart des
          extensions de gestion d’onglets et de favoris stockent vos données localement, sans compte.
        </p>
      </div>
    </section>
  )
}
