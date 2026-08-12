<?php

namespace App\Mapper;

use App\Entity\Signalement;

class SignalementMapper
{
    public function toArrayPublic(Signalement $signalement): array
    {
        return [
            'id' => $signalement->getId(),
            'description' => $signalement->getDescription(),
            'lieu' => $signalement->getLieu(),
            'dateObservation' => $signalement->getDateObservation()?->format('Y-m-d H:i:s'),
            'createdAt' => $signalement->getCreatedAt()?->format('Y-m-d H:i:s'),
            'photo' => $signalement->getPhoto(),
        ];
    }

    public function toArrayPrivate(Signalement $signalement): array
    {
        return [
            'id' => $signalement->getId(),
            'description' => $signalement->getDescription(),
            'lieu' => $signalement->getLieu(),
            'dateObservation' => $signalement->getDateObservation()?->format('Y-m-d H:i:s'),
            'heureObservation' => $signalement->getHeureObservation(),
            'telephoneContact' => $signalement->getTelephoneContact(),
            'commentaireSupplementaire' => $signalement->getCommentaireSupplementaire(),
            'photo' => $signalement->getPhoto(),
            'video' => $signalement->getVideo(),
            'pieceJointe' => $signalement->getPieceJointe(),
            'statut' => $signalement->getStatut()->value,
            'urgent' => $signalement->isUrgent(),
            'createdAt' => $signalement->getCreatedAt()?->format('Y-m-d H:i:s'),
            'auteur' => [
                'id' => $signalement->getUtilisateur()->getId(),
                'nom' => $signalement->getUtilisateur()->getNom(),
                'prenom' => $signalement->getUtilisateur()->getPrenom(),
                'telephone' => $signalement->getUtilisateur()->getTelephone(),
                'email' => $signalement->getUtilisateur()->getEmail(),
            ],
            'utilisateur' => [
                'id' => $signalement->getUtilisateur()->getId(),
                'nom' => $signalement->getUtilisateur()->getNom(),
                'prenom' => $signalement->getUtilisateur()->getPrenom(),
            ],
            'avisRecherche' => [
                'id' => $signalement->getAvisRecherche()->getId(),
                'prenom' => $signalement->getAvisRecherche()->getPrenom(),
                'nom' => $signalement->getAvisRecherche()->getNom(),
            ],
        ];
    }

    public function toArray(Signalement $signalement): array
    {
        return $this->toArrayPrivate($signalement);
    }
}
