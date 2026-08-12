<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use App\Exception\UnauthenticatedException;
use App\Response\ApiResponse;
use App\Service\NotificationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/notifications')]
class NotificationController extends AbstractController
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {
    }

    #[Route('', name: 'api_notifications_index', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        return ApiResponse::success(
            $this->notificationService->getNotifications($utilisateur),
            'Notifications récupérées avec succès.'
        );
    }

    #[Route('/unread/count', name: 'api_notifications_unread_count', methods: ['GET'])]
    public function countUnread(): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        return ApiResponse::success([
            'count' => $this->notificationService->countUnread($utilisateur)
        ]);
    }

    #[Route('/{id}', name: 'api_notifications_show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        return ApiResponse::success(
            $this->notificationService->getNotification($id, $utilisateur),
            'Notification récupérée avec succès.'
        );
    }

    #[Route('/{id}/read', name: 'api_notifications_read', methods: ['PATCH'])]
    public function markAsRead(int $id): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        return ApiResponse::success(
            $this->notificationService->markAsRead($id, $utilisateur),
            'Notification marquée comme lue.'
        );
    }

    #[Route('/{id}', name: 'api_notifications_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $this->notificationService->delete($id, $utilisateur);
        return ApiResponse::success(null, 'Notification supprimée avec succès.');
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
