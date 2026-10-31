# Extension TabNest Capture

Capture automatiquement les pages que vous visitez pour les envoyer à votre compte TabNest.

## Installation (Chrome / Edge)

1. Ouvrez `chrome://extensions` (ou `edge://extensions`).
2. Activez le **Mode développeur** (en haut à droite).
3. Cliquez sur **Charger l'extension non empaquetée**.
4. Sélectionnez ce dossier `extension`.
5. Épinglez l'extension, cliquez sur son icône, puis connectez-vous avec votre compte TabNest.

## Fonctionnement

- Chaque page que vous ouvrez est enregistrée automatiquement (une visite comptée, durée de vie prolongée).
- Les pages apparaissent dans l'application TabNest.
- Le bouton **« Capturer cette page »** force la capture de l'onglet courant.

## Configuration

`config.js` contient l'adresse Supabase et la clé publique (`anon`). Ce fichier est local et ignoré par Git.
