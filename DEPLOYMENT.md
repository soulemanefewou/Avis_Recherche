# 🚀 Guide de déploiement — Render (backend) & Vercel (frontend)

Ce document détaille **étape par étape** la mise en production de l'application :

| Composant | Plateforme | Technologie |
|---|---|---|
| API Symfony 7.4 | **Render** | Conteneur Docker (`backend/Dockerfile`) |
| Base de données | **Render** | MySQL *(payant)* ou PostgreSQL *(gratuit)* |
| Frontend Next.js 16 | **Vercel** | Déploiement natif Next.js |

```
                    ┌─────────────────────────────┐
   Utilisateur ───► │  Vercel — frontend Next.js  │
                    │  https://mon-site.vercel.app│
                    └──────────────┬──────────────┘
                                   │ proxy /api/* et /uploads/*
                                   ▼ (API_PROXY_TARGET)
                    ┌─────────────────────────────┐
                    │  Render — API Symfony       │
                    │  https://mon-api.onrender.com
                    └──────────────┬──────────────┘
                                   ▼
                    ┌─────────────────────────────┐
                    │  Render — Base de données   │
                    └─────────────────────────────┘
```

> 💡 **Pourquoi ce fonctionnement ?** Le navigateur n'appelle **jamais** l'API directement : tout passe par le domaine Vercel (rewrites dans `next.config.ts`). Aucune configuration CORS n'est nécessaire, et les photos sont servies en « même origine » (indispensable au partage WhatsApp via Web Share API).

---

## 📋 Sommaire

- [A. Backend sur Render](#a-backend-sur-render)
  - [A.1 Ce qui a été préparé](#a1-ce-qui-a-été-préparé)
  - [A.2 Créer la base de données](#a2-créer-la-base-de-données-sur-render)
  - [A.3 Générer les secrets localement](#a3-générer-les-secrets-localement)
  - [A.4 Créer le Web Service](#a4-créer-le-web-service-backend)
  - [A.5 Renseigner les variables d'environnement](#a5-variables-denvironnement-du-backend)
  - [A.6 Premier déploiement et vérifications](#a6-premier-déploiement-et-vérifications)
  - [A.7 Créer le compte Fondateur](#a7-créer-le-compte-fondateur)
- [B. Frontend sur Vercel](#b-frontend-sur-vercel)
  - [B.1 Importer le projet](#b1-importer-le-projet-sur-vercel)
  - [B.2 Variables d'environnement du frontend](#b2-variables-denvironnement-du-frontend)
  - [B.3 Déployer et vérifier](#b3-déployer-et-vérifier)
- [C. Firebase en production](#c-firebase-en-production)
- [D. Checklist finale](#d-checklist-de-vérification-finale)
- [E. Limites connues & conseils](#e-limites-connues--conseils)
- [F. Dépannage courant](#f-dépannage-courant)

---

# A. Backend sur Render

## A.1 Ce qui a été préparé

Le dépôt contient déjà tout le nécessaire :

| Fichier | Rôle |
|---|---|
| `backend/Dockerfile` | Image PHP 8.2 + Apache, extensions `pdo_mysql`/`pdo_pgsql`, build Composer prod |
| `backend/.dockerignore` | Exclut `vendor/`, `.env*`, `uploads/…` du contexte de build |
| `backend/.env.docker` | Valeurs par défaut **non secrètes** embarquées dans l'image (`APP_ENV=prod`, chemins JWT…) |
| `backend/docker/apache-site.conf` | Vhost Apache (DocumentRoot `public/`, front controller) |
| `backend/docker/start.sh` | Écrit les clés JWT / credentials Firebase depuis des variables base64, warmup du cache, Apache sur `$PORT` |
| `render.yaml` | Blueprint Render (service web + variables) |
| `backend/config/packages/framework.yaml` | `trusted_proxies` configuré (derrière les proxies Render) |
| `backend/config/services.yaml` | `app_base_url` piloté par la variable `APP_BASE_URL` |

## A.2 Créer la base de données sur Render

### Option A — MySQL (recommandée, zéro changement de code)

1. Dashboard Render → **New →** **MySQL**
2. Nom : `avis-recherche-db` ; région : la plus proche ; plan : *Basic* (à partir de ~6 $/mois — le gratuit n'existe pas pour MySQL)
3. Une fois créée, récupérez les **External Database URL** / informations de connexion.
4. Construisez votre `DATABASE_URL` :

```
mysql://UTILISATEUR:MOT_DE_PASSE@HOST:3306/NOM_BASE?serverVersion=8&charset=utf8mb4
```

> Les migrations existantes ont été générées pour MariaDB/MySQL : elles fonctionneront telles quelles.

### Option B — PostgreSQL (gratuit, avec adaptation)

1. Dashboard Render → **New →** **PostgreSQL** → plan *Free*
2. ⚠️ Les migrations actuelles contiennent du SQL spécifique MySQL (`AUTO_INCREMENT`, moteur InnoDB). Avec PostgreSQL :
   - changez le driver dans l'URL : `postgresql://user:pass@host/db`
   - **ne lancez pas** les migrations existantes ; créez le schéma initial via un Shell Render :
     ```bash
     php bin/console doctrine:schema:update --force --complete
     ```
   - pour la suite, régénérez vos migrations après avoir basculé la connexion locale sur PostgreSQL.

> 💡 Pour un projet de démonstration/défense, l'option B est entièrement gratuite. Pour une mise en production sérieuse, préférez l'option A.

## A.3 Générer les secrets localement

À faire **une seule fois**, sur votre machine (le dossier `backend` doit contenir les clés JWT déjà générées ; sinon : `php bin/console lexik:jwt:generate-keypair`).

### Clés JWT en base64 (PowerShell)

```powershell
cd backend
[Convert]::ToBase64String([IO.File]::ReadAllBytes("config/jwt/private.pem")) | Set-Clipboard   # → JWT_SECRET_KEY_B64
[Convert]::ToBase64String([IO.File]::ReadAllBytes("config/jwt/public.pem"))  | Set-Clipboard   # → JWT_PUBLIC_KEY_B64
```

### APP_SECRET

```powershell
# 32+ caractères aléatoires
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 40 | % {[char]$_}) | Set-Clipboard
```

### Credentials Firebase (optionnel — notifications push)

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("var/secrets/avis-recherche-app-firebase-adminsdk-fbsvc-xxxx.json")) | Set-Clipboard   # → FIREBASE_CREDENTIALS_JSON_B64
```

Conservez ces valeurs, elles seront collées dans Render à l'étape A.5.

## A.4 Créer le Web Service (backend)

1. Poussez d'abord le dépôt à jour sur GitHub (`render.yaml` inclus).
2. Dashboard Render → **New →** **Blueprint** → sélectionnez le dépôt `Avis_Recherche`.
   Render lit `render.yaml` et propose automatiquement le service `avis-recherche-api`.
   *(Alternative sans Blueprint : New → Web Service → runtime **Docker** → Root Directory `backend`.)*
3. Plan : **Free** pour tester (voir limites §E), **Starter** pour un usage suivi.
4. Avant de cliquer sur **Apply**, ouvrez la section *Environment Variables* et complétez les variables marquées « sync: false » (tableau ci-dessous).

## A.5 Variables d'environnement du backend

| Variable | Valeur | Obligatoire |
|---|---|---|
| `APP_SECRET` | Chaîne aléatoire ≥ 32 caractères (étape A.3) | ✅ |
| `DATABASE_URL` | URL construite en A.2 | ✅ |
| `JWT_PASSPHRASE` | La passphrase de vos clés JWT locales (celle de `backend/.env`) | ✅ |
| `JWT_SECRET_KEY_B64` | Base64 de `private.pem` (étape A.3) | ✅ |
| `JWT_PUBLIC_KEY_B64` | Base64 de `public.pem` (étape A.3) | ✅ |
| `APP_ENV` / `APP_DEBUG` / `TRUSTED_PROXIES` | Déjà définies par `render.yaml` (`prod` / `0` / `*`) | auto |
| `APP_BASE_URL` | Laisser vide : déduite automatiquement de `RENDER_EXTERNAL_URL` par `start.sh` | auto |
| `FIREBASE_PROJECT_ID` | `avis-recherche-app` | push |
| `FIREBASE_CREDENTIALS_JSON_B64` | Base64 du JSON admin SDK (étape A.3) | push |

> ℹ️ `RENDER_EXTERNAL_URL` est injectée automatiquement par Render — c'est elle qui permet aux URLs des photos renvoyées par l'API d'être correctes (`https://votre-api.onrender.com/uploads/...`).

## A.6 Premier déploiement et vérifications

1. Cliquez sur **Apply** / **Create Web Service** — le build Docker démarre (~5–10 min).
2. À chaque déploiement, la commande `preDeployCommand` exécute automatiquement :
   ```
   php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration
   ```
   → la base est migrée avant la mise en ligne. *(Option PostgreSQL : voir remarque §A.2-B.)*
3. Vérifiez les **Logs** du service : vous devez voir le warmup puis `Apache écoute sur le port …`.
4. Testez le health check public : `https://votre-api.onrender.com/api/regions` doit renvoyer un JSON de régions.

> 🔁 Chaque `git push` sur `main` redéploie automatiquement le backend (`autoDeploy: true`).

## A.7 Créer le compte Fondateur

Depuis le dashboard Render → votre service → onglet **Shell** :

```bash
php bin/console app:create-admin
# Suivez les invites (choisissez le rôle FONDATEUR)
```

---

# B. Frontend sur Vercel

## B.1 Importer le projet sur Vercel

1. Connectez-vous sur https://vercel.com avec votre compte GitHub.
2. **Add New → Project** → importez le dépôt `soulemanefewou/Avis_Recherche`.
3. Configuration du build :
   - **Framework Preset** : *Next.js* (détecté automatiquement)
   - **Root Directory** : `frontend` ← important, le monorepo contient aussi le backend
   - Build command / Output : laissés par défaut
4. Ne déployez pas encore : ouvrez **Environment Variables** d'abord (§B.2), puis cliquez **Deploy**.

## B.2 Variables d'environnement du frontend

| Variable | Valeur | Portées |
|---|---|---|
| `API_PROXY_TARGET` | `https://votre-api.onrender.com` (l'URL Render de l'étape A.4) | Server |
| `NEXT_PUBLIC_API_URL` | `https://votre-api.onrender.com` | Client + Server |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Depuis la console Firebase | Client |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `votre-projet.firebaseapp.com` | Client |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `avis-recherche-app` | Client |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `votre-projet.appspot.com` | Client |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Depuis la console Firebase | Client |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Depuis la console Firebase | Client |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Console Firebase → Cloud Messaging → *Web Push certificates* | Client |

> ℹ️ `API_PROXY_TARGET` remplace le `http://127.0.0.1:8000` local dans les rewrites `/api/*` et `/uploads/*`. Elle est **côté serveur uniquement** (pas de fuite vers le navigateur).

## B.3 Déployer et vérifier

1. **Deploy** → le site est disponible sur `https://<projet>.vercel.app`.
2. Chaque `git push` sur `main` redéploie le frontend automatiquement.
3. Domaine personnalisé (optionnel) : *Settings → Domains*.

---

# C. Firebase en production

Pour que les notifications push fonctionnent depuis le site déployé :

1. **Console Firebase → Authentication → Settings → Authorized domains** : ajoutez `https://<projet>.vercel.app` si vous utilisez aussi l'authentification Firebase.
2. **Cloud Messaging → Web Push certificates** : générez une paire de clés VAPID (si pas déjà fait) → copiez la clé publique dans `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
3. Côté backend : renseignez `FIREBASE_PROJECT_ID` et `FIREBASE_CREDENTIALS_JSON_B64` sur Render (§A.5).
4. Le service worker est servi par le frontend : `https://<projet>.vercel.app/firebase-messaging-sw.js`.

---

# D. Checklist de vérification finale

Après les deux déploiements, testez dans l'ordre :

- [ ] `GET https://<api>.onrender.com/api/regions` → JSON (health check OK)
- [ ] Connexion depuis le site Vercel avec le compte Fondateur (§A.7)
- [ ] Page d'accueil : les avis s'affichent **avec leurs photos**
- [ ] Détail d'un avis → bouton WhatsApp : la photo s'attache (mobile) ou le texte se préremplit
- [ ] Partage Facebook : l'aperçu affiche photo + description (testez sur https://developers.facebook.com/tools/debug/)
- [ ] Déclaration d'une disparition avec upload photo → visible immédiatement
- [ ] Envoi d'un indice → notification reçue par le propriétaire de l'avis
- [ ] Notifications push navigateur autorisées et reçues

---

# E. Limites connues & conseils

| Sujet | Situation | Recommandation |
|---|---|---|
| **Mise en veille (plan Free)** | L'API Render gratuite s'endort après ~15 min d'inactivité ; premier appel lent (~30–60 s) | Plan *Starter*, ou « ping » périodique (cron externe type UptimeRobot) |
| **Disque éphémère** | Sur Render, le système de fichiers est réinitialisé à chaque redéploiement/redémarrage → **les photos uploadées disparaissent** | Ajouter un **Disk** persistant (Settings → Disks, monté sur `/var/www/html/public/uploads`, plan payant), ou migrer vers du stockage objet (S3, Cloud Storage) |
| **PostgreSQL gratuit** | Expire/suspendu selon la politique Render du moment | Sauvegardez vos données ; MySQL payant = plus fiable |
| **Cron « suivi quotidien »** | La commande `app:suivi-quotidien` ne tourne pas seule | Render → New → **Cron Job** (image Docker du backend, même variables) avec la commande `php bin/console app:suivi-quotidien`, planifiée une fois par jour |
| **Secrets** | Jamais dans git | Tout passe par les dashboards Render/Vercel ; rotation possible à tout moment (redéploiement requis) |

---

# F. Dépannage courant

| Symptôme | Cause probable | Correction |
|---|---|---|
| Build Docker échoue à `composer install` | Lock obsolète | `composer update` localement puis commit `composer.lock` |
| Le service redémarre en boucle / 502 au démarrage | Variable manquante (`APP_SECRET`, `DATABASE_URL`, JWT…) | Vérifiez les logs Runtime → toutes les variables du tableau A.5 doivent être présentes |
| `Bad credentials` alors que le mot de passe est bon | Clés JWT absentes ou `JWT_PASSPHRASE` incorrecte | Re-vérifiez `JWT_*_B64` (base64 complet, sans retour à la ligne) et la passphrase |
| Les photos ne s'affichent pas | `APP_BASE_URL` incorrecte | Elle doit valoir l'URL publique Render ; laissez `start.sh` la déduire de `RENDER_EXTERNAL_URL` |
| Erreur SQL à la première migration sur PostgreSQL | Migrations générées pour MySQL | Voir option B du §A.2 (`doctrine:schema:update --force --complete`) |
| `504 / timeout` sur Vercel lors d'un appel API | L'API Render gratuite sortait de veille | Réessayez (réveil) ; envisagez le plan Starter |
| Les notifications push n'arrivent pas | VAPID manquante côté front ou credentials Firebase absents côté back | §C : vérifiez `NEXT_PUBLIC_FIREBASE_VAPID_KEY` et `FIREBASE_CREDENTIALS_JSON_B64` |
| Le partage Facebook n'affiche pas l'image | Cache OG de Facebook | Re-scrapper via l'outil *Sharing Debugger* après avoir vidé son cache |

---

## 🔗 Récapitulatif des fichiers liés au déploiement

```
Avis_Recherche/
├── render.yaml                     # Blueprint Render (backend)
├── DEPLOYMENT.md                   # Ce guide
├── .gitattributes                  # Fins de ligne LF (scripts shell)
└── backend/
    ├── Dockerfile                  # Image de production
    ├── .dockerignore               # Contexte de build allégé
    ├── .env.docker                 # Défauts prod non secrets (embarqués dans l'image)
    ├── .env.example                # Documentation des variables
    └── docker/
        ├── apache-site.conf        # Vhost Apache (port dynamique $PORT)
        └── start.sh                # Secrets → fichiers, warmup cache, démarrage
```
