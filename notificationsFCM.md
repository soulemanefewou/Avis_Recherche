# Brancher les vraies identifiants Firebase pour les Push Notifications FCM

## Contexte

L'API backend est prete a recevoir des tokens FCM (Firebase Cloud Messaging) pour envoyer des
notifications push aux utilisateurs. Ce document explique comment connecter vos vrais
identifiants Firebase afin d'activer l'envoi de notifications push reelles.

---

## Etape 1 : Creer un projet Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquer sur **"Creer un projet"** (ou ajouter un projet a un projet existant)
3. Nommer le projet (ex: `avis-recherche-app`)
4. Desactiver Google Analytics si non necessaire, puis cliquer **"Creer le projet"**

---

## Etape 2 : Configurer Firebase Cloud Messaging

### Pour une application Web :

1. Dans la console Firebase, cliquer sur l'icone **Web** (`</>`)
2. Nommer l'application (ex: `avis-recherche-web`)
3. Cocher **"Configurer Firebase Hosting"** si besoin (optionnel)
4. Cliquer **"Enregistrer"**
5. Copier la configuration Firebase (objet `firebaseConfig`) qui ressemble a :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "avis-recherche-app.firebaseapp.com",
  projectId: "avis-recherche-app",
  storageBucket: "avis-recherche-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX",
};
```

### Pour une application mobile (Android/iOS) :

1. Suivre les etapes de configuration dans Firebase Console
2. Pour Android : ajouter le fichier `google-services.json` dans `android/app/`
3. Pour iOS : ajouter le fichier `GoogleService-Info.plist` dans `ios/Runner/`

---

## Etape 3 : Generer la cle de compte de service (Service Account)

Cette cle est necessaire pour que le backend puisse envoyer des notifications push.

1. Dans Firebase Console, aller dans **Parametres du projet** (engrenage)
2. Onglet **"Comptes de service"**
3. Cliquer **"Generer une nouvelle cle privee"**
4. Confirmer et telecharger le fichier JSON (ex: `avis-recherche-firebase-sdk.json`)

**IMPORTANT** : Ce fichier contient des secrets. Ne jamais le committer dans Git.

---

## Etape 4 : Placer le fichier de configuration dans le backend

### Option A : Variable d'environnement (Recommande)

1. Placer le fichier JSON dans un chemin secure sur le serveur
   ex: `/var/secrets/avis-recherche-firebase-sdk.json`

2. Ajouter dans le fichier `.env` du backend :

```env
###> firebase ###
FIREBASE_CREDENTIALS=/var/secrets/avis-recherche-firebase-sdk.json
FIREBASE_PROJECT_ID=avis-recherche-app
###< firebase ###
```

### Option B : Variable d'environnement inline (Pour le developpement)

Copier le contenu entier du fichier JSON et le mettre dans `.env` :

```env
FIREBASE_CREDENTIALS='{"type":"service_account","project_id":"avis-recherche-app","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@...iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token",...}'
```

---

## Etape 5 : Installer la dependance Firebase dans le backend Symfony

```bash
composer require kreait/firebase-php
```

C'est la bibliotheque PHP officielle/non-officielle la plus utilisee pour interagir avec Firebase.

---

## Etape 6 : Creer le Service Firebase dans le backend

### Creer `src/Service/FirebaseService.php` :

```php
<?php

namespace App\Service;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Kreait\Firebase\ServiceAccount;

class FirebaseService
{
    private $messaging;

    public function __construct()
    {
        $serviceAccount = ServiceAccount::fromFile(
            $_ENV['FIREBASE_CREDENTIALS'] ?? '%env(FIREBASE_CREDENTIALS)%'
        );

        $factory = (new Factory)
            ->withServiceAccount($serviceAccount)
            ->withProjectId($_ENV['FIREBASE_PROJECT_ID'] ?? '');

        $this->messaging = $factory->createMessaging();
    }

    /**
     * Envoyer une notification push a un utilisateur via son token FCM
     */
    public function sendPushNotification(
        string $fcmToken,
        string $title,
        string $body,
        array $data = []
    ): void {
        $notification = Notification::create($title, $body);

        $message = CloudMessage::withTarget('token', $fcmToken)
            ->withNotification($notification)
            ->withData($data);

        $this->messaging->send($message);
    }

    /**
     * Envoyer une notification push a plusieurs utilisateurs
     */
    public function sendBulkPushNotification(
        array $fcmTokens,
        string $title,
        string $body,
        array $data = []
    ): void {
        $notification = Notification::create($title, $body);

        $message = CloudMessage::new()
            ->withNotification($notification)
            ->withData($data);

        $this->messaging->sendMulticast($message, $fcmTokens);
    }
}
```

---

## Etape 7 : Ajouter un champ FCM token a l'entite Utilisateur

### Migration :

```bash
php bin/console make:migration
```

Modifier la migration generee pour ajouter :

```php
$this->addSql('ALTER TABLE utilisateur ADD fcm_token VARCHAR(500) DEFAULT NULL');
```

### Entite `Utilisateur.php` :

Ajouter la propriete :

```php
#[ORM\Column(length: 500, nullable: true)]
private ?string $fcmToken = null;
```

Ajouter les getters/setters :

```php
public function getFcmToken(): ?string
{
    return $this->fcmToken;
}

public function setFcmToken(?string $fcmToken): static
{
    $this->fcmToken = $fcmToken;
    return $this;
}
```

---

## Etape 8 : Creer un endpoint pour enregistrer le token FCM

### Ajouter dans `ProfileController.php` :

```php
#[Route('/api/profile/fcm-token', name: 'api_register_fcm_token', methods: ['POST'])]
public function registerFcmToken(Request $request): JsonResponse
{
    $data = json_decode($request->getContent(), true);
    $token = $data['token'] ?? null;

    if (!$token) {
        return ApiResponse::error('Token FCM manquant.', Response::HTTP_BAD_REQUEST);
    }

    $utilisateur = $this->getUser();
    $utilisateur->setFcmToken($token);
    $this->entityManager->flush();

    return ApiResponse::success(null, 'Token FCM enregistre avec succes.');
}
```

---

## Etape 9 : Integrer les push notifications dans le flux existant

Modifier `NotificationService` pour envoyer une push notification en plus de la notification in-app :

```php
public function create(
    Utilisateur $utilisateur,
    string $titre,
    string $contenu,
    NotificationType $type
): array {
    // ... creation de la notification in-app existante ...

    // Envoyer la push notification si le token existe
    if ($utilisateur->getFcmToken()) {
        try {
            $this->firebaseService->sendPushNotification(
                $utilisateur->getFcmToken(),
                $titre,
                $contenu,
                ['type' => $type->value]
            );
        } catch (\Exception $e) {
            // Logger l'erreur sans bloquer la creation de la notification
        }
    }

    return $this->notificationMapper->toArray($notification);
}
```

---

## Etape 10 : Cote Frontend - Enregistrer le token FCM

### Installation (Next.js / React) :

```bash
npm install firebase
```

### Configuration `lib/firebase.ts` :

```typescript
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export function getMessagingInstance() {
  if (typeof window !== "undefined") {
    return getMessaging(app);
  }
  return null;
}

export async function requestFcmToken(): Promise<string | null> {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    return token;
  } catch (error) {
    console.error("Erreur lors de l'obtention du token FCM:", error);
    return null;
  }
}
```

### Variables d'environnement a ajouter dans `.env.local` du frontend :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=avis-recherche-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=avis-recherche-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=avis-recherche-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BN... (cle VAPID depuis Firebase Console > Cloud Messaging > Certificats)
```

### Envoyer le token au backend apres connexion :

```typescript
import { requestFcmToken } from "@/lib/firebase";
import api from "@/lib/api"; // instance axios avec JWT

export async function registerFcmTokenAfterLogin(): Promise<void> {
  const token = await requestFcmToken();
  if (token) {
    await api.post("/api/profile/fcm-token", { token });
  }
}
```

---

## Etape 11 : Generer la cle VAPID

1. Dans Firebase Console, aller dans **Parametres du projet** > **Cloud Messaging**
2. Dans la section **"Clles du certificat Web Push"**, generer une paire de cles
3. Copier la cle publique VAPID et la mettre dans `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

---

## Recapitulatif des etapes

| Etape | Action | Fichier/Service |
|-------|--------|-----------------|
| 1 | Creer projet Firebase | Firebase Console |
| 2 | Configurer FCM | Firebase Console |
| 3 | Generer Service Account | Firebase Console |
| 4 | Placer le fichier JSON | `.env` du backend |
| 5 | Installer `kreait/firebase-php` | `composer.json` |
| 6 | Creer `FirebaseService` | `src/Service/FirebaseService.php` |
| 7 | Ajouter `fcmToken` a Utilisateur | Entity + Migration |
| 8 | Endpoint `/api/profile/fcm-token` | `ProfileController.php` |
| 9 | Integrer push dans `NotificationService` | `NotificationService.php` |
| 10 | Enregistrer token FCM cote frontend | `lib/firebase.ts` |
| 11 | Generer cle VAPID | Firebase Console |

---

## Notes importantes

- **Ne jamais exposer** le fichier `service-account.json` dans un depot Git
- Les tokens FCM expirent : prevoir un mecanisme de refresh cote frontend
- En developpement, Firebase fonctionne sans HTTPS mais en production HTTPS est **obligatoire**
- La librairie `kreait/firebase-php` necessite PHP 8.1+ (compatible avec le projet)
- Les notifications push ne fonctionnent que si l'utilisateur a accepte les notifications dans son navigateur
