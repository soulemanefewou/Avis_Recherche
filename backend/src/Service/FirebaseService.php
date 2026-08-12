<?php

namespace App\Service;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class FirebaseService
{
    private ?Messaging $messaging = null;

    public function __construct(
        private readonly string $credentials,
        private readonly string $projectId,
        private readonly string $projectDir,
    ) {
    }

    public function isConfigured(): bool
    {
        $credentials = $this->resolveCredentials();

        if ($credentials === '') {
            return false;
        }

        if ($this->isInlineJson($credentials)) {
            return true;
        }

        return is_file($credentials);
    }

    /**
     * Envoyer une notification push a un utilisateur via son token FCM.
     */
    public function sendPushNotification(
        string $fcmToken,
        string $title,
        string $body,
        array $data = []
    ): void {
        $message = CloudMessage::withTarget('token', $fcmToken)
            ->withNotification(Notification::create($title, $body))
            ->withData($data);

        $this->messaging()->send($message);
    }

    /**
     * Envoyer une notification push a plusieurs utilisateurs (par lots de 500).
     */
    public function sendBulkPushNotification(
        array $fcmTokens,
        string $title,
        string $body,
        array $data = []
    ): void {
        $message = CloudMessage::new()
            ->withNotification(Notification::create($title, $body))
            ->withData($data);

        foreach (array_chunk($fcmTokens, 500) as $chunk) {
            $this->messaging()->sendMulticast($message, $chunk);
        }
    }

    private function messaging(): Messaging
    {
        if ($this->messaging !== null) {
            return $this->messaging;
        }

        $credentials = $this->resolveCredentials();

        if ($credentials === '') {
            throw new \RuntimeException('Les identifiants Firebase ne sont pas configurés.');
        }

        $factory = new Factory();

        if ($this->isInlineJson($credentials)) {
            $factory = $factory->withServiceAccount(json_decode($credentials, true, 512, JSON_THROW_ON_ERROR));
        } else {
            $factory = $factory->withServiceAccount($credentials);
        }

        if ($this->projectId !== '') {
            $factory = $factory->withProjectId($this->projectId);
        }

        return $this->messaging = $factory->createMessaging();
    }

    private function resolveCredentials(): string
    {
        $credentials = $this->credentials;

        if ($credentials === '') {
            return '';
        }

        return trim(str_replace('%kernel.project_dir%', $this->projectDir, $credentials));
    }

    private function isInlineJson(string $credentials): bool
    {
        return str_starts_with(ltrim($credentials), '{');
    }
}
