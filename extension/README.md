# Extension TabNest Capture

Capture automatiquement les pages que vous visitez et permet de les ranger directement, sans ouvrir le site.

## Installation (Chrome / Edge)

1. Ouvrez `chrome://extensions` (ou `edge://extensions`).
2. Activez le **Mode développeur** (en haut à droite).
3. Cliquez sur **Charger l'extension non empaquetée**.
4. Sélectionnez ce dossier `extension`.
5. Épinglez l'extension, cliquez sur son icône, puis connectez-vous avec votre compte TabNest.

## Connexion

Deux possibilités, directement dans l'extension :

- **Continuer avec Google** (aucun passage par le site) ;
- **e-mail + mot de passe**.

### Réglage Supabase nécessaire pour Google

Dans Supabase → **Authentication → URL Configuration → Redirect URLs**, ajoutez :

```
https://<identifiant-de-l-extension>.chromiumapp.org/
```

L'identifiant s'affiche sur `chrome://extensions` (ou dans l'erreur renvoyée par l'extension). Sans cette autorisation, Google refusera la redirection.

## Utilisation

- Chaque page ouverte est enregistrée automatiquement (une visite comptée, durée de vie prolongée).
- **Ranger en deux clics** : cliquez sur l'icône de l'extension, puis sur **À retenir**, **À finir**, **Piste** ou **À décider**. Si la page n'est pas encore capturée, l'extension la capture d'abord, puis l'enregistre.
- **Épingler / Désépingler** : conservation sans limite.
- **Projet** : range la page dans l'un de vos projets (ou « Aucun projet »).
- **Capturer cette page** : force la capture de l'onglet courant.
- **Ouvrir TabNest** : accède au tableau de bord complet (facultatif).

## Configuration

`config.js` contient l'adresse Supabase et la clé publique (`anon`). Ce fichier est local et ignoré par Git.

## Mode pause

Le bouton **Pause** suspend **toute activité automatique** (capture, fermeture d'onglets expirés) **sans désactiver l'extension** : elle reste installée et visible (badge ⏸), pour ne jamais oublier de la réactiver. Les actions manuelles (rangement, épingle, import) restent disponibles.

## Langues et synchronisation

Le popup existe en **FR / EN / ES / 中文**. La langue choisie dans l'extension est **écrite sur le site** (et inversement) : le content script applique la langue au site ouvert, et le site remonte ses changements à l'extension. La synchronisation passe par `chrome.storage` et un évènement `tabnest:lang` / `tabnest:lang-changed`.

## CRUD dans l'extension

- **Créer** : capture automatique, « Capturer cette page », import historique/favoris.
- **Lire** : titre + domaine de l'onglet, état de la page, projets, compteur.
- **Mettre à jour** : étagère (À retenir / À finir / Piste / À décider), épingle, projet.
- **Supprimer / restaurer** : « Retirer de TabNest » (archivage doux, la page reste dans les archives du site) et « Restaurer dans TabNest » pour une page archivée.

Le formulaire de connexion valide l'e-mail par expression régulière et impose 6 caractères minimum ; le bouton reste désactivé tant que tout n'est pas valide. Le popup suit le mode clair/sombre du système et affiche des squelettes pendant le chargement.

## Permissions

- `tabs`, `storage` : lire l'adresse/titre de l'onglet actif et stocker la session.
- `identity` : connexion Google dans l'extension.
- `history`, `bookmarks` : **permissions optionnelles**, demandées uniquement au moment de l'import (vous pouvez refuser).
- `alarms` : fermeture automatique des onglets expirés (désactivable, mode Pause).
- Script de contenu : lit les métadonnées de la page (titre, icône, image de partage), **jamais son contenu**.

## Fichiers

- `manifest.json` : manifeste MV3 (permissions `tabs`, `storage`, `identity`).
- `background.js` : capture, session (rafraîchissement), connexion Google, rangement.
- `popup.html` / `popup.js` / `popup.css` : interface de connexion et de rangement.
- `content.js` / `page-meta.js` : métadonnées lues sur la page (jamais son contenu).
