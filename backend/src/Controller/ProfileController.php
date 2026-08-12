<?php

namespace App\Controller;

use App\DTO\UpdateProfileDTO;
use App\Entity\Utilisateur;
use App\Exception\UnauthenticatedException;
use App\Response\ApiResponse;
use App\Service\ProfileService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class ProfileController extends AbstractController
{
    public function __construct(
        private ProfileService $profileService,
        private EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/api/profile', name: 'api_profile', methods: ['GET'])]
    public function profile(): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $profile = $this->profileService->getProfile($utilisateur);
        return ApiResponse::success($profile, 'Profil récupéré avec succès.');
    }

    #[Route('/api/profile', name: 'api_profile_update', methods: ['PUT'])]
    public function update(Request $request): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $data = json_decode($request->getContent(), true);

        $dto = new UpdateProfileDTO();
        $dto->nom = $data['nom'] ?? null;
        $dto->prenom = $data['prenom'] ?? null;
        $dto->telephone = $data['telephone'] ?? null;
        $dto->lieuResidence = $data['lieuResidence'] ?? null;
        $dto->region = isset($data['region']) ? (int) $data['region'] : null;

        $profile = $this->profileService->updateProfile($utilisateur, $dto);
        return ApiResponse::success($profile, 'Profil mis à jour avec succès.');
    }

    #[Route('/api/profile/fcm-token', name: 'api_register_fcm_token', methods: ['POST'])]
    public function registerFcmToken(Request $request): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $data = json_decode($request->getContent(), true);
        $token = $data['token'] ?? null;

        if (!is_string($token) || $token === '') {
            return ApiResponse::error('Token FCM manquant.', Response::HTTP_BAD_REQUEST);
        }

        $utilisateur->setFcmToken($token);
        $this->entityManager->flush();

        return ApiResponse::success(null, 'Token FCM enregistré avec succès.');
    }

    #[Route('/api/profile/fcm-token', name: 'api_remove_fcm_token', methods: ['DELETE'])]
    public function removeFcmToken(): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();

        if ($utilisateur->getFcmToken() !== null) {
            $utilisateur->setFcmToken(null);
            $this->entityManager->flush();
        }

        return ApiResponse::success(null, 'Token FCM supprimé avec succès.');
    }

    private function getAuthenticatedUser(): Utilisateur
    {
        $utilisateur = $this->getUser();
        if (!$utilisateur instanceof Utilisateur) {
            throw new UnauthenticatedException();
        }
        return $utilisateur;
    }
}
