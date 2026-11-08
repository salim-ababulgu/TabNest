# Filnest

Filnest conserve les pages web que vous visitez : chaque page a une durée de vie,
une raison de la garder (à décider, à finir, piste, à retenir), et se range dans
des étagères ou des projets. Les pages expirées vont dans les archives, où elles
peuvent être restaurées.

- Application web : https://filnest.pages.dev
- Extension Chrome (bêta, installation manuelle) : https://filnest.pages.dev/extension
- Interface en 4 langues : français, anglais, espagnol, chinois. Thème clair/sombre.

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # puis renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev                  # http://localhost:5173
```

## Construire et déployer

```bash
npm run build                 # application web (dossier dist/)
npm run package:extension     # archive de l'extension (public/downloads/)
npm run build:all             # les deux
npx wrangler pages deploy dist --project-name=tabnest --branch=main
```

## Extension

L'extension est dans `extension/`. Elle doit être rechargée (chrome://extensions)
après chaque modification, et pour Google, ajouter
`https://<extension-id>.chromiumapp.org/` dans Supabase →
Authentication → URL Configuration → Redirect URLs.

`extension/config.js` n'est pas versionné : `npm run package:extension` le génère
depuis `.env.local`, et `extension/config.example.js` sert de modèle.

## Base de données

Les migrations sont dans `supabase/migrations/` et doivent être appliquées
manuellement (SQL Editor ou `supabase db push`) :

1. `20261103120000_extension_link.sql` — liaison extension ↔ compte
2. `20261107000000_admin_stats.sql` — statistiques admin
3. `20261115000000_schema_pages_groups.sql` — tables pages/projets + RLS
4. `20261116000000_delete_account.sql` — suppression de compte par l'utilisateur

## Tests

```bash
# Les scripts utilisent un compte de démonstration défini par variables d'environnement
export TABNEST_DEMO_EMAIL=...
export TABNEST_DEMO_PASSWORD=...
node scripts/check-auth.mjs
node scripts/check-responsive.mjs
node scripts/check-extension.mjs   # charge réellement l'extension dans Chromium
node scripts/check-crud.mjs
node scripts/check-sites.mjs
node scripts/smoke-prod.mjs        # vérifie la production
```

## Structure

- `src/components/landing/` — page d'accueil (4 langues)
- `src/components/auth/` — connexion / inscription
- `src/components/dashboard/` — tableau de bord, navigation, étagères, listes
- `src/components/legal/` — pages légales et consentement
- `src/lib/` — données Supabase, validation, i18n, thème, export, alertes
- `extension/` — extension Chrome MV3 (capture, popup, import, pause)
- `supabase/migrations/` — schéma et fonctions SQL
- `scripts/` — tests Playwright, captures, packaging
- `docs/` — mémoire du projet et documents de référence

## Licence

Projet privé — aucun droit de réutilisation accordé sans autorisation.
