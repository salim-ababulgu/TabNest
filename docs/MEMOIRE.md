# Mémoire du projet — TabNest

> Fichier lu au début de chaque session et mis à jour à la fin.
> C'est la mémoire du projet : décisions, états, à-faire. **Aucun secret ici.**

## État actuel (novembre 2025)

**En place**
- **Landing** : identité « le nid » (papier chaud `#f6f1e4`, pin `#26312a`, miel `#e8a13c`), **hero statique** (texte + boutons au-dessus, fenêtres en éventail coupées en bas — pas d'animation, choix utilisateur), **bandeau de types de pages** défilant (aucune marque), **« comment ça marche » épinglé et scrubbé**, **bento grid**, sections « Le principe », « L'automatisation », « Les projets », **FAQ**, CTA final, confidentialité, footer 4 colonnes.
- **Authentification** : e-mail/mot de passe + « mot de passe oublié » (Supabase). Pas encore de Google OAuth.
- **Dashboard centré sites** : stories « Les plus visités » (top 10), grille de cartes de site empilées, modal de détail par site, notifications (cloche), header flottant, squelettes de chargement.
- **Modèle « raison de garder »** (colonne `reason`) : À décider (3 j), À finir (7 j), Piste (14 j), À retenir (90 j) ; +50 % de durée par visite. Remplace l'ancien « favori ».
- **Ressources** = sites visités **une seule fois**. Plus de section « Favoris » (décision : redondante avec les sites les plus visités).
- **Épinglage** (colonne `pinned`) : le site remonte en tête, animation GSAP Flip, mise à jour optimiste (pas de rechargement).
- **Suppression douce** : AlertDialog shadcn, retrait immédiat, sauvegarde en arrière-plan.
- **Extension Chrome MV3** : capture automatique, favicon/OG/theme-color, respecte `reason`, enrichissement **Microlink** en secours (clé dans `extension/config.js`, fichier gitignoré).
- **Favicons** : chaîne de secours extension → Google s2 → `/favicon.ico` → lettre.
- **Modales** : shadcn `Dialog` / `AlertDialog` (plus de `window.confirm`).
- **Docs** : `docs/UX_UI_TECHNIQUE.md` (document technique UX/UI & frontend), `docs/CONFORMITE.md` (audit données/accessibilité/RGPD).
- **Conformité (brouillons)** : pages `/confidentialite`, `/cgu`, `/cookies`, `/remboursement` + bandeau d'information cookies (aucun traceur non nécessaire → pas de consentement requis) + `public/llms.txt` + meta SEO. Contrastes WCAG mesurés et corrigés (texte atténué, focus, bordure de champ).
- **À compléter avant mise en ligne** : identité de l'éditeur (raison sociale, adresse, SIRET, e-mails de contact), médiateur de la consommation, case de renonciation à la rétractation au paiement, purge `pg_cron` des pages expirées, relecture par un juriste.
- **Éditeur renseigné** : ABA (personne physique), contact `salimababulgu@gmail.com`, **aucun SIRET** (activité non immatriculée). Conséquence : le service reste **gratuit** ; **toute vente exige une immatriculation** (micro-entreprise) et un médiateur de la consommation.

**Décisions produit à respecter**
- **Pas de captures d'écran** (données sensibles + coût) — décidé avec l'utilisateur.
- **Pas de « favori »** : remplacé par les 4 raisons + l'épinglage.
- **Mouvement discipliné** (leçon du skill « frontend-design » d'Anthropic) : **un seul grand moment** (la cinématique) + du mouvement **qui répond aux actions** (épingler, supprimer, modales). Pas de fondu/glissement sur chaque section, pas de hover sur chaque carte. `prefers-reduced-motion` respecté.
- **Plus de signaux « page générée »** : pas d'étiquettes MAJUSCULES au-dessus des titres, pas de « · » entre métadonnées (virgules), pas de flèche « → » sur les boutons, numérotation seulement pour les vraies séquences (les 3 étapes).
- Identité « le nid » : papier/pin/miel — remplace l'ancienne palette crème/lime (jugée « générique »).
- **Code-splitting fait** : écrans chargés à la demande (`React.lazy`), bundle principal **443 kB** (gzip 127 kB), le warning Vite a disparu.

## Services & accès
- **Supabase** : projet `kgrkujedgqsmdlltzyzs` ; URL et clé anon dans `.env.local` (jamais affichées).
- **Microlink** : clé dans `extension/config.js` (gitignoré), plan gratuit ≈ 50 requêtes/jour, 1 requête max par page.
- **Serveur dev** : http://localhost:5173/ — **un seul serveur à la fois**.

## Points techniques sensibles (Windows / sandbox)
- `npm run build` et `npm run dev` échouent (EPERM) sans **autorisation étendue** → toujours la demander.
- Cache npm : `npm_config_cache=C:\Users\salim\Documents\TabNest\.npm-cache`.
- Avant d'éditer `src/` : arrêter le serveur dev s'il verrouille le fichier (erreur `EIO`), puis le relancer.
- **Recharger l'extension** après toute modification de `extension/`.

## À faire (priorités)
1. **Finaliser « Continuer avec Google »** : le code est prêt (bouton + OAuth) ; il manque la config côté utilisateur — Google Cloud (ID client OAuth, URI de redirection `https://kgrkujedgqsmdlltzyzs.supabase.co/auth/v1/callback`), Supabase → Providers → Google, et Redirect URL `http://localhost:5173/**`.
2. E-mails transactionnels (Amazon SES).
3. Navigation mobile du dashboard (sidebar masquée aujourd'hui).
4. Découper `Dashboard.tsx` (~1 200 lignes) en composants (signalé par react-doctor).
5. Faire tester le tunnel complet à 3–5 vrais utilisateurs.

## Outils de qualité
- `npx react-doctor` : score initial **47/100** (18 points). Corrigés : `setBusy`/`setRefreshing` en `finally`, formateur `Intl` hissé, `aria-label` du switch, valeur de contexte mémoïsée. Restants (acceptés ou à traiter plus tard) : gros composants, exports variants shadcn, « client écrit user_id » (protégé par RLS — à revoir avec un défaut `auth.uid()` côté base si on veut être irréprochable).
- Skill appliqué : `vercel-labs/agent-skills@react-best-practices` (règles bundle/rerender).
