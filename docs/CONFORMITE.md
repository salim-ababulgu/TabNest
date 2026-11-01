# TabNest — Conformité, données et accessibilité

> Audit technique et rédactionnel (novembre 2025). Ce document accompagne les pages légales
> publiées dans l’application (`/confidentialite`, `/cgu`, `/cookies`, `/remboursement`).
>
> ⚠️ **Statut : brouillons à relire par un professionnel du droit.** Les mentions
> `[À COMPLÉTER …]` doivent être renseignées avant la mise en ligne. Ce document ne remplace pas
> un conseil juridique.

---

## 1. Données réellement collectées (audit du code)

Source : schéma Supabase (`pages`, `groups`, tables `auth`), extension (`storage.local`,
`storage.session`) et stockage navigateur. Toute donnée listée ici existe réellement dans le code.

| Donnée | Où | Pourquoi | Conservation |
|---|---|---|---|
| E-mail, identifiant, mot de passe chiffré | Supabase Auth | Compte et connexion | Jusqu’à suppression du compte |
| Fournisseur d’identité (Google) + nom | Supabase Auth | Connexion Google | Idem |
| URL, titre, favicon, image de partage (og:image), couleur dominante | `pages` | Affichage de la fiche | Jusqu’à expiration / suppression |
| Nombre de visites, dernière visite, raison de garder, épinglage, date d’expiration | `pages` | Classement, durée de vie, tri | Idem |
| Nom des projets + rattachement | `groups`, `pages.group_id` | Organisation | Jusqu’à suppression |
| Jeton de session (clé `sb-<ref>-auth-token`) | `localStorage` navigateur | Rester connecté | Déconnexion / expiration |
| `captureEnabled`, `captures`, `lastCapture`, `session` | `chrome.storage.local` | Réglage et session de l’extension | Jusqu’à désinstallation |
| `tabs` (URL et titres des onglets ouverts) | `chrome.storage.session` | Rouvrir les onglets fermés | Effacé à la fermeture du navigateur |
| Adresse des pages visitées (envoi ponctuel) | Microlink | Compléter titre/image manquants | Selon Microlink |
| E-mail + nom (si connexion Google) | Google | Authentification | Selon Google |
| Journaux techniques (IP, horodatage) | Supabase / hébergeur | Sécurité, diagnostic | Max. 6 mois (à configurer) |

**Non collecté :** nom, adresse postale, téléphone, date de naissance, contenu des pages, captures
d’écran, données de paiement (Lemon Squeezy à venir, aucune carte chez nous), outil d’analyse
d’audience.

**Minimisation — points d’attention**
- L’extension capture **toutes** les pages visitées sauf les moteurs de recherche et l’application
  elle-même. C’est le cœur du produit, mais cela doit être expliqué clairement (fait dans la
  politique de confidentialité) et désactivable (bouton « Capture automatique »).
- Recommandé avant lancement public : une **liste d’exclusion** (banque, santé, messagerie) et
  l’absence de capture des pages contenant un champ mot de passe. Non implémenté à ce jour.
- `is_interesting` subsiste en base mais n’est plus alimenté ni utilisé (dette technique, sans
  impact sur les données personnelles).

---

## 2. Sous-traitants et transferts hors UE

| Prestataire | Rôle | Données | Localisation |
|---|---|---|---|
| Supabase | Base de données + authentification | Tout le contenu applicatif | Région du projet [À COMPLÉTER] |
| Google | Connexion OAuth | E-mail, nom | États-Unis (clauses contractuelles types) |
| Microlink | Métadonnées de pages | URL | États-Unis (clauses contractuelles types) |
| Lemon Squeezy (à venir) | Paiement, vendeur enregistré | E-mail, données de facturation | Selon Lemon Squeezy |
| Amazon SES (à venir) | E-mails de service | E-mail | Selon AWS |
| Hébergeur (à venir) | Hébergement + journaux | IP, journaux | France si possible |

Un **registre des traitements** (art. 30 RGPD) doit reprendre ces éléments — modèle à créer.

---

## 3. Purge automatique (indispensable pour tenir la politique de confidentialité)

Aujourd’hui, les pages expirées ne sont **plus affichées** mais restent en base : la politique de
confidentialité annonce une suppression à échéance. Il faut donc activer un nettoyage. À exécuter
dans Supabase (SQL Editor), après activation de l’extension `pg_cron` :

```sql
-- 1) Activer pg_cron (Supabase : Database → Extensions)
-- 2) Supprimer chaque nuit les pages dont la date d'expiration est passée
select cron.schedule(
  'tabnest-purge-expired',
  '0 3 * * *',
  $$
    delete from public.pages
    where expires_at is not null
      and expires_at < now() - interval '7 days';
  $$
);
```

> Le délai de 7 jours après expiration laisse une marge de récupération. À ajuster avec la
> politique de confidentialité (durées annoncées) et à vérifier une fois en base.

---

## 4. Cookies et traceurs

**État réel :** aucun cookie publicitaire, aucun outil de mesure d’audience, aucun pixel social.
Seuls des **stockages strictement nécessaires** sont utilisés (session d’authentification dans
`localStorage`, réglages de l’extension dans `chrome.storage`).

**Conséquence juridique :** la CNIL dispense de consentement les traceurs strictement nécessaires.
Un bandeau d’acceptation/refus serait donc **trompeur** et constituerait une non-conformité. Une
simple information est affichée (`CookieNotice`), mémorisée localement, avec un lien vers
`/cookies`.

**Condition à respecter :** si un traceur non nécessaire est ajouté (analytics, pub), il faudra
remplacer cette information par un **véritable bandeau de consentement bloquant** (refus aussi
simple que l’accord, choix conservé, possibilité de retirer son consentement).

**À vérifier :** la configuration du projet Supabase (le tableau de bord peut lui-même déposer des
cookies, sans impact sur nos visiteurs du site).

---

## 5. Accessibility (WCAG 2.1 AA) — résultats mesurés

Contrastes calculés (WCAG 2.1, formules officielles) sur la palette « le nid » :

| Paire | Ratio | Verdict |
|---|---|---|
| Fond `#f6f1e4` / texte `#26312a` | 11,97 | ✅ AA |
| Fond / texte atténué `#62675a` | 5,16 | ✅ AA (corrigé de 4,36) |
| Carte `#fcf9f0` / texte atténué | 5,53 | ✅ AA |
| Miel `#e8a13c` / texte `#241a08` | 7,82 | ✅ AA |
| Pin `#1f2c25` / texte `#f1ecdd` | 12,30 | ✅ AA |
| Fond / rouge destructif `#b3402f` | 5,04 | ✅ AA |
| Fond / anneau de focus `#a86f1f` | 3,76 | ✅ (≥ 3:1, corrigé de 2,60) |
| Fond / bordure de champ `#8e8770` | 3,18 | ✅ (≥ 3:1, corrigé de 1,21) |
| Fond / bordure décorative `#e4dcc6` | 1,21 | ⚪ décorative, non concernée |

**Autres points vérifiés :**
- **Alt text** : les seules images sont les favicons, toujours accompagnés du nom de domaine en
  texte → `alt=""` est le traitement correct (image décorative, pas de doublon pour les lecteurs
  d’écran). L’icône Google est en SVG `aria-hidden`. Aucune image porteuse d’information sans
  équivalent textuel.
- **Boutons icônes** : `aria-label` présents (rafraîchir, notifications, épingler, visiter,
  supprimer, capture automatique, nouveau projet).
- **Formulaires** : chaque champ a un `<label>` associé.
- **Focus** : anneau visible (`ring`), navigation clavier, `Échap` ferme les modales (Radix).
- **Mouvement** : `prefers-reduced-motion` respecté (animations désactivées, états finaux affichés).
- **Sémantique** : titres hiérarchisés (`h1` → `h2`), `table` avec en-têtes `scope="col"`,
  `nav` avec `aria-label`.

**Reste à faire :** test lecteur d’écran (NVDA/VoiceOver), test clavier complet, `lang` sur les
pages (déjà `lang="fr"`), taille de police minimale (12 px utilisée pour les méta — acceptable mais
à surveiller).

---

## 6. Visibilité pour les agents IA

- `public/llms.txt` : description factuelle du service, des données traitées et des pages légales.
- HTML sémantique (titres, listes, tableaux) : lisible par les moteurs et agents.
- `<title>` + `meta description` + Open Graph renseignés.
- Les pages légales sont de vraies URL (`/confidentialite`, etc.), pas du contenu caché.

---

## 7. Mentions à compléter avant mise en ligne

- [x] Éditeur : **ABA** (personne physique), contact **salimababulgu@gmail.com**. Pas de SIRET :
      l'activité n'est pas immatriculée. La LCEN (art. 6, III) permet à un éditeur non
      professionnel de ne pas publier son adresse (elle reste communiquée à l'hébergeur).
- [ ] **Obligatoire avant toute vente** : créer une immatriculation (micro-entreprise, gratuite et
      100 % en ligne sur formalites.entreprises.gouv.fr) pour obtenir un **SIRET**. Sans SIRET,
      aucune facturation ni vente n'est possible (et Lemon Squeezy le demandera).
- [ ] **Médiateur de la consommation** : à désigner dès la première vente à des consommateurs
      (obligatoire, art. L611-1 et suivants). Le service est gratuit aujourd'hui : la CGU le précise.
- [ ] Région d’hébergement Supabase et **DPA** signés (Supabase, Google, Microlink, Lemon Squeezy).
- [ ] **Case à cocher** « je demande l’exécution immédiate et renonce à mon droit de rétractation »
      sur la page de paiement (art. L221-28 13°).
- [ ] Politique commerciale de remboursement confirmée au moment de la mise en vente.
- [ ] Registre des traitements + procédure de violation de données (72 h).
- [ ] Durée des journaux techniques réellement configurée chez l’hébergeur.
- [ ] Purge `pg_cron` activée (section 3).
- [ ] Relecture par un juriste (RGPD + Code de la consommation + LCEN).

---

## 8. Ce qui relève du juriste (et non de l’IA)

Les textes sont rédigés avec les références légales françaises applicables (RGPD, loi
Informatique et Libertés, articles L221-18 et L221-28 du Code de la consommation, articles L611-1
et suivants). Ils **doivent** être validés par un professionnel, notamment : la qualification
exacte de l’éditeur (professionnel ou non), la politique de remboursement commerciale, la
désignation du médiateur, et les mentions LCEN (hébergeur, éditeur).
