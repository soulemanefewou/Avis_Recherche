<?php

namespace App\Controller;

use App\DTO\RegisterUserDTO;
use App\Response\ApiResponse;
use App\Service\AuthService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class AuthController extends AbstractController
{
    public function __construct(
        private AuthService $authService,
        private ValidatorInterface $validator
    ) {
    }

    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $dto = new RegisterUserDTO();
        $dto->nom = $data['nom'] ?? '';
        $dto->prenom = $data['prenom'] ?? '';
        $dto->telephone = $data['telephone'] ?? '';
        $dto->email = $data['email'] ?? '';
        $dto->password = $data['password'] ?? '';
        $dto->lieuResidence = $data['lieuResidence'] ?? null;
        $dto->region = isset($data['region']) ? (int) $data['region'] : null;

        $errors = $this->validator->validate($dto);
        if (count($errors) > 0) {
            $messages = [];
            foreach ($errors as $error) {
                $messages[] = $error->getMessage();
            }
            return ApiResponse::error('Données invalides.', Response::HTTP_BAD_REQUEST, $messages);
        }

        try {
            $utilisateur = $this->authService->register($dto);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_BAD_REQUEST);
        }

        return ApiResponse::created(
            [
                'id' => $utilisateur->getId(),
                'nom' => $utilisateur->getNom(),
                'prenom' => $utilisateur->getPrenom(),
                'telephone' => $utilisateur->getTelephone(),
                'email' => $utilisateur->getEmail(),
                'lieuResidence' => $utilisateur->getLieuResidence(),
            ],
            'Compte créé avec succès.'
        );
    }
}
