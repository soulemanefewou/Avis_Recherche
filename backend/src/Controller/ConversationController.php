<?php

namespace App\Controller;

use App\DTO\CreateConversationDTO;
use App\Entity\Utilisateur;
use App\Exception\UnauthenticatedException;
use App\Response\ApiResponse;
use App\Service\AuthorizationService;
use App\Service\AvisRechercheService;
use App\Service\ConversationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/conversations')]
class ConversationController extends AbstractController
{
    public function __construct(
        private readonly ConversationService $conversationService,
        private readonly AvisRechercheService $avisRechercheService,
        private readonly AuthorizationService $authorizationService,
    ) {
    }

    #[Route('', name: 'api_conversations_index', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $conversations = $this->conversationService->findByUtilisateur($utilisateur);
        return ApiResponse::success($conversations, 'Conversations récupérées avec succès.');
    }

    #[Route('', name: 'api_conversations_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $data = json_decode($request->getContent(), true);

        $avisId = $data['avisRecherche'] ?? null;
        $contenu = $data['contenu'] ?? '';

        if (!$avisId) {
            return ApiResponse::error('L\'avis de recherche est obligatoire.', Response::HTTP_BAD_REQUEST);
        }

        try {
            $avis = $this->avisRechercheService->findById((int) $avisId);
            $this->authorizationService->ensureCanAccessConversation(
                new \App\Entity\Conversation(),
                $utilisateur
            );
            $conversation = $this->conversationService->create($avis, $utilisateur, $contenu);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_BAD_REQUEST);
        }

        return ApiResponse::created(
            $this->conversationService->getConversation($conversation->getId(), $utilisateur),
            'Conversation créée.'
        );
    }

    #[Route('/{id}', name: 'api_conversations_show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();

        try {
            $conversation = $this->conversationService->findById($id);
            $this->authorizationService->ensureCanAccessConversation($conversation, $utilisateur);
        } catch (\App\Exception\AccessDeniedException $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_FORBIDDEN);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_NOT_FOUND);
        }

        return ApiResponse::success(
            $this->conversationService->getConversation($id, $utilisateur),
            'Conversation récupérée avec succès.'
        );
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
