# TabNest — Déploiement

> **État : site en ligne sur https://tabnest-alb.pages.dev** (Cloudflare Pages, projet `tabnest`,
> déployé depuis le poste local avec `wrangler pages deploy dist`). À chaque nouveau build :
> `npm run build` puis `npx wrangler pages deploy dist --project-name=tabnest --branch=main`.

> Objectif : mettre TabNest en ligne sur une vraie URL, pour que de vrais utilisateurs puissent le tester.
> Ce document compare deux options et donne les étapes exactes.

## 1. Faut-il un VPS ?

**Réponse courte : non, pas maintenant.**

TabNest est une **application statique** (Vite → HTML/CSS/JS) qui parle directement à **Supabase**
(base de données, authentification, sécurité par compte). Il n'y a **aucun serveur applicatif** à
faire tourner : pas d'API maison, pas de base locale, pas de fichiers uploadés.

Un VPS, lui, impose :
- un coût mensuel (5–15 €/mois) ;
- de la **maintenance** : mises à jour de sécurité, redémarrages, sauvegardes, certificats ;
- des **risques** : un serveur mal configuré est une porte ouverte (SSH, pare-feu, mises à jour) ;
- du temps que tu ne passes pas sur le produit.

Un hébergement **statique gratuit** fait exactement le même travail, sans maintenance.

### Quand un VPS deviendrait intéressant
- Tu veux héberger **ton propre envoi d'e-mails** (serveur SMTP) — mais Amazon SES est plus fiable.
- Tu as besoin d'un **serveur applicatif** (jobs planifiés, traitement lourd, API maison).
- Tu veux **tout contrôler** (souveraineté, données, réseau).
En attendant, **Supabase Edge Functions** couvre les webhooks et tâches planifiées.

## 2. Ce dont on a besoin pour mettre en ligne

| Élément | Où |
|---|---|
| Le site (build Vite) | hébergement statique |
| Base de données + authentification | Supabase (déjà en place) |
| Variables d'environnement | tableaux de bord de l'hébergeur |
| Domaine | optionnel au début (sous-domaine gratuit) |
| Extension | Chrome Web Store (étape séparée) |

**Variables à renseigner chez l'hébergeur :**
```
VITE_SUPABASE_URL=https://kgrkujedgqsmdlltzyzs.supabase.co
VITE_SUPABASE_ANON_KEY=<clé anon>
VITE_LS_CHECKOUT_PLUS=<lien Lemon Squeezy, optionnel>
VITE_LS_CHECKOUT_PRO=<lien Lemon Squeezy, optionnel>
```
> La clé `anon` est publique par nature (elle est visible dans le navigateur). La clé `service_role`
> ne doit **jamais** être exposée côté client.

**Réécriture SPA** : l'application utilise de vraies URL (`/confidentialite`, `/extension`…). Il faut
que l'hébergeur renvoie `index.html` pour toute route inconnue. Le fichier `public/_redirects`
(`/* /index.html 200`) couvre **Netlify** et **Cloudflare Pages**.

## 3. Option A (recommandée) — Cloudflare Pages, Netlify ou Vercel

### Étapes communes
1. Pousser le code sur GitHub (déjà fait : `salim-ababulgu/TabNest`).
2. Créer un compte sur l'hébergeur et importer le dépôt.
3. Réglages de build :
   - Commande : `npm run build`
   - Dossier de sortie : `dist`
   - Node : 20 ou 22
4. Ajouter les **variables d'environnement** ci-dessus.
5. Déployer → une URL `https://tabnest-xxx.pages.dev` (ou `netlify.app`, `vercel.app`) est fournie.
6. Tester : page d'accueil, `/extension`, `/confidentialite`, connexion Google, inscription.
7. Ajouter un **domaine** plus tard (DNS chez le registrar, certificat automatique).

### Spécificités
- **Cloudflare Pages** : gratuit, rapide, `_redirects` géré, domaine gratuit possible.
- **Netlify** : `_redirects` géré, formulaire d'environnement clair.
- **Vercel** : `_redirects` non lu → ajouter `vercel.json` :
  `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`

## 4. Après la mise en ligne — à ne pas oublier

1. **Supabase → Authentication → URL Configuration** :
   - Site URL : `https://<ton-domaine>`
   - Redirect URLs : `https://<ton-domaine>/**`
   - Le compte Google fonctionne alors aussi en production.
2. **Extension** : mettre à jour l'URL de l'application dans l'extension (popup + lien) et le
   `host_permissions` si besoin.
3. **Conformité** (voir `docs/CONFORMITE.md`) : purge `pg_cron`, identité de l'éditeur, relecture
   juridique.
4. **Domaine + e-mails** : Amazon SES pour les e-mails de service.

## 5. Option B — VPS Hostinger (seulement si tu y tiens)

> ⚠️ Non recommandé à ce stade. Coût mensuel + maintenance + sécurité à ta charge.

Si tu choisis quand même cette voie (Ubuntu 24.04) :

```bash
# 1. Sécurité de base
apt update && apt upgrade -y
adduser tabnest && usermod -aG sudo tabnest
ufw allow OpenSSH && ufw enable
apt install -y fail2ban unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades   # mises à jour auto

# 2. Nginx + certificat
apt install -y nginx certbot python3-certbot-nginx
# /etc/nginx/sites-available/tabnest :
#   server {
#     server_name tabnest.fr;
#     root /var/www/tabnest;
#     index index.html;
#     location / { try_files $uri $uri/ /index.html; }
#   }
ln -s /etc/nginx/sites-available/tabnest /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d tabnest.fr

# 3. Déploiement des fichiers statiques
# copier le contenu de dist/ dans /var/www/tabnest
# chown -R www-data:www-data /var/www/tabnest

# 4. Sauvegardes (base = Supabase ; ici : fichiers + config)
# cron quotidien : tar des fichiers + config nginx
```

**Ce que tu devras gérer en plus** : mises à jour du système, surveillance (uptime), sauvegardes,
rotation des logs, renouvellement du certificat (automatique avec certbot), et la sécurité SSH
(clés uniquement, pas de mot de passe).

## 6. Décision proposée

1. **Maintenant** : déployer sur **Cloudflare Pages** (gratuit) pour avoir une URL et tester avec de
   vrais utilisateurs.
2. **Ensuite** : domaine, Chrome Web Store, e-mails SES.
3. **Plus tard, seulement si besoin** : VPS (ou reste en statique + Edge Functions).
