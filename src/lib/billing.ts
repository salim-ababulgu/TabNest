// Socle de facturation — Lemon Squeezy.
//
// Lemon Squeezy agit comme vendeur enregistré (merchant of record) : il encaisse,
// facture et gère la TVA. Côté application, on ne stocke aucune donnée bancaire.
//
// Les liens de paiement sont fournis par des variables d'environnement (fichier
// .env.local, jamais commité) :
//   VITE_LS_CHECKOUT_PLUS=https://tabnest.lemonsqueezy.com/checkout/buy/xxxx
//   VITE_LS_CHECKOUT_PRO=https://tabnest.lemonsqueezy.com/checkout/buy/yyyy
//
// Tant qu'aucun lien n'est configuré, la vente est présentée comme fermée
// (compte honnête : l'immatriculation de l'activité n'est pas encore faite).

export type PlanId = 'free' | 'plus' | 'pro'

export type Plan = {
  id: PlanId
  name: string
  price: string
  period: string
  description: string
  features: string[]
  checkoutUrl: string | null
  highlight?: boolean
}

function checkoutUrl(id: PlanId): string | null {
  const value = import.meta.env[`VITE_LS_CHECKOUT_${id.toUpperCase()}`] as string | undefined
  return typeof value === 'string' && value.startsWith('https://') ? value : null
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Découverte',
    price: '0 €',
    period: 'pour toujours',
    description: 'Garder le fil, sans rien payer.',
    features: [
      'Pages illimitées',
      'Quatre raisons de garder',
      'Projets et épinglage',
      'Aucune capture d’écran',
    ],
    checkoutUrl: null,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '4,99 €',
    period: 'par mois',
    description: 'Pour aller plus loin au quotidien.',
    features: [
      'Tout Découverte',
      'Sauvegarde prioritaire',
      'Support par e-mail',
      'Accès anticipé aux nouveautés',
    ],
    checkoutUrl: checkoutUrl('plus'),
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '9,99 €',
    period: 'par mois',
    description: 'Pour les projets qui comptent.',
    features: [
      'Tout Plus',
      'Export de vos données',
      'Statistiques de consultation',
      'Support prioritaire',
    ],
    checkoutUrl: checkoutUrl('pro'),
  },
]

/** Vrai dès qu'au moins un lien de paiement est configuré. */
export const BILLING_READY = PLANS.some((plan) => plan.checkoutUrl !== null)
