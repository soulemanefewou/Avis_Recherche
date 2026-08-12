<?php

namespace App\Mapper;

use App\Entity\Message;

class MessageMapper
{
    /**
     * Convertit un Message en tableau.
     */
    public function toArray(Message $message): array
    {
        return [
            'id' => $message->getId(),

            'contenu' => $message->getContenu(),

            'type' => $message->getType()->value,

            'lu' => $message->isLu(),

            'createdAt' => $message->getCreatedAt()?->format('Y-m-d H:i:s'),

            'updatedAt' => $message->getUpdatedAt()?->format('Y-m-d H:i:s'),

            'conversation' => [
                'id' => $message->getConversation()?->getId(),
            ],

            'auteur' => [
                'id' => $message->getAuteur()?->getId(),
                'nom' => $message->getAuteur()?->getNom(),
                'prenom' => $message->getAuteur()?->getPrenom(),
            ],
        ];
    }

    /**
     * Convertit une liste de messages.
     */
    public function toArrayCollection(array $messages): array
    {
        return array_map(
            fn (Message $message) => $this->toArray($message),
            $messages
        );
    }
}