<?php

namespace App\Mapper;

use App\Entity\Conversation;
use App\Entity\Message;

class ConversationMapper
{
    public function toArray(Conversation $conversation): array
    {
        $avis = $conversation->getAvisRecherche();
        $lastMessage = null;
        $messages = $conversation->getMessages();

        if ($messages->count() > 0) {
            $sorted = $messages->toArray();
            usort($sorted, fn($a, $b) => $a->getCreatedAt() <=> $b->getCreatedAt());
            $lastMsg = end($sorted);
            $lastMessage = [
                'id' => $lastMsg->getId(),
                'contenu' => $lastMsg->getContenu(),
                'type' => $lastMsg->getType()->value,
                'lu' => $lastMsg->isLu(),
                'createdAt' => $lastMsg->getCreatedAt()?->format('c'),
                'auteur' => $lastMsg->getAuteur() ? [
                    'id' => $lastMsg->getAuteur()->getId(),
                    'nom' => $lastMsg->getAuteur()->getNom(),
                    'prenom' => $lastMsg->getAuteur()->getPrenom(),
                ] : null,
            ];
        }

        $unreadCount = 0;
        foreach ($messages as $msg) {
            if (!$msg->isLu() && $msg->getType()->value === 'USER') {
                $unreadCount++;
            }
        }

        return [
            'id' => $conversation->getId(),
            'statut' => $conversation->getStatut()->value,
            'type' => $conversation->getType()->value,
            'createdAt' => $conversation->getCreatedAt()?->format('c'),
            'updatedAt' => $conversation->getUpdatedAt()?->format('c'),
            'lastMessageAt' => $conversation->getLastMessageAt()?->format('c'),
            'avisRecherche' => $avis ? [
                'id' => $avis->getId(),
                'nom' => $avis->getNom(),
                'prenom' => $avis->getPrenom(),
                'sexe' => $avis->getSexe()?->value,
                'ageApprox' => $avis->getAgeApprox(),
                'type' => $avis instanceof \App\Entity\AvisOfficiel ? 'OFFICIEL' : 'CITOYEN',
            ] : null,
            'createurSignalement' => $conversation->getCreateurSignalement() ? [
                'id' => $conversation->getCreateurSignalement()->getId(),
                'nom' => $conversation->getCreateurSignalement()->getNom(),
                'prenom' => $conversation->getCreateurSignalement()->getPrenom(),
            ] : null,
            'proprietaireAvis' => $conversation->getProprietaireAvis() ? [
                'id' => $conversation->getProprietaireAvis()->getId(),
                'nom' => $conversation->getProprietaireAvis()->getNom(),
                'prenom' => $conversation->getProprietaireAvis()->getPrenom(),
            ] : null,
            'lastMessage' => $lastMessage,
            'unreadCount' => $unreadCount,
            'nombreMessages' => $messages->count(),
        ];
    }

    public function toArrayCollection(array $conversations): array
    {
        return array_map(
            fn (Conversation $conversation) => $this->toArray($conversation),
            $conversations
        );
    }
}
