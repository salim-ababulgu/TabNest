# AGENTS.md — TabNest

## Ce que fait le produit
TabNest est un service web qui conserve automatiquement les pages web
de l'utilisateur, pour qu'aucun onglet fermé ne soit perdu et qu'aucune
page utile ne soit oubliée.

Fonctionnalités prévues :
- Favori automatique des pages les plus visitées.
- Une page fermée n'est jamais perdue.
- Chaque page a une durée de vie (ex. 24 h, 72 h). Plus la page est
  visitée, plus sa durée de vie s'allonge.
- Marquer une page « intéressante » pour la garder.
- Pages « très intéressantes mais peu visitées » (ex. documentation) :
  gardées durablement sans visites fréquentes.
- Pages « éphémères mais réutilisables » (ex. traduction) : durée de
  vie calculée autrement (ex. par mois).
- Groupes/thèmes (ex. « emploi », « achat de voiture »).
- Piste : classement automatique selon le métier, ou classement manuel.

## Pour qui
Service public, multi-utilisateur, avec formules payantes.
Chaque utilisateur a son propre compte.

## Où on en est
Voir la mémoire du projet : `docs/MEMOIRE.md` (état détaillé, décisions,
à-faire). En bref : landing + dashboard + extension fonctionnels,
modèle « raison de garder » en place, épinglage, enrichissement Microlink.

## Stack technique
Vite · React 19 · TypeScript · Tailwind v4 · shadcn/ui.

## Services (aucun branché pour l'instant — demander confirmation avant d'ajouter)
- Base de données + authentification : Supabase (retenu).
- Paiement : Lemon Squeezy (retenu). Aucune carte bancaire stockée chez nous.
- E-mails : Amazon SES ou customer.io (à décider).
- Hébergement : VPS Hostinger (à configurer : HTTPS, sauvegardes, pare-feu).
- API Wikipédia : plus tard, avec attribution des sources et respect des licences.

## Garde-fous — toujours demander AVANT de :
- toucher à l'authentification, aux comptes ou aux mots de passe ;
- toucher au paiement ;
- supprimer des données ou faire une action irréversible ;
- déployer en production ;
- ajouter un service externe ou une dépendance importante.

## Règles de travail
- Commits au format conventional commits : feat:, fix:, refactor:, docs:, chore:.
  Titres et messages en anglais dans le code et Git.
- Après chaque tâche terminée : indiquer précisément quoi tester à la main,
  comme un utilisateur.
- Annoncer le plan et attendre l'accord avant tout chantier important.
- Quand une ligne de ce fichier gêne l'utilisateur : proposer de la modifier,
  puis s'y tenir ensuite.
- Utiliser les outils en ligne de commande (CLI) pour se connecter aux services
  quand c'est possible. Toujours passer par l'écran d'autorisation : ne jamais
  demander de coller un mot de passe ou un jeton dans la conversation.
- Répondre en français courant, sans jargon non expliqué.
- L'utilisateur ne lit pas le code : il pilote le produit. Expliquer en mots simples.
- Au début d'une session : relire `docs/MEMOIRE.md`. En fin de session :
  le mettre à jour (décisions prises, état, à-faire).

## Ligne rouge sécurité
- Ne jamais écrire de secret (mot de passe, jeton, clé) dans ce fichier ni dans le code.
- Ne jamais stocker de carte bancaire : les paiements passent par Lemon Squeezy.

## Checklist de fin de tâche (avant d'annoncer « terminé »)
- Types OK : `npx tsc -b` sans erreur.
- Build OK : `npm run build` sans erreur (avec l'autorisation étendue si besoin).
- Serveur : un seul serveur dev actif sur http://localhost:5173/ et qui répond.
- Extension : `node --check` sur les fichiers modifiés, et rappeler de recharger
  l'extension si elle a été touchée.
- Commit : un commit conventional par lot de travail.
- Annoncer : quoi tester à la main, en français simple.

## Ce que l'utilisateur attend en retour (à chaque étape)
- Ce qui a été vérifié.
- Ce qui n'a pas pu être testé (avec les preuves disponibles).
- Les termes techniques expliqués en mots simples.
