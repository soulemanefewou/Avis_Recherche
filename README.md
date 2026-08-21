# 🔍 Avis de Recherche — Plateforme d'Investigation Citoyenne & Publique

Application **full-stack** d'utilité publique dédiée à la recherche de personnes disparues au Cameroun.
Elle permet aux **citoyens** de déclarer une disparition et de transmettre des indices, aux **commissariats** de publier des avis officiels, et aux **administrateurs** de modérer l'ensemble — le tout avec messagerie privée sécurisée, notifications push temps réel et partage social (WhatsApp / Facebook).

---

## 📑 Table des matières

1. [Fonctionnalités principales](#-1-fonctionnalités-principales)
2. [Stack technique](#-2-stack-technique)
3. [Architecture générale](#-3-architecture-générale)
4. [Modélisation des données](#-4-modélisation-des-données)
5. [Sécurité & rôles](#-5-sécurité--rôles)
6. [Backend — arborescence & rôle des fichiers](#-6-backend--arborescence--rôle-des-fichiers)
7. [API REST — endpoints](#-7-api-rest--endpoints)
8. [Frontend — arborescence & rôle des fichiers](#-8-frontend--arborescence--rôle-des-fichiers)
9. [Notifications push Firebase (FCM)](#-9-notifications-push-firebase-fcm)
10. [Partage social WhatsApp / Facebook](#-10-partage-social-whatsapp--facebook)
11. [Installation & lancement](#-11-installation--lancement)
12. [Commandes console utiles](#-12-commandes-console-utiles)

---

## ✨ 1. Fonctionnalités principales

| Domaine | Fonctionnalités |
|---|---|
| **Avis de recherche** | Déclaration citoyenne (avec pièces justificatives), avis officiels commissariat, photos multiples avec photo principale, recherche/filtres (région, sexe, mot-clé), pagination |
| **Cycle de vie d'un avis** | Brouillon → En attente de validation → Recherche → Retrouvé vivant / décédé → Clôturée ; rejet motivé possible |
| **Signalements (indices)** | Témoignage avec lieu, date/heure d'observation, photo/vidéo/pièce jointe, urgence, masquage par modération |
| **Messagerie privée** | Conversation 1-to-1 témoin ↔ propriétaire de l'avis (ou commissariat), messages système, signalement de message abusif |
| **Notifications** | Cloche in-app (16 types d'événements) + notifications push navigateur via Firebase Cloud Messaging |
| **Suivi quotidien** | Rappel quotidien « La personne a-t-elle été retrouvée ? » pour chaque avis citoyen actif |
| **Comptes & rôles** | Inscription citoyenne, demande d'accréditation commissariat (avec document), gestion utilisateurs/super-admins par le Fondateur, désactivation/réactivation de compte |
| **Partage social** | Boutons WhatsApp (photo attachée via Web Share API) et Facebook (aperçu enrichi Open Graph) sur les fiches et cartes |
| **Géographie** | Référentiel régions/villes du Cameroun pré-chargé (seed) |

---

## 🧰 2. Stack technique

| Couche | Technologie |
|---|---|
| Frontend | **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS v4**, Axios, lucide-react, date-fns |
| Backend | **Symfony 7.4** (PHP ≥ 8.2), **Doctrine ORM 3**, **Doctrine Migrations** |
| Authentification | **JWT** via `lexik/jwt-authentication-bundle` |
| Notifications push | **Firebase Cloud Messaging** (`kreait/firebase-php` côté serveur, SDK JS côté client) |
| Base de données | **MySQL / MariaDB** (configurable via `DATABASE_URL`) |
| Fichiers | Stockage disque `backend/public/uploads/` (photos d'avis, justificatifs, signalements) |

---

## 🏗️ 3. Architecture générale

Architecture **découplée** : le frontend Next.js consomme une API REST JSON sécurisée par JWT.

```
┌────────────────────────────────────────────────────────────┐
│                 Client Next.js (port 3000)                  │
│   Pages App Router · Contexte Auth · Composants UI          │
│   rewrites: /api/* et /uploads/* → backend (proxy dev)      │
└─────────────────────────────┬──────────────────────────────┘
                              │ JSON + Authorization: Bearer <JWT>
┌─────────────────────────────▼──────────────────────────────┐
│                    API REST Symfony 7 (port 8000)           │
│  Controller → Service (règles métier) → Repository (DQL)    │
│  DTO (entrée) · Mapper (sortie) · EventListener (erreurs)   │
└──────────────┬──────────────────────────────┬──────────────┘
               │ Doctrine ORM                 │ HTTP
┌──────────────▼──────────────┐   ┌───────────▼──────────────┐
│     MySQL / MariaDB         │   │  Firebase Cloud Messaging │
│  avis_recherche (14 tables) │   │  (notifications push)     │
└─────────────────────────────┘   └──────────────────────────┘
```

**Points clés du flux :**

1. Le client stocke le JWT dans `localStorage` et l'attache à chaque requête via un **intercepteur Axios**.
2. Toute réponse API est enveloppée dans `{ "success": bool, "data": ... }` (classe `ApiResponse`).
3. Les erreurs métier (exceptions PHP personnalisées) sont converties en réponses JSON propres par `ApiExceptionListener`.
4. En développement, `next.config.ts` **proxifie** `/api/:path*` et `/uploads/:path*` vers `http://127.0.0.1:8000` — le frontend n'appelle donc jamais le backend en cross-origin.

---

## 🗃️ 4. Modélisation des données

### 4.1 Vue d'ensemble des relations

```
                        ┌───────────────┐
                        │    Region     │
                        └───┬───────┬───┘
                     1:N ┌──┘       └──┐ 1:N
                ┌────────▼───┐     ┌───▼────────┐
                │    Ville   │     │ Commissariat│◄──── 1:1 ─── Utilisateur (agent)
                └──┬──────┬──┘     └───┬────────┘
              1:N  │      │ 1:N        │ 1:N
        ┌──────────▼──┐ ┌─▼────────────▼───┐
        │AvisRecherche│ │  AvisOfficiel    │      (héritage SINGLE_TABLE,
        │ (abstraite) │ │  extends ...     │       discriminant: type)
        └──┬───┬───┬──┘ └───┬──────────────┘
           │   │   │        │ CITOYEN → AvisCitoyen (auteur, validation,
     1:N ──┘   │   └───┐    │          justificatifs, suiviActif)
   ┌───────┐ ┌─▼────────▼─┐ ┌▼──────────────┐
   │ Photo │ │Signalement │ │ Justificatif  │
   └───────┘ └─────┬──────┘ └───────────────┘
                   │ ManyToOne Utilisateur (témoin)
        ┌──────────▼───────────┐        ┌──────────────┐
        │     Conversation     │ 1:N ─► │    Message    │
        │ (createurSignalement,│        │ (auteur, lu,  │
        │  proprietaireAvis)   │        │  signalePar?) │
        └──────────────────────┘        └──────────────┘

   Utilisateur ──1:N──► Notification (titre, contenu, type, lu)
   Utilisateur ──1:N──► CommissariatDemande (statut EN_ATTENTE/VALIDE/REJETE)
```

### 4.2 Description détaillée des entités (`backend/src/Entity/`)

#### `AvisRecherche` (abstraite) — le cœur du domaine
Entité parente utilisant l'**héritage Doctrine `SINGLE_TABLE`** : une seule table `avis_recherche` avec une colonne discriminante `type` (`OFFICIEL` → `AvisOfficiel`, `CITOYEN` → `AvisCitoyen`). Cela permet de manipuler tous les avis de façon uniforme (recherche, filtres, affichage public) tout en gardant les spécificités dans les classes filles.

- **Identité de la personne disparue** : `nom`, `prenom`, `sexe` (enum `Sexe` : HOMME/FEMME), `ageApprox`, `description` physique (texte obligatoire), `circonstances` ?, `tenueVestimentaire` ?, `signesParticuliers` ?, `taille` ?, `poids` ?
- **Disparition** : `dateDisparition`, `dernierLieuVu`, `telephone` de contact
- **État** : `statut` (enum `AvisStatut`), `actif` (archivage logique), `createdAt` / `updatedAt`
- **Localisation** : `region` et `ville` (ManyToOne obligatoires)
- **Collections** : `photos` (1:N, cascade remove + orphanRemoval), `signalements` (1:N), `conversations` (1:N)

#### `AvisOfficiel extends AvisRecherche`
Publié directement par un **commissariat** authentifié. Champ additionnel : `commissariat` (ManyToOne). Visible publiquement dès publication.

#### `AvisCitoyen extends AvisRecherche`
Déclaré par un **citoyen** (proche de la personne disparue). Champs additionnels :
- `auteur` (ManyToOne `Utilisateur`)
- `validationStatut` (enum `ValidationStatut`, défaut `EN_ATTENTE`) — un **Super Admin** doit valider avant publication publique
- `dateValidation` ?, `motifRejet` ? (si rejeté)
- `suiviActif` (bool) — active le rappel quotidien
- `piecesJustificatives` (1:N `Justificatif`) — preuves de la disparition

#### `Utilisateur`
Tout compte de la plateforme (citoyen, agent, super admin, fondateur). Implémente `UserInterface` + `PasswordAuthenticatedUserInterface`.
- `nom`, `prenom`, `email` (**unique**), `telephone` (regex camerounaise `^(?:\+237)?[26][0-9]{8}$`), `password` (hashé)
- `photoProfil` ?, `lieuResidence` ?, `region` ? (nullable, `SET NULL`)
- `roles` (JSON) : `ROLE_USER`, `ROLE_COMMISSARIAT`, `ROLE_SUPER_ADMIN`, `ROLE_FONDATEUR`
- `actif` (bool) — un compte désactivé est bloqué à la connexion par le *user checker*
- `fcmToken` ? — token Firebase pour les notifications push
- Relations inverses : `avisCitoyens`, `signalements`, `conversationsCreees` / `conversationsRecues`, `messages`, `messagesSignales`, `commissariat` (1:1 inverse), `notifications`, `demandesCommissariat`

#### `Commissariat`
Unité officielle habilitée à publier des avis officiels.
- `nom`, `adresse`, `telephone`, `email`, `responsable`, `actif`
- `utilisateur` (**OneToOne**, cascade persist/remove) — le compte agent rattaché
- `region` + `ville` (obligatoires), `avisOfficiels` (1:N)

#### `CommissariatDemande`
Demande d'accréditation déposée publiquement (POST sans authentification) par une unité souhaitant rejoindre la plateforme.
- Champs du futur commissariat + `documentPath` / `documentNomOriginal` (justificatif officiel uploadé)
- `statut` (`ValidationStatut` : EN_ATTENTE → VALIDE/REJETE), `motifRejet` ?, `traiteLe` ?
- À la validation par un Super Admin : création effective du `Commissariat` + notification à l'utilisateur

#### `Signalement`
Indice/témoignage soumis par un citoyen sur un avis.
- `description` (10–2000 caractères), `lieu`, `dateObservation`, `heureObservation` ?
- `telephoneContact` ?, `commentaireSupplementaire` ?
- Pièces facultatives : `photo` ?, `video` ?, `pieceJointe` ? (chemins relatifs)
- `urgent` (bool), `statut` (`SignalementStatut` : PUBLIE / MASQUE / EN_ATTENTE)
- `utilisateur` (témoin) et `avisRecherche` (ManyToOne obligatoires)

#### `Conversation`
Fil privé entre le **témoin** (`createurSignalement`) et le **propriétaire de l'avis** (`proprietaireAvis`), rattachée à un `avisRecherche`.
- Contrainte d'unicité `(avis_recherche_id, createur_signalement_id, proprietaire_avis_id)` → une seule conversation par trio
- `statut` (`ConversationStatut` : ACTIVE / LECTURE_SEULE / ARCHIVEE), `type` (`ConversationType` : PROCHE_TEMOIN / ADMIN_AUTEUR / COMMISSARIAT_TEMOIN)
- `lastMessageAt` pour le tri des boîtes de réception, `messages` (1:N, orphanRemoval)

#### `Message`
Message dans une conversation.
- `contenu` (texte), `lu` (défaut false), `type` (`MessageType` : USER ou SYSTEM — messages système insérés automatiquement à l'ouverture de la conversation)
- `conversation` + `auteur` (ManyToOne), `signalePar` ? (utilisateur ayant signalé ce message comme abusif)

#### `Photo`
Photo d'un avis. `nomOriginal`, `nomFichier` (UUID généré), `chemin`, `mimeType`, `taille`, `estPrincipale` (une seule par avis), `avisRecherche` (ManyToOne).

#### `Justificatif`
Pièce justificative d'un avis citoyen. `type` (`JustificatifType` : CARTE_IDENTITE, PHOTO_AVEC_DISPARU, ACTE_NAISSANCE, DOCUMENT_COMMISSARIAT), mêmes champs fichier que `Photo`, lié à `avisCitoyen`.

#### `Region` / `Ville`
Référentiel géographique. `Region` : `nom` + `code` (ex. CE pour Centre). `Ville` : `nom` + `region`. Une région possède plusieurs villes, commissariats et avis ; chaque ville appartient à une région.

#### `Notification`
Alerte in-app destinée à un utilisateur : `titre`, `contenu`, `type` (enum `NotificationType`, 16 cas), `lu` (défaut false), `createdAt`.

### 4.3 Énumérations (`backend/src/Enum/`)

| Enum | Valeurs | Rôle |
|---|---|---|
| `AvisStatut` | BROUILLON, RECHERCHE, RETROUVE_VIVANT, RETROUVE_DECEDE, RECHERCHE_CLOTUREE, EN_ATTENTE_VALIDATION, RETROUVE_EN_ATTENTE_CONFIRMATION, REJETE | Cycle de vie d'un avis (+ helpers `label()` et `color()`) |
| `AvisType` | OFFICIEL, CITOYEN | Discriminant de l'héritage |
| `Sexe` | MASCULIN (HOMME), FEMININ (FEMME) | Sexe de la personne disparue |
| `ValidationStatut` | EN_ATTENTE, VALIDE, REJETE | Modération des avis citoyens et demandes commissariat |
| `SignalementStatut` | EN_ATTENTE, PUBLIE, MASQUE | Visibilité d'un témoignage |
| `ConversationStatut` | ACTIVE, LECTURE_SEULE, ARCHIVEE | État d'une conversation |
| `ConversationType` | PROCHE_TEMOIN, ADMIN_AUTEUR, COMMISSARIAT_TEMOIN | Nature des interlocuteurs |
| `MessageType` | SYSTEM, USER | Message auto vs message humain |
| `NotificationType` | MESSAGE, SIGNALEMENT, SIGNALEMENT_URGENT, AVIS_PUBLIE, AVIS_STATUT, AVIS_REJETE, AVIS_EN_ATTENTE, NOUVEL_AVIS_REGION, AVIS_A_VALIDER, SUIVI_QUOTIDIEN, DEMANDE_VALIDATION, CONFIRMATION_RETROUVE, MESSAGE_SIGNALE, COMPTE_DESACTIVE, COMPTE_REACTIVE, SYSTEM | Typage fin des alertes (icônes/couleurs côté front) |
| `JustificatifType` | CARTE_IDENTITE, PHOTO_AVEC_DISPARU, ACTE_NAISSANCE, DOCUMENT_COMMISSARIAT | Nature d'une pièce jointe |

---

## 🔐 5. Sécurité & rôles

Configuration : `backend/config/packages/security.yaml`

### 5.1 Authentification JWT
- **Connexion** : `POST /api/login` (firewall `json_login`, champs `email` / `password`). En cas de succès, le handler Lexik renvoie `{ token, refresh_token? }`.
- Le JWT est ensuite envoyé en en-tête `Authorization: Bearer <token>` sur toutes les routes protégées.
- Mots de passe hashés avec l'algorithme `auto` (bcrypt/argon2 selon disponibilité).

### 5.2 Hiérarchie des rôles

```
ROLE_FONDATEUR  ⊃  ROLE_SUPER_ADMIN  ⊃  [ROLE_USER, ROLE_COMMISSARIAT]  ⊃  ROLE_USER
```

Un Fondateur hérite donc de tous les pouvoirs ; un Super Admin hérite des droits utilisateur + commissariat.

### 5.3 Contrôle d'accès par URL (`access_control`)

| Route | Accès |
|---|---|
| `/api/login`, `/api/register` | Public |
| `POST /api/commissariat-demandes` | Public (dépôt de demande) |
| `GET /api/regions`, `GET /api/avis-recherches` | Public (consultation) |
| `/api/fondateur/**` | `ROLE_FONDATEUR` |
| `/api/super-admin/**`, `/api/admin/**` | `ROLE_SUPER_ADMIN` |
| `/api/commissariat/**` | `ROLE_COMMISSARIAT` |
| Tout le reste de `/api/**` | `IS_AUTHENTICATED_FULLY` |

### 5.4 Blocage des comptes désactivés
- `App\Security\CompteChecker` (implémente `UserCheckerInterface`, branché via `user_checker:`) vérifie `actif` **avant** l'authentification complète.
- Si le compte est désactivé, il lève `CompteDesactiveException` (étend `CustomUserMessageAccountStatusException`) → le client reçoit **401** avec le message explicite *« Votre compte a été désactivé par le fondateur… »* plutôt qu'un générique « Bad credentials ».
- Le fondateur peut désactiver/réactiver un compte (`PATCH /api/fondateur/utilisateurs/{id}/desactiver|reactiver`) ; chaque action génère une notification `COMPTE_DESACTIVE` / `COMPTE_REACTIVE`.

### 5.5 Autorisations fines (couche Service)
`AuthorizationService` centralise les règles métier : accès à une conversation, édition d'un avis, suppression de photo, validation d'avis (réservée aux Super Admins/Fondateurs), masquage de signalement, etc. Toute violation lève une exception métier convertie en JSON par l'écouteur d'exceptions.

---

## ⚙️ 6. Backend — arborescence & rôle des fichiers

```
backend/
├── bin/console                      # Console Symfony (CLI)
├── composer.json / composer.lock    # Dépendances PHP (Symfony 7.4, Doctrine, Lexik JWT, Kreait Firebase)
├── compose.yaml / compose.override.yaml  # Docker Compose (services dev)
├── symfony.lock                     # Verrou des recettes Symfony Flex
├── config/
│   ├── packages/
│   │   ├── framework.yaml           # Cœur du framework (sessions, validation…)
│   │   ├── doctrine.yaml            # Connexion ORM (via DATABASE_URL)
│   │   ├── doctrine_migrations.yaml # Config des migrations
│   │   ├── security.yaml            # Firewalls, rôles, access_control (cf. §5)
│   │   ├── lexik_jwt_authentication.yaml  # Clés/TTL des tokens JWT
│   │   ├── routing.yaml, validator.yaml, cache.yaml, property_info.yaml
│   ├── routes/                      # Chargement des routes (attributs PHP)
│   ├── routes.yaml, services.yaml   # Routing global & injection de dépendances
│   └── reference.php, preload.php   # Référence config & preloading PHP
├── migrations/                      # Historique versionné du schéma SQL (9 migrations)
├── public/
│   ├── index.php                    # Point d'entrée HTTP unique (front controller)
│   └── uploads/                     # Fichiers servis statiquement (IGNORÉS par git :
│                                    #   avis-recherches/{id}/, justificatifs/, signalements/)
├── var/                             # Cache, logs (ignoré)
├── vendor/                          # Dépendances Composer (ignoré)
└── src/
    ├── Kernel.php                   # Bootstrap de l'application
    ├── Controller/                  # ← Endpoints REST (cf. §7)
    ├── Service/                     # ← Logique métier
    ├── Entity/                      # ← Entités Doctrine (cf. §4)
    ├── Repository/                  # ← Requêtes DQL personnalisées
    ├── DTO/                         # ← Objets d'entrée typés + validation
    ├── Mapper/                      # ← Sérialisation entité → tableau JSON
    ├── Enum/                        # ← Énumérations PHP 8.1 (cf. §4.3)
    ├── Security/                    # ← User checker + exceptions d'authentification
    ├── Exception/                   # ← Exceptions métier (404, 403, fichiers…)
    ├── EventListener/               # ← Conversion exceptions → réponses JSON
    ├── Response/                    # ← Enveloppe standard ApiResponse
    ├── Factory/                     # ← Fabriques de requêtes (signalements)
    └── Command/                     # ← Commandes console artisan-like
```

### 6.1 Contrôleurs (`src/Controller/`) — 16 fichiers

| Fichier | Préfixe | Rôle |
|---|---|---|
| `SecurityController.php` | `/api/login` | Point de contrôle du firewall JSON (retourne le JWT) |
| `AuthController.php` | `/api/register` | Inscription citoyenne (validation DTO + hash mot de passe) |
| `ProfileController.php` | `/api/profile` | Profil courant (GET/PUT) + enregistrement/suppression du token FCM |
| `RegionController.php` | `/api/regions` | Liste des régions et de leurs villes (public) |
| `AvisRechercheController.php` | `/api/avis-recherches` | Création avis citoyen, listing/recherche public, détail, mise à jour, archivage, validation, déclaration de retrouvé |
| `PhotoController.php` | `/api/avis-recherches/{id}/photos` | Upload/liste/suppression de photos, définition de la photo principale |
| `SignalementController.php` | `/api/signalements`, `/api/avis-recherches/{id}/signalements` | Upload média, création de témoignage, listes publique/privée, contact témoin, masquage, suppression |
| `ConversationController.php` | `/api/conversations` | Listing des conversations de l'utilisateur, création (après signalement), détail |
| `MessageController.php` | `/api/conversations/{id}/messages` | Envoi/liste des messages, lecture, signalement d'abus, suppression |
| `NotificationController.php` | `/api/notifications` | Listing, compteur non-lues, marquage lu, suppression |
| `CommissariatDemandeController.php` | `/api/commissariat-demandes` | Dépôt public de demande d'accréditation (+ consultation) |
| `CommissariatController.php` | `/api/commissariat` | Espace agent : profil, CRUD avis officiels, publication, signalements reçus, dashboard, statistiques |
| `SuperAdminController.php` | `/api/super-admin` | Dashboard global, CRUD commissariats, validation demandes & avis citoyens, confirmation retrouvés, modération (signalements, messages, conversations, avis) |
| `FondateurController.php` | `/api/fondateur` | Gestion des comptes : liste/détail/édition, changement de rôles, désactivation/réactivation, CRUD super-admins |

### 6.2 Services (`src/Service/`) — la logique métier

| Service | Responsabilité |
|---|---|
| `AuthService` | Inscription (création compte, hash, rôles par défaut) |
| `AuthorizationService` | Toutes les règles d'autorisation fine (10 méthodes `ensureXxx` / `isXxx`) |
| `AvisRechercheService` | Cycle de vie complet des avis : création citoyen/officiel, recherche filtrée, mise à jour, validation, déclaration retrouvé, archivage, hydratation des réponses |
| `SignalementService` | Upload de médias, création de témoignages (+ notification au propriétaire), listes publique/privée, masquage |
| `PhotoService` | Upload (UUID, validation type/taille), photo principale unique, suppression fichier+entité |
| `JustificatifService` | Upload des pièces justificatives des avis citoyens |
| `ConversationService` | Création idempotente (contrainte d'unicité), accès restreint aux deux participants, passage en lecture seule/archivage |
| `MessageService` | Envoi (+ notification push/in-app), marquage lu, signalement d'abus, suppression |
| `NotificationService` | **31 méthodes** : création/persistance de notifications in-app + déclenchement push FCM pour chaque événement métier (nouvel avis régional, signalement urgent, validation requise, suivi quotidien, compte désactivé…) |
| `FirebaseService` | Envoi effectif des pushes via `kreait/firebase-php` (mono ou bulk), dégradation silencieuse si non configuré |
| `ProfileService` | Lecture/mise à jour du profil utilisateur |
| `RegionService` | Référentiel régions/villes |
| `CommissariatDemandeService` | Dépôt, listing, validation (→ création du commissariat + attribution du rôle) et rejet motivé |

### 6.3 DTO (`src/DTO/`) — objets d'entrée validés
Chaque endpoint d'écriture reçoit un DTO contraint par `#[Assert\...]` (jamais l'entité brute) :

`RegisterUserDTO`, `CreateAvisRechercheDTO`, `CreateAvisOfficielDTO`, `UpdateAvisRechercheDTO`, `SearchAvisRechercheDTO` (filtres région/sexe/q/page), `ValidateAvisCitoyenDTO`, `DeclareRetrouveDTO`, `UpdateProfileDTO`, `CreateConversationDTO`, `CreateMessageDTO`, `SignalementDTO`, `CreateCommissariatDemandeDTO`, plus le sous-espace `DTO/Request/` (`CreateMessageRequest`, `CreateSignalementRequest`, `MessageRequestFactory`) qui normalise les payloads hétérogènes.

### 6.4 Mappers (`src/Mapper/`)
Sérialisation contrôlée entité → tableau JSON (jamais de groupes de sérialisation implicites) :
`AvisRechercheMapper` (inclut photos, ville/région, auteur/commissariat selon le type), `PhotoMapper`, `SignalementMapper`, `ConversationMapper`, `MessageMapper`, `NotificationMapper`.

### 6.5 Sécurité, exceptions & infrastructure

| Fichier | Rôle |
|---|---|
| `src/Security/CompteChecker.php` | Bloque la connexion des comptes `actif = false` |
| `src/Security/Exception/CompteDesactiveException.php` | Exception 401 avec message clair (étend `CustomUserMessageAccountStatusException`) |
| `src/Exception/*.php` | 11 exceptions métier typées (introuvable, accès refusé, fichier trop volumineux, type invalide, quota photos atteint…) |
| `src/EventListener/ApiExceptionListener.php` | Intercepte ces exceptions et produit des réponses JSON cohérentes (`{success:false, message}`) |
| `src/Response/ApiResponse.php` | Fabrique l'enveloppe uniforme `{success, data|message}` de toutes les réponses |
| `src/Factory/SignalementRequestFactory.php` | Construit les requêtes de signalement depuis les DTO |

---

## 🌐 7. API REST — endpoints

> Toutes les routes sont préfixées `/api`. Réponses enveloppées `{ success, data }`. Auth JWT sauf mention « public ».

### Authentification & profil
| Méthode | Route | Description |
|---|---|---|
| POST | `/api/login` | Connexion → JWT *(public)* |
| POST | `/api/register` | Inscription citoyen *(public)* |
| GET / PUT | `/api/profile` | Profil courant / mise à jour |
| POST / DELETE | `/api/profile/fcm-token` | Enregistrer / retirer le token push |

### Avis de recherche
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/avis-recherches?q=&region=&sexe=&page=` | Listing public filtré + paginé *(public)* |
| GET | `/api/avis-recherches/{id}` | Détail d'un avis *(public)* |
| POST | `/api/avis-recherches` | Créer un avis citoyen (avec justificatifs) |
| GET | `/api/avis-recherches/mes-avis` | Mes avis (auteur connecté) |
| PUT | `/api/avis-recherches/{id}` | Mettre à jour (auteur ou modérateur) |
| PATCH | `/api/avis-recherches/{id}/archive` | Archiver |
| POST | `/api/avis-recherches/{id}/valider` | Valider un avis citoyen *(super admin)* |
| POST | `/api/avis-recherches/{id}/declarer-retrouve` | Déclarer retrouvé vivant/décédé |

### Photos
| Méthode | Route | Description |
|---|---|---|
| POST / GET | `/api/avis-recherches/{id}/photos` | Uploader / lister |
| DELETE | `/api/photos/{id}` | Supprimer |
| PATCH | `/api/photos/{id}/principale` | Définir comme principale |

### Signalements
| Méthode | Route | Description |
|---|---|---|
| POST | `/api/signalements/photo` | Upload média de témoignage |
| POST | `/api/avis-recherches/{id}/signalements` | Soumettre un indice |
| GET | `/api/avis-recherches/{id}/signalements/public` | Indices publics de l'avis *(public)* |
| GET | `/api/avis-recherches/{id}/signalements` | Indices complets (propriétaire/modération) |
| POST | `/api/signalements/{id}/contacter` | Ouvrir une conversation avec le témoin |
| PATCH | `/api/signalements/{id}/masquer` | Masquer (modération) |
| DELETE | `/api/signalements/{id}` | Supprimer |

### Messagerie & notifications
| Méthode | Route | Description |
|---|---|---|
| GET / POST | `/api/conversations` | Mes conversations / créer |
| GET | `/api/conversations/{id}` | Détail + messages |
| POST / GET | `/api/conversations/{id}/messages` | Envoyer / lister |
| PATCH | `/api/messages/{id}/read` · POST `.../signaler` · DELETE `/api/messages/{id}` | Lu / signaler / supprimer |
| GET | `/api/notifications` · `/unread/count` | Boîte + compteur |
| PATCH | `/api/notifications/{id}/read` | Marquer lue |

### Espaces privilégiés
- **`/api/commissariat/**`** : profil agent, CRUD + publication des avis officiels, signalements reçus (masquer/démasquer), dashboard, statistiques.
- **`/api/super-admin/**`** : dashboard global, CRUD commissariats, validation/rejet des demandes d'accréditation et des avis citoyens, confirmation des retrouvés, modération complète (signalements, messages signalés, conversations, avis).
- **`/api/fondateur/**`** : gestion des utilisateurs (rôles, désactivation/réactivation) et CRUD des super-admins.

---

## 💻 8. Frontend — arborescence & rôle des fichiers

```
frontend/
├── package.json                     # Scripts & dépendances (next 16, react 19, axios, firebase…)
├── next.config.ts                   # Rewrites proxy /api + /uploads → :8000 ; images localhost:8000
├── eslint.config.mjs                # Configuration ESLint (flat config)
├── postcss.config.mjs               # PostCSS + Tailwind v4
├── tsconfig.json                    # Alias @/* → src/*
├── .env.local                       # NEXT_PUBLIC_API_URL + NEXT_PUBLIC_FIREBASE_* (non versionné)
├── public/                          # Assets statiques (icônes SVG)
└── src/
    ├── app/                         # ═══ APP ROUTER ═══
    │   ├── layout.tsx               # Layout racine : AuthProvider, Navbar, Footer,
    │   │                            #   EmergencyCTA, bannière numéros d'urgence (17/112)
    │   ├── globals.css              # Design system sombre (#0b0f17), tokens Tailwind v4
    │   ├── page.tsx                 # ACCUEIL : hero, filtres (recherche/région/sexe),
    │   │                            #   grille d'avis avec boutons de partage compacts, pagination
    │   ├── login/page.tsx           # Connexion JWT
    │   ├── register/page.tsx        # Choix du type de compte
    │   ├── register/user/page.tsx   # Formulaire d'inscription citoyenne (région optionnelle)
    │   ├── profile/page.tsx         # Profil utilisateur (infos + région de résidence)
    │   ├── notifications/page.tsx   # Cloche : liste, icônes/couleurs par NotificationType
    │   ├── regions/page.tsx         # Annuaire régions → villes (accordéons)
    │   ├── avis/
    │   │   ├── create/page.tsx      # Déclaration de disparition (form + justificatifs)
    │   │   └── [id]/
    │   │       ├── page.tsx         # SERVER COMPONENT : generateMetadata → balises OG
    │   │       │                    #   (og:image = photo principale) pour partages Facebook/WhatsApp
    │   │       ├── avis-detail.tsx  # CLIENT : fiche complète, signalements publics, partage,
    │   │       │                    #   modal indice (?report=true), déclaration retrouvé
    │   │       ├── edit/page.tsx    # Édition de l'avis
    │   │       └── photos/page.tsx  # Gestion des photos (upload, principale, suppression)
    │   ├── conversations/           # Messagerie : liste + fil [id]
    │   ├── suivi-quotidien/[id]/    # Réponse au rappel quotidien (« retrouvé ? »)
    │   ├── commissariat-demande/    # Demande d'accréditation (document justificatif)
    │   ├── admin/                   # ESPACE FONDATEUR (garde ROLE_FONDATEUR)
    │   │   ├── page.tsx             # Dashboard fondateur + validation avis/demandes
    │   │   ├── users/page.tsx       # Gestion utilisateurs (rôles, désactivation/réactivation)
    │   │   └── super-admins/page.tsx# CRUD des super-admins
    │   ├── super-admin/             # ESPACE SUPER ADMIN
    │   │   ├── page.tsx             # Dashboard global (stats, graphiques par région)
    │   │   ├── avis/page.tsx        # Modération des avis citoyens
    │   │   ├── commissariats/page.tsx # CRUD commissariats + demandes
    │   │   ├── moderation/page.tsx  # Signalements, messages signalés
    │   │   └── conversations/page.tsx # Supervision & clôture
    │   └── commissariat/            # ESPACE AGENT DE COMMISSARIAT
    │       ├── page.tsx             # Dashboard agent
    │       ├── avis/                # Liste, création, fiche [id], édition, photos
    │       ├── signalements/page.tsx# Indice reçus sur mes avis
    │       ├── statistiques/page.tsx# Statistiques du commissariat
    │       ├── profil/page.tsx      # Profil + mot de passe
    │       └── conversations/page.tsx
    │
    ├── components/                  # ═══ COMPOSANTS ═══
    │   ├── Navbar.tsx               # Navigation translucide + badge notifications non lues
    │   ├── Footer.tsx               # Pied de page (liens, mentions)
    │   ├── EmergencyCTA.tsx         # Bouton d'urgence flottant (appel direct)
    │   ├── DeclarerDisparitionModal.tsx  # Assistant multi-étapes de déclaration rapide
    │   ├── AvisShareButtons.tsx     # Partage WhatsApp (Web Share API + photo) & Facebook ;
    │   │                            #   variante compact (icônes) pour les cartes d'accueil
    │   └── ui/                      # Primitives réutilisables : Button, Card, Input, Select,
    │                                #   Badge (statuts d'avis), Modal, EmptyState,
    │                                #   LoadingSpinner, PageHeader, Avatar
    │
    └── lib/                         # ═══ SERVICES TRANSVERSES ═══
        ├── api.ts                   # Instance Axios : baseURL relative (proxy Next),
        │                            #   interceptor JWT (localStorage) + logout auto sur 401
        ├── auth-context.tsx         # Contexte React : user/token, login, register, logout,
        │                            #   refreshUser (/api/profile), init push FCM
        ├── firebase.ts              # SDK Firebase Messaging : permission, token VAPID,
        │                            #   enregistrement côté backend, écoute foreground
        └── types.ts                 # Interfaces TS miroir des entités/API (User, AvisRecherche…)
```

### Conventions notables
- **Pages serveur vs client** : seules les pages nécessitant des métadonnées dynamiques (fiche avis) sont des Server Components ; le reste est `'use client'`.
- **Proxy de développement** : le frontend appelle `/api/...` en relatif ; `next.config.ts` transfère vers Symfony — aucun CORS à gérer en local, et les images `/uploads/...` passent par la même origine (indispensable pour la Web Share API).
- **Garde par rôle** : chaque espace (admin, super-admin, commissariat) vérifie `user.roles` côté client et redirige sinon.

---

## 🔔 9. Notifications push Firebase (FCM)

```
┌──────────┐  1. permission + getToken(vapidKey)   ┌──────────────┐
│ Navigateur│ ────────────────────────────────────► │ firebase.ts  │
└──────────┘                                       └──────┬───────┘
        ▲                          2. POST /api/profile/fcm-token   │
        │                                 ┌─────────────────────────▼──┐
        │  5. affichage (foreground)      │ Utilisateur.fcmToken (BDD) │
        │  onForegroundMessage()          └─────────────┬──────────────┘
        │                                               │ 3. événement métier
        │                                 ┌─────────────▼──────────────┐
        └─────────────────────────────────│ NotificationService         │
                                          │  → Notification (in-app)    │
                                          │  → FirebaseService          │
                                          │     sendPushNotification()  │
                                          └─────────────┬──────────────┘
                                                        │ 4. HTTP v1 FCM
                                                ┌───────▼────────┐
                                                │ Google Firebase │
                                                └────────────────┘
```

- Le service worker `firebase-messaging-sw.js` est servi via `src/app/firebase-messaging-sw.js/route.ts`.
- Chaque notification est **doublée** : ligne en base (cloche in-app) + push navigateur si un `fcmToken` existe.
- La commande `app:suivi-quotidien` (cron) exploite ce canal pour le rappel quotidien.

---

## 📤 10. Partage social WhatsApp / Facebook

Composant unique : `frontend/src/components/AvisShareButtons.tsx` (utilisé sur la fiche publique, la fiche commissariat et en variante compacte sur les cartes d'accueil).

**WhatsApp**
1. Télécharge la photo principale (URL même origine via le proxy `/uploads`, repli sur l'URL absolue).
2. Si le navigateur supporte les fichiers (`navigator.canShare({files})`) → `navigator.share({ files, text, url })` : WhatsApp s'ouvre avec **la photo déjà attachée** et le texte prérempli.
3. Sinon (desktop) → repli `https://api.whatsapp.com/send?text=…` (texte + lien).

**Facebook**
- Lien `sharer.php?u=<url>&quote=<message>` ; l'image provient des **balises Open Graph** générées par `generateMetadata` dans `frontend/src/app/avis/[id]/page.tsx` (`og:title`, `og:description` complet, `og:image` = photo principale servie même origine, canonical, twitter card).

Le message partagé contient : identité, âge, date de disparition, dernier lieu vu, **ville, région, description physique** et numéro de contact.

---

## 🚀 11. Installation & lancement

### Prérequis
- PHP **≥ 8.2** + Composer
- Node.js **≥ 18** + npm
- MySQL / MariaDB (base `avis_recherche`)
- (Optionnel) Projet Firebase pour les notifications push

### Backend

```bash
cd backend
composer install

# 1. Variables d'environnement (.env) — valeurs minimales :
#    DATABASE_URL="mysql://root:PASSWORD@127.0.0.1:3306/avis_recherche?serverVersion=12.3.2-MariaDB&charset=utf8mb4"
#    JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
#    JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
#    JWT_PASSPHRASE=...
#    FIREBASE_CREDENTIALS=%kernel.project_dir%/var/secrets/firebase-adminsdk.json   (optionnel)

# 2. Clés JWT (une fois)
php bin/console lexik:jwt:generate-keypair

# 3. Base de données
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate

# 4. Données de référence (10 régions + villes du Cameroun)
php bin/console app:seed-regions-villes

# 5. Serveur de développement
symfony server:start --port=8000
#    ou : php -S localhost:8000 -t public
```

> ⚠️ `.env`, `.env.dev` et `public/uploads/` sont **ignorés par git** (secrets + données personnelles) : recréez-les localement.

### Frontend

```bash
cd frontend
npm install

# .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
# NEXT_PUBLIC_FIREBASE_APP_ID=...
# NEXT_PUBLIC_FIREBASE_VAPID_KEY=...

npm run dev
```

Application disponible sur **http://localhost:3000** (l'API est proxifiée automatiquement).

---

## 🛠️ 12. Commandes console utiles

| Commande | Description |
|---|---|
| `php bin/console app:create-admin` | Créer un compte avec rôle administrateur (FONDATEUR, SUPER_ADMIN ou COMMISSARIAT) |
| `php bin/console app:seed-regions-villes` | Charger le référentiel régions/villes du Cameroun |
| `php bin/console app:suivi-quotidien` | Envoyer le rappel quotidien « La personne a-t-elle été retrouvée ? » (à planifier en cron) |
| `php bin/console app:test-push <email>` | Envoyer une notification push de test à un utilisateur |
| `php bin/console doctrine:migrations:migrate` | Appliquer les migrations |
| `php bin/console lexik:jwt:generate-keypair` | Générer le couple de clés JWT |

---

## 👥 Rôles utilisateurs — récapitulatif

| Rôle | Peut faire |
|---|---|
| **Visiteur** | Consulter les avis publics, filtrer, voir les indices publics, partager |
| **Citoyen (ROLE_USER)** | Déclarer une disparition (avec justificatifs), suivre ses avis, envoyer des indices, discuter en privé, recevoir les notifications |
| **Agent commissariat (ROLE_COMMISSARIAT)** | Publier/gérer les avis officiels de son unité, consulter et modérer les indices reçus, contacter les témoins, statistiques |
| **Super Admin (ROLE_SUPER_ADMIN)** | Valider/rejeter avis citoyens et demandes d'accréditation, gérer les commissariats, confirmer les retrouvés, modérer tout le contenu |
| **Fondateur (ROLE_FONDATEUR)** | Tout le Super Admin + gestion des comptes (rôles, désactivation/réactivation) et des super-admins |
