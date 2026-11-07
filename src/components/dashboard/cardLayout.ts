// Géométrie partagée entre la carte réelle et son squelette de chargement.
// Modifier ces constantes met à jour les deux d'un seul coup : le squelette
// reste ainsi fidèle à chaque évolution du design.
export const CARD_SHELL_CLASS =
  'relative flex flex-row overflow-hidden rounded-2xl border bg-card transition-colors sm:flex-col'

export const CARD_THUMB_CLASS =
  'relative block aspect-square w-16 shrink-0 overflow-hidden bg-secondary text-left sm:aspect-[16/10] sm:w-full'

export const CARD_THUMB_HEIGHT_CLASS = 'size-10 rounded-lg'

export const CARD_BODY_CLASS = 'flex min-w-0 flex-1 flex-col p-3 sm:p-4'

/** Grille des cartes, partagée par la vraie grille et le squelette. */
export const CARD_GRID_CLASS = 'mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3'
