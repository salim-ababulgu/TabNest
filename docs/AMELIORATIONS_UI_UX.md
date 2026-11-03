# TabNest — 25 améliorations UI + 25 améliorations UX

> Chantier lancé le 2 novembre 2025. Chaque ligne est datée par son état :
> ✅ fait · 🚧 en cours · ⏳ à faire · ❌ bloqué/à décider.

## 25 améliorations UI (interface)

| # | Amélioration | État |
|---|---|---|
| 1 | Palette unifiée « nid » (papier chaud, pin, miel) sur toute l'app | ✅ |
| 2 | Contrastes WCAG corrigés (texte atténué 5,16 ; focus 3,76 ; bordure champ 3,18) | ✅ |
| 3 | Rayons harmonisés (0,5 rem) et ombres douces | ✅ |
| 4 | Hiérarchie typographique : Fraunces pour les titres, Geist pour le texte | ✅ |
| 5 | Hero statique : texte + boutons au-dessus, fenêtres en éventail coupées en bas | ✅ |
| 6 | Bandeau défilant de **types de pages** (aucune marque, pas de faux partenariats) | ✅ |
| 7 | « Comment ça marche » épinglé, progression au scroll, visuels qui changent | ✅ |
| 8 | Bento grid « Ce que TabNest fait vraiment » | ✅ |
| 9 | Section **tarifs** avec badge « Recommandé » et état « Bientôt disponible » | ✅ |
| 10 | FAQ en accordéon natif (`details`) | ✅ |
| 11 | Footer 4 colonnes (Produit / Légal / Contact + mention éditeur) | ✅ |
| 12 | Page dédiée `/extension` (étapes, permissions, confidentialité) | ✅ |
| 13 | Squelettes de chargement du dashboard (plus de « Chargement… » sec) | ✅ |
| 14 | États vides avec action (bouton « Installer l'extension ») | 🚧 |
| 15 | Cartes de sites empilées selon les visites | ✅ |
| 16 | Favicons avec chaîne de secours (extension → Google → /favicon.ico → initiale) | ✅ |
| 17 | Sidebar avec compteurs par section | ✅ |
| 18 | Notifications de confirmation (toasts) après action | ✅ |
| 19 | Micro-animations d'action (épinglage Flip, suppression animée) | ✅ |
| 20 | Aperçu produit du dashboard sur la landing | ⏳ |
| 21 | Images de partage chargées en lazy | ✅ |
| 22 | Mode sombre complet (variables `.dark` posées, pas d'interface de bascule) | ⏳ |
| 23 | Échelle de police et densité adaptées au mobile | ⏳ |
| 24 | États d'erreur visuels harmonisés (bandeau + `role="alert"`) | ✅ |
| 25 | Favicon et icônes de l'application | ✅ |

## 25 améliorations UX (parcours)

| # | Amélioration | État |
|---|---|---|
| 1 | Le CTA « Commencer gratuitement » ouvre **l'inscription** (avant : la connexion) | ✅ |
| 2 | CTA « Installer l'extension » : hero, footer, dashboard, page dédiée | ✅ |
| 3 | Bouton afficher/masquer le mot de passe | ✅ |
| 4 | Messages d'erreur et d'information annoncés aux lecteurs d'écran | ✅ |
| 5 | « Mot de passe oublié ? » | ✅ |
| 6 | « Continuer avec Google » | ✅ |
| 7 | E-mail pré-rempli depuis le CTA de la landing | ✅ |
| 8 | Onboarding extension guidé (carte du dashboard + page dédiée) | ✅ |
| 9 | Lien permanent vers l'installation dans le dashboard | ✅ |
| 10 | **Navigation mobile** : barre d'onglets en bas + tiroir complet | ✅ |
| 11 | **Publication Chrome Web Store** (aujourd'hui : installation manuelle impossible pour un visiteur) | ❌ bloquant |
| 12 | Purge automatique des pages expirées (SQL `pg_cron` fourni dans `CONFORMITE.md`) | ❌ conformité |
| 13 | Message compréhensible si la base ne répond pas | 🚧 |
| 14 | Recherche de pages | ⏳ |
| 15 | Filtres (raison, date, projet) en plus des sections | 🚧 |
| 16 | Export de ses données (portabilité RGPD) | ⏳ |
| 17 | Suppression de compte depuis l'application | ⏳ |
| 18 | Notifications (cloche) : badge non-lu, alertes réelles, état lu, alertes navigateur | ✅ |
| 19 | Parcours d'accueil après inscription (assistant en 3 écrans) | ⏳ |
| 20 | Paiement Lemon Squeezy (socle codé, liens à configurer) | 🚧 |
| 21 | Tarifs lisibles, honnêtes, sans fausse promesse | ✅ |
| 22 | FAQ qui répond aux vraies questions (pages, données, mobile, gratuité) | ✅ |
| 23 | Politique de remboursement accessible depuis le footer | ✅ |
| 24 | Bandeau d'information cookies honnête (aucun traceur à consentir) | ✅ |
| 25 | Accessibilité clavier (focus visible, `aria-label`, `Échap`, `prefers-reduced-motion`) | ✅ (test lecteur d'écran à faire) |

## Ordre de travail recommandé

1. **Bloquants pour un vrai utilisateur** : #UX10 (mobile), #UX11 (Chrome Web Store), #UX12 (purge).
2. **Conversion** : #UX19 (onboarding), #UX14 (recherche), #UI20 (aperçu produit).
3. **Confort** : toasts (#UI18), mode sombre (#UI22), export/suppression de compte (#UX16/17).
4. **Paiement** : #UX20 quand l'immatriculation sera faite (voir `docs/LEMON_SQUEEZY.md`).
