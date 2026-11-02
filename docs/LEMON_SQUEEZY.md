# TabNest — Configuration Lemon Squeezy (paiements)

> Guide opérationnel. Lemon Squeezy est retenu comme **vendeur enregistré (merchant of record)** :
> il encaisse, facture, gère la TVA et les remboursements. TabNest ne stocke **aucune donnée
> bancaire**. Ce document décrit la configuration à faire côté compte + ce qui est déjà prêt dans le code.

## 0. Prérequis — à ne pas sauter

- **Immatriculation obligatoire** : sans SIRET, aucune vente n'est possible. Créer une
  micro-entreprise (gratuit, en ligne sur `formalites.entreprises.gouv.fr`) puis attendre le SIRET.
- Un **compte Lemon Squeezy** (inscription sur `lemonsqueezy.com`) avec vérification d'identité.
- Un **compte bancaire** pour les versements.
- La **politique de remboursement** de `docs/CONFORMITE.md` doit être validée.

## 1. Créer la boutique

1. Se connecter à Lemon Squeezy → **Store → Create store**.
2. Nom : `TabNest`. URL : `tabnest.lemonsqueezy.com` (ou variante disponible).
3. Renseigner l'adresse de facturation, la devise (**EUR**) et la langue (**français**).

## 2. Créer les produits

Pour chaque formule payante (voir `src/lib/billing.ts`) :

| Produit | Prix | Type |
|---|---|---|
| TabNest Plus | 4,99 € / mois | Abonnement mensuel |
| TabNest Pro | 9,99 € / mois | Abonnement mensuel |

Pour chacun : **Products → New product** → type *Subscription* → prix → description → **Save**.

## 3. Récupérer les liens de paiement

Sur la fiche du produit : **Share → Checkout link** (ou *Buy link*). Exemple :

```
https://tabnest.lemonsqueezy.com/checkout/buy/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 4. Brancher les liens dans l'application

Dans `.env.local` (fichier local, **jamais commité**) :

```bash
VITE_LS_CHECKOUT_PLUS=https://tabnest.lemonsqueezy.com/checkout/buy/xxxx
VITE_LS_CHECKOUT_PRO=https://tabnest.lemonsqueezy.com/checkout/buy/yyyy
```

Puis redémarrer le serveur de développement. `BILLING_READY` passe à `true` : les boutons
« Choisir cette offre » deviennent actifs et remplacent « Bientôt disponible » (section tarifs de la
landing).

> ⚠️ **Ne jamais** mettre la clé API (`lsq_...`) dans une variable `VITE_*` : tout ce qui commence
> par `VITE_` est visible dans le navigateur. Seuls les **liens de checkout** (publics) vont côté front.

## 5. Mode test avant d'encaisser

- Dans Lemon Squeezy, activer le **mode test** de la boutique.
- Le checkout de test accepte la carte `4242 4242 4242 4242` (date future, CVC quelconque).
- Vérifier l'apparition d'un abonnement test dans **Subscriptions**.

## 6. Webhooks (étape suivante, quand les comptes existeront)

Objectif : savoir dans TabNest qui a un abonnement actif.

1. **Settings → Webhooks → Add webhook**, URL : une **Edge Function Supabase** (à créer),
   par exemple `https://<projet>.supabase.co/functions/v1/ls-webhook`.
2. Événements à écouter : `order_created`, `subscription_created`, `subscription_updated`,
   `subscription_cancelled`, `subscription_payment_failed`.
3. La fonction vérifie la **signature** (`X-Signature`) avec le secret fourni par Lemon Squeezy,
   puis met à jour une colonne `plan` / `subscription_status` sur le compte.
4. La clé secrète et le secret de signature vivent dans les **secrets Supabase**, jamais dans le front.

## 7. Ce qui est déjà prêt dans le code

- `src/lib/billing.ts` : plans, prix, liens lus depuis l'environnement, `BILLING_READY`.
- `src/components/landing/Pricing.tsx` : section tarifs, état « Bientôt disponible » si non configuré.
- `docs/CONFORMITE.md` : mentions de rétractation (art. L221-18 / L221-28 13°) et de médiation.

## 8. Ce qui reste à faire dans l'application

- [ ] Page de succès après paiement (retour depuis Lemon Squeezy).
- [ ] Webhook + colonne d'abonnement en base.
- [ ] Restriction des fonctionnalités payantes + interface de gestion d'abonnement.
- [ ] Case de renonciation à la rétractation sur le checkout (paramètre Lemon Squeezy).
- [ ] Médiateur de la consommation désigné et publié dans les CGU.
