# Mémoire du projet — TabNest

> Fichier lu au début de chaque session et mis à jour à la fin.
> C'est la mémoire du projet : décisions, états, à-faire. **Aucun secret ici.**

## État actuel (novembre 2025)

**En place**
- **Landing** : cinématique GSAP (scène « sticky » chaos → rangement pilotée par ScrollTrigger), sections « Comment ça marche », « Le principe », « L'automatisation », « Les projets », CTA final, confidentialité. Barre de progression, titres en cascade, `prefers-reduced-motion` respecté.
- **Authentification** : e-mail/mot de passe + « mot de passe oublié » (Supabase). Pas encore de Google OAuth.
- **Dashboard centré sites** : stories « Les plus visités » (top 10), grille de cartes de site empilées, modal de détail par site, notifications (cloche), header flottant, squelettes de chargement, compteur animé.
- **Modèle « raison de garder »** (colonne `reason`) : À décider (3 j), À finir (7 j), Piste (14 j), À retenir (90 j) ; +50 % de durée par visite. Remplace l'ancien « favori ».
- **Ressources** = sites visités **une seule fois**. Plus de section « Favoris » (décision : redondante avec les sites les plus visités).
- **Épinglage** (colonne `pinned`) : le site remonte en tête, animation GSAP Flip, mise à jour optimiste (pas de rechargement).
- **Suppression douce** : AlertDialog shadcn, retrait immédiat, sauvegarde en arrière-plan.
- **Extension Chrome MV3** : capture automatique, favicon/OG/theme-color, respecte `reason`, enrichissement **Microlink** en secours (clé dans `extension/config.js`, fichier gitignoré).
- **Favicons** : chaîne de secours extension → Google s2 → `/favicon.ico` → lettre.
- **Modales** : shadcn `Dialog` / `AlertDialog` (plus de `window.confirm`).
- **Docs** : `docs/UX_UI_TECHNIQUE.md` (document technique UX/UI & frontend).

**Décisions produit à respecter**
- **Pas de captures d'écran** (données sensibles + coût) — décidé avec l'utilisateur.
- **Pas de « favori »** : remplacé par les 4 raisons + l'épinglage.
- Landing : animations GSAP généreuses, mais toujours réversibles au scroll et respectant `prefers-reduced-motion`.
- Bundle > 500 kB : **code-splitting prévu, pas encore fait**.

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
1. **Code-splitting** (alléger le bundle).
2. « Continuer avec Google » (Supabase OAuth + Google Cloud).
3. E-mails transactionnels (Amazon SES).
4. Navigation mobile du dashboard (sidebar masquée aujourd'hui).
5. Faire tester le tunnel complet à 3–5 vrais utilisateurs.
