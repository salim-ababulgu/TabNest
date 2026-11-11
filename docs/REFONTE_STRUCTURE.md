# Refonte structurelle — synthèse de 6 audits

Méthode : 6 agents en parallèle, 3 **biaisés** (chacun défend un profil) et 3 **neutres**
(méthode, preuves). Lecture seule, preuves par fichiers et lignes de code.
Aucune modification du produit pendant l'audit.

| Agent | Biais / rôle | Verdict en une phrase |
|---|---|---|
| growth-advocate | Conversion, 60 premières secondes | Faire du premier écran une **preuve**, pas une notice |
| power-user-advocate | Utilisateur intensif (100-500 pages) | Une surface dense pilotée au clavier, page par page |
| beginner-advocate | Débutant non technique | Une seule prochaine action, le reste hors de vue |
| ia-naming-specialist | Neutre : architecture et vocabulaire | Destinations / filtres / vues nommées, un concept = un mot |
| heuristics-auditor | Neutre : heuristiques Nielsen | Le **journal de mes pages**, où le temps est un axe |
| mobile-journey-specialist | Neutre : mobile et parité | Un carnet de consultation, pas une copie du bureau |

## 1. Consensus — la cause racine

Les six rapports convergent sur un même diagnostic : **l'interface présente des sites alors
que le produit conserve des pages.** Une page porte sa raison, son type, sa visite et sa date
d'expiration ; l'écran les agrège en cartes de domaine. Tout le reste découle de ce décalage.

1. **Mauvais niveau d'objet.** La carte = un domaine. Le titre affiché est celui de
   `pages[0]` (Dashboard.tsx:2000) ; la fiche ouverte est une fiche de site ; « ranger »
   déplace **toutes** les pages du domaine (803-829). Retrouver une page = 3 clics.
2. **Le temps n'est pas un axe.** Tri figé « épinglé puis visites » (333-338), aucun tri par
   date ni expiration, et « Aujourd'hui » liste en réalité les pages sans raison (1262, 1286).
3. **Taxonomies qui se recouvrent.** Étagère = vue perso = raison = groupe de menu ; projet =
   `group` SQL = règle de vue ; raison, type, étagère, projet se superposent. Un même état
   s'appelle « Modifier », « Ranger les étagères » et « Mode déplacement ».
4. **Un seul écran fourre-tout.** ~2 800 lignes, plus de 40 états, navigation + édition +
   réglages + export dans la même page. Aucun « lieu » stable.
5. **État non autoritaire, actions non annulables.** Un rechargement démonte la grille ;
   « Retirer » est une suppression douce invisible des Archives ; le déplacement n'a ni
   confirmation ni annulation.
6. **Recherche muette sur sa portée.** Elle filtre la vue courante sans le dire, n'indexe pas
   raison/projet/étagère, et ⌘K existe mais n'est affiché nulle part.
7. **Mobile = copie cassée.** Pas de pile de navigation, onglets incomplets, glisser bloqué
   en `touch-none`, message « lecture seule » faux puisque tout est éditable, cibles de 28 px.

## 2. Divergences — arbitrage

- **Croissance** veut un CTA unique « Activer la capture » et la suppression de « Les plus
  visités ». **Power user** veut un tableau dense et une palette de commandes. **Débutant**
  veut des mots simples et une action par écran. → Arbitrage : **un seul écran d'accueil
  orienté « prochaine action »**, mais la densité et les raccourcis restent disponibles
  ailleurs (vue Pages + ⌘K), sans jargon dans le chemin par défaut.
- **IA** veut des « vues enregistrées » et des filtres transversaux ; **débutant** veut moins
  d'entrées de menu. → Arbitrage : entrées = **destinations** seulement (5), les raisons et
  types deviennent des **filtres**, les vues enregistrées n'apparaissent qu'une fois créées.
- **Heuristiques** veut `Récents` + lignes de pages ; **power user** veut un tableau ;
  **mobile** veut des cartes empilées. → Arbitrage : même donnée, **deux densités** :
  cartes (défaut, mobile compris) et tableau (bascule sur ordinateur).

## 3. Architecture cible

```
Destinations (barre latérale)
1. Accueil          état + prochaine action + récents
2. Pages            toutes les pages, filtres et tri, bascule cartes/tableau
3. Projets          un projet = un groupe nommé (ex. Emploi)
4. Archives         Expirées (restaurables) | Retirées (corbeille)
5. Paramètres       compte, apparence, capture, données, aide
Filtres (jamais des entrées de menu) : raison ×4 · type ×3 · période · visitée une fois · recherche

Mobile : Aujourd'hui · Toutes · Recherche · Archives · Plus
```

**Écran d'accueil cible**

```
┌ Filnest   [ ⌘K Rechercher une page… ]            Ranger   + Page   🔔   Compte ┐
├──────────────┬────────────────────────────────────────────────────────────────┤
│ TEMPS        │ [ Bandeau : Capture non activée → « Activer la capture » ]      │
│  Récents  12 │ Aujourd'hui · 12 capturées · 3 à décider · 2 expirent sous 48 h │
│  À décider 3 │ RÉCENTS                                                         │
│  Archives  4 │  titre · domaine · raison · expire dans 7 j            ⋯        │
│              │  titre · domaine · raison · expire dans 3 j            ⋯        │
│ ESPACES      │  …                                                              │
│  Emploi      │ [ sélection : n pages · Déplacer… · Épingler · Annuler ]         │
└──────────────┴────────────────────────────────────────────────────────────────┘
```

## 4. Vocabulaire contrôlé (FR)

| Aujourd'hui | Cible | Raison |
|---|---|---|
| Étagère (perso) | **Liste** (ou vue enregistrée) | mot du quotidien, pas de métaphore |
| Étagère (colonne) | **Raison** | c'est la raison qui pilote la durée de vie |
| Aujourd'hui | **À décider** | la vue ne filtre pas par date |
| Ressources (visitée 1 fois) | **Visitées une fois** (filtre) | règle explicite |
| Modifier / Ranger / Mode déplacement | **Ranger** (un seul mot, un seul état) | 3 noms pour un état aujourd'hui |
| Supprimer (page) | **Supprimer définitivement** + corbeille | la promesse actuelle est fausse |
| Épingler | **Garder sans date limite** | bénéfice explicite |

## 5. Plan par phases

| Phase | Contenu | Effort | Risque |
|---|---|---|---|
| **0 — Correctifs de structure** | revalidation silencieuse (ne plus vider la grille), annulation 5 s sur déplacement/suppression, corbeille « Retirées », « 6 → 8 caractères », `hasReason` inclut « à décider », compteurs alignés, une seule expiration par carte, date localisée | 2 j | faible |
| **1 — Accueil orienté action** | bandeau d'état + un CTA, liste **page par page** des récents, recherche pleine largeur avec ⌘K visible, suppression de « Les plus visités », états vides avec action | 3 j | moyen |
| **2 — Navigation et vocabulaire** | sidebar 2 groupes (Temps / Espaces), 5 destinations, raisons en filtres, tri + période, un seul bouton « Ranger », renommages 4 langues | 2,5 j | moyen |
| **3 — Parcours mobile** | barre du bas (5 entrées), détail en écran poussé avec Retour, feuille de filtres, cibles 44 px, message « capture sur ordinateur » corrigé | 2 j | moyen |
| **4 — Recherche et vues** | palette ⌘K page-level, « chercher partout », vues enregistrées issues des filtres | 3 j | élevé |

## 6. Ce qu'il ne faut pas casser

Onboarding auto réservé aux comptes vides · mise à jour optimiste de l'épingle avec rollback ·
squelettes fidèles (géométrie partagée) · validation d'authentification en temps réel ·
AlertDialog à focus piégé pour les actions destructives · bandeau de restauration des pages
expirées · i18n 4 langues vérifiée par `check-i18n.mjs` · suites Playwright.

## 7. Risques

- **Migration** : les vues et masquages vivent en localStorage (`collections.ts`) ; renommer
  les clés casse les réglages. Garder une double lecture.
- **Tests** : plusieurs suites dépendent de libellés exacts (`check-nest`, `check-edit-mode`,
  `check-sites`, `check-move-persist`) → à mettre à jour dans le même lot.
- **Perf** : un tableau + une palette sur 500 pages exigent une virtualisation.
- **URL** : pas de routeur aujourd'hui ; sans URL par vue, pas de lien profond ni de retour
  mobile. À introduire avant de multiplier les vues.
