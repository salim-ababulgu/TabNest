# Filnest — Document technique UX/UI & Frontend

> Rédigé sous l'angle « développeur frontend senior + designer UX/UI senior ».
> Version : 1.0 — novembre 2025 · Projet : Filnest (web + extension Chrome MV3)

---

## 1. Vision produit & principes UX

**Promesse centrale** : *Filnest ne te demande pas de choisir quoi garder. Il te demande **pourquoi** tu gardes.*

Le produit remplace la question binaire « favori ou pas ? » par **4 intentions** qui couvrent les raisons réelles pour lesquelles on garde des onglets :

| Intention | Raison utilisateur | Durée de vie de base |
|---|---|---|
| **À décider** | « Je n'arrive pas à décider » | 3 jours |
| **À finir** | « Je n'ai pas terminé » | 7 jours |
| **Piste** | « Je ne veux pas perdre cette possibilité » | 14 jours |
| **À retenir** | « Je ne veux pas oublier que ça existe » | 90 jours |

Compléments : **Ressources** (sites visités une seule fois), **Outils récurrents** (éphémères), **Épinglage** (ex. Netflix : « je reviens moi-même » — remonte le site en tête, sans changer sa durée de vie), **Archives** (pages expirées).

**Principes UX appliqués partout :**
1. **Calme** — pas de pression, pas de liste interminable à trier.
2. **Fermer sans regret** — la capture est automatique ; fermer un onglet n'est plus une décision.
3. **Feedback immédiat** — toute action (épingler, supprimer, ranger) se voit instantanément, la sauvegarde se fait en arrière-plan.
4. **Mouvement signifiant** — les animations racontent le produit (le chaos qui se range), elles ne décorent pas.

---

## 2. Design tokens

### Couleurs
| Token | Valeur | Usage |
|---|---|---|
| `cream` | `#f4f1e8` | fond clair |
| `ink` | `#1a1a16` | texte, fonds sombres |
| `lime` | `#c8f05a` | actions primaires, accents, focus |
| `sidebar` | `#161613` | navigation latérale |

Les rôles sémantiques (shadcn) : `background`, `foreground`, `card`, `muted`, `primary`, `destructive`, `border`, `ring`, `popover`, `sidebar-*`.

### Typographie
- **Fraunces** (variable, serif) : titres, accents émotionnels — `font-heading`.
- **Geist** : interface, corps de texte.
- Échelle : 11 px (étiquettes) → 12/13/14 px (texte) → 16/18/20/24 px (titres de carte) → 30/36/48/60/72 px (titres de section). Le hero monte à `text-7xl` uniquement sur grand écran.

### Espacement
- Échelle de base **4 px** ; padding de section unifié : `py-24` (mobile) → `py-32` (≥768 px).
- Colonnes en « split » : `px-8` → `md:px-14`, `md:py-28`.
- Largeur max : `max-w-6xl` (contenu), `max-w-3xl` (textes centrés), `max-w-lg` (modales).

### Rayons & ombres
- Rayons : 8 px (boutons) → 10–12 px (cartes) → 16 px (modales, grosses cartes).
- Ombres : légères et diffuses ; jamais d'ombre dure (esthétique « papier calme »).

---

## 3. Système de mouvement (GSAP)

GSAP est le moteur d'animation unique. Trois plugins utilisés : **core**, **ScrollTrigger** (cinématique), **Flip** (réordonnancement).

### Durées (référence)
| Usage | Durée |
|---|---|
| Micro-interactions (hover, switch) | 200–350 ms |
| Apparitions (modales, cartes) | 400–550 ms |
| Entrées de section | 700–900 ms |
| Cinématique (scrub) | pilotée par le scroll (aucune durée fixe) |

### Easings (référence)
| Easing | Usage |
|---|---|
| `power2.out` | interfaces, hovers |
| `power3.out` | entrées de sections, modales |
| `power4.out` | hero, gros titres |
| `back.out(1.4–1.6)` | apparitions « pop » (logo, page finale) |
| `sine.inOut` | flottements en boucle |
| `none` | animations scrubées (liées au scroll) |

### Règles de performance & de propreté
- **Uniquement `transform` + `opacity`** (rendu GPU, aucun reflow). Les exceptions (box-shadow au hover) sont brèves et peu coûteuses.
- Toute animation vit dans un **`gsap.context()`** et est **tuée/revert** au démontage (pas de fuite).
- `will-change-transform` posé **uniquement** sur les éléments animés au scroll/hover (cartes de site).
- **`prefers-reduced-motion: reduce`** : toutes les animations sont désactivées ; **l'état final reste toujours visible** (la page finale du cinématique, les compteurs à leur valeur réelle).

### Deux familles d'animations
1. **Déclenchées** : entrées au scroll (IntersectionObserver + tween), apparitions de modales (shadcn/Radix), hovers, compteurs, secousse d'erreur.
2. **Scrubées** (cinématique) : le hero de la landing est une **scène sticky de 280 vh** pilotée par `ScrollTrigger.scrub` — le texte s'efface, les fenêtres convergent, le logo apparaît, la page Filnest se révèle. Revenir en arrière **rembobine** la séquence.

### Inventaire des animations actuelles
| Écran | Animation | Technique |
|---|---|---|
| Landing | barre de progression du scroll | ScrollTrigger + scaleX |
| Landing | lignes du titre en cascade | `from` + stagger |
| Landing | sections qui se révèlent | IntersectionObserver + `gsap.to` |
| Landing | cinématique chaos → rangé | ScrollTrigger scrub (sticky) |
| Dashboard | entrée du contenu en cascade | `gsap.from` + stagger |
| Dashboard | épinglage (remontée des cartes) | GSAP **Flip** + mise à jour optimiste |
| Dashboard | hover des cartes | `mouseenter/leave` + tween |
| Dashboard | compteur de pages animé | tween d'objet + `onUpdate` |
| Dashboard | squelettes de chargement | CSS `animate-pulse` (pas de GSAP nécessaire) |
| Connexion | entrée de carte, bascule des onglets, secousse d'erreur | `from`/`fromTo` + keyframes |

---

## 4. Architecture composants

- **shadcn/ui** (preset « radix-nova ») : `Button`, `Input`, `Label`, `Card`, `Select`, `Badge`, `Checkbox`, `Dialog`, `AlertDialog`. Tous les composants d'interface passent par shadcn.
- **Règles d'or** :
  - Toute **modale** = `Dialog` ; toute **confirmation destructrice** = `AlertDialog`. Interdit : `window.confirm` (bloque le navigateur, casse l'expérience).
  - Les composants « écran » vivent dans `src/components/{landing,dashboard,auth}` ; les primitives dans `src/components/ui`.
  - La logique métier (durées de vie, raisons) vit dans `src/lib/` (`lifetime.ts`, `reason.ts`, `pages.ts`, `auth.tsx`).

---

## 5. Patterns d'interaction clés

### Épinglage sans rechargement (update optimiste + FLIP)
1. L'état local des pages est modifié **immédiatement** (le site remonte en tête).
2. `Flip.getState()` capture les positions des cartes **avant** le rendu.
3. Après le rendu, `Flip.from()` anime les cartes de leur ancienne position vers la nouvelle (glissement fluide).
4. La sauvegarde (`update … pinned`) part **en arrière-plan** ; en cas d'échec, l'état est **annulé** et l'erreur affichée.

### Raison de garder
Chaque page porte une colonne `reason` (`decide | finish | explore | remember`). La durée de vie (`expires_at`) est **dérivée** de la raison + du nombre de visites (+50 % par visite, plafonné). L'extension recalcule la même formule côté client (les deux implémentations sont volontairement identiques et simples).

### Suppression douce
`AlertDialog` → confirmation → suppression **optimiste** (la carte disparaît immédiatement) → les cartes restantes **se referment en glissant** (Flip) → `deleted_at` écrit en base (aucune perte de données physique).

### Synchronisation navigateur ↔ app
L'extension (MV3) envoie les captures via PostgREST ; l'app détecte l'extension par `postMessage` + attribut DOM + sondage toutes les 2 s, et se rafraîchit silencieusement toutes les 20 s.

---

## 6. Accessibilité

- **Focus visible** sur tous les contrôles (ring shadcn) ; navigation clavier complète.
- **`Échap`** ferme les modales ; le **focus est piégé** dedans (Radix).
- **`aria-label`** sur tous les boutons icône (épingler, supprimer, rafraîchir, visiter…).
- **Contraste** : texte `ink/60` minimum sur fond clair ; jamais de texte lime sur fond clair sans contraste vérifié.
- **`prefers-reduced-motion`** respecté partout (voir §3).
- Interface 100 % **en français**, langage simple et direct.

---

## 7. Performance

- Bundle actuel : ~775 kB (≈ 242 kB gzip). **Dépassement de la limite des 500 kB** — c'est le principal chantier performance.
- **Plan recommandé (prioritaire)** :
  1. `React.lazy` sur `Landing` et `Dashboard` (la landing n'a pas besoin d'être chargée pour un utilisateur connecté, et inversement).
  2. Charger **GSAP + ScrollTrigger + Flip** dans un chunk séparé (ou lazy via import dynamique au montage de la landing/dashboard).
  3. Découper `Dashboard.tsx` (~1 200 lignes) : `Sidebar`, `SiteGrid`, `SiteCard`, `Modals`, hooks (`useExtensionStatus`, `usePages`).
- Autres bonnes pratiques déjà en place : images OG en `loading="lazy"`, aucun screenshot (confidentialité + poids), polling silencieux, pas de re-rendu inutile (état local + dérivations mémoïsables à venir).
- **Confidentialité** : pas de capture d'écran (données sensibles : numéros de compte…), stockage limité à l'URL/titre/icône/image publique.

---

## 8. État actuel & roadmap

**En place** : landing cinématique GSAP, 4 intentions + ressources + épinglage, modales shadcn, suppression douce, onboarding extension, authentification e-mail (+ réinitialisation), favicons avec fallback, design tokens cohérents.

**À venir (priorité)** :
1. Code-splitting (bundle).
2. « Continuer avec Google » (Supabase OAuth + Google Cloud).
3. E-mails transactionnels (SES) pour l'onboarding et la réinitialisation.
4. Navigation mobile du dashboard (sidebar actuellement masquée).
5. Faire tester le tunnel complet à 3–5 utilisateurs (landing → inscription → installation extension → première capture).
