<?php

namespace App\Service;

use App\Entity\Utilisateur;
use App\Repository\RegionRepository;
use App\Repository\UtilisateurRepository;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Doctrine\ORM\EntityManagerInterface;
use App\DTO\RegisterUserDTO;

class AuthService
{
    public function __construct(
        private UtilisateurRepository $utilisateurRepository,
        private RegionRepository $regionRepository,
        private UserPasswordHasherInterface $passwordHasher,
        private EntityManagerInterface $entityManager,
    ) {
    }

    public function register(RegisterUserDTO $dto): Utilisateur
    {
        $utilisateurExistant = $this->utilisateurRepository->findOneBy(['email' => $dto->email]);

        if ($utilisateurExistant !== null) {
            throw new \Exception("Cet email est déjà utilisé.");
        }

        $utilisateur = new Utilisateur();
        $utilisateur->setNom($dto->nom);
        $utilisateur->setPrenom($dto->prenom);
        $utilisateur->setEmail($dto->email);
        $utilisateur->setTelephone($dto->telephone);
        $utilisateur->setActif(true);
        $utilisateur->setRoles(['ROLE_USER']);

        if ($dto->lieuResidence !== null) {
            $utilisateur->setLieuResidence($dto->lieuResidence);
        }

        if ($dto->region !== null) {
            $region = $this->regionRepository->find($dto->region);
            if ($region !== null) {
                $utilisateur->setRegion($region);
            }
        }

        $hashedPassword = $this->passwordHasher->hashPassword($utilisateur, $dto->password);
        $utilisateur->setPassword($hashedPassword);

        $this->entityManager->persist($utilisateur);
        $this->entityManager->flush();

        return $utilisateur;
    }
}
