<?php

namespace App\Controller;

use App\DTO\CreateMessageDTO;
use App\Entity\Utilisateur;
use App\Exception\UnauthenticatedException;
use App\Response\ApiResponse;
use App\Service\AuthorizationService;
use App\Service\ConversationService;
use App\Service\MessageService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api')]
class MessageController extends AbstractController
{
    public function __construct(
        private readonly MessageService $messageService,
        private readonly ConversationService $conversationService,
        private readonly AuthorizationService $authorizationService,
    ) {
    }

    #[Route('/conversations/{id}/messages', name: 'api_create_message', methods: ['POST'])]
    public function create(int $id, Request $request): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();

        try {
            $conversation = $this->conversationService->findById($id);
            $this->authorizationService->ensureCanSendMessage($conversation, $utilisateur);
        } catch (\App\Exception\AccessDeniedException $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        $dto = new CreateMessageDTO();
        $dto->contenu = $data['contenu'] ?? '';

        if (!$dto->contenu) {
            return ApiResponse::error('Le contenu est obligatoire.', Response::HTTP_BAD_REQUEST);
        }

        $message = $this->messageService->create($id, $utilisateur, $dto);

        return ApiResponse::success($message, 'Message envoyé avec succès.', Response::HTTP_CREATED);
    }

    #[Route('/conversations/{id}/messages', name: 'api_conversation_messages', methods: ['GET'])]
    public function getConversationMessages(int $id): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();

        try {
            $messages = $this->messageService->getConversationMessages($id, $utilisateur);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_NOT_FOUND);
        }

        return ApiResponse::success($messages);
    }

    #[Route('/messages/{id}', name: 'api_show_message', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $message = $this->messageService->getMessage($id, $utilisateur);
        return ApiResponse::success($message);
    }

    #[Route('/messages/{id}/read', name: 'api_mark_message_read', methods: ['PATCH'])]
    public function markAsRead(int $id): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $message = $this->messageService->markAsRead($id, $utilisateur);
        return ApiResponse::success($message, 'Message marqué comme lu.');
    }

    #[Route('/messages/{id}/signaler', name: 'api_report_message', methods: ['POST'])]
    public function report(int $id): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $message = $this->messageService->report($id, $utilisateur);
        return ApiResponse::success($message, 'Message signalé.');
    }

    #[Route('/messages/{id}', name: 'api_delete_message', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $this->messageService->delete($id, $utilisateur);
        return ApiResponse::success(null, 'Message supprimé avec succès.');
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
