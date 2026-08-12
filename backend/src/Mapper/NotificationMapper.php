<?php

namespace App\Mapper;

use App\Entity\Notification;

class NotificationMapper
{
    public function toArray(Notification $notification): array
    {
        return [
            'id' => $notification->getId(),
            'titre' => $notification->getTitre(),
            'contenu' => $notification->getContenu(),
            'type' => $notification->getType()->value,
            'lu' => $notification->isLu(),
            'createdAt' => $notification->getCreatedAt()?->format('Y-m-d H:i:s'),
            'updatedAt' => $notification->getUpdatedAt()?->format('Y-m-d H:i:s'),

            'utilisateur' => [
                'id' => $notification->getUtilisateur()?->getId(),
                'nom' => $notification->getUtilisateur()?->getNom(),
                'prenom' => $notification->getUtilisateur()?->getPrenom(),
            ],
        ];
    }

    public function toArrayCollection(array $notifications): array
    {
        return array_map(
            fn(Notification $notification) => $this->toArray($notification),
            $notifications
        );
    }
}