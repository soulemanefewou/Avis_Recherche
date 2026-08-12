<?php

namespace App\Service;

use App\DTO\UpdateProfileDTO;
use App\Entity\Utilisateur;
use App\Repository\RegionRepository;
use Doctrine\ORM\EntityManagerInterface;

class ProfileService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private RegionRepository $regionRepository,
    ) {
    }

    public function getProfile(Utilisateur $utilisateur): array
    {
        return [
            'id' => $utilisateur->getId(),
            'nom' => $utilisateur->getNom(),
            'prenom' => $utilisateur->getPrenom(),
            'email' => $utilisateur->getEmail(),
            'telephone' => $utilisateur->getTelephone(),
            'lieuResidence' => $utilisateur->getLieuResidence(),
            'region' => $utilisateur->getRegion() ? [
                'id' => $utilisateur->getRegion()->getId(),
                'nom' => $utilisateur->getRegion()->getNom(),
            ] : null,
            'roles' => $utilisateur->getRoles(),
            'actif' => $utilisateur->isActif(),
        ];
    }

    public function updateProfile(Utilisateur $utilisateur, UpdateProfileDTO $dto): array
    {
        if ($dto->nom !== null) {
            $utilisateur->setNom($dto->nom);
        }
        if ($dto->prenom !== null) {
            $utilisateur->setPrenom($dto->prenom);
        }
        if ($dto->telephone !== null) {
            $utilisateur->setTelephone($dto->telephone);
        }
        if ($dto->lieuResidence !== null) {
            $utilisateur->setLieuResidence($dto->lieuResidence);
        }
        if ($dto->region !== null) {
            $region = $this->regionRepository->find($dto->region);
            if ($region !== null) {
                $utilisateur->setRegion($region);
            }
        }

        $this->entityManager->flush();

        return $this->getProfile($utilisateur);
    }
}
