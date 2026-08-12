<?php

namespace App\Controller;

use App\DTO\SignalementDTO;
use App\Entity\Signalement;
use App\Entity\Utilisateur;
use App\Enum\ConversationStatut;
use App\Enum\ConversationType;
use App\Exception\SignalementNotFoundException;
use App\Exception\UnauthenticatedException;
use App\Response\ApiResponse;
use App\Service\AuthorizationService;
use App\Service\AvisRechercheService;
use App\Service\NotificationService;
use App\Service\SignalementService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class SignalementController extends AbstractController
{
    public function __construct(
        private readonly SignalementService $signalementService,
        private readonly AvisRechercheService $avisRechercheService,
        private readonly AuthorizationService $authorizationService,
        private readonly NotificationService $notificationService,
        private readonly EntityManagerInterface $em,
    ) {
    }

    #[Route('/api/signalements/photo', name: 'api_upload_signalement_photo', methods: ['POST'])]
    public function uploadPhoto(Request $request): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();

        $fichier = $request->files->get('photo');
        if (!$fichier) {
            return ApiResponse::error('Aucun fichier envoyé.', Response::HTTP_BAD_REQUEST);
        }

        try {
            $data = $this->signalementService->uploadPhoto($fichier, $utilisateur);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_BAD_REQUEST);
        }

        return ApiResponse::success($data, 'Image téléversée avec succès.', Response::HTTP_CREATED);
    }

    #[Route('/api/avis-recherches/{id}/signalements', name: 'api_create_signalement', methods: ['POST'])]
    public function create(int $id, Request $request): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $avisRecherche = $this->avisRechercheService->findById($id);
        $data = json_decode($request->getContent(), true);

        $dto = new SignalementDTO();
        $dto->description = $data['description'] ?? '';
        $dto->lieu = $data['lieu'] ?? '';
        $dto->dateObservation = isset($data['dateObservation'])
            ? new \DateTimeImmutable($data['dateObservation'])
            : new \DateTimeImmutable();
        $dto->heureObservation = $data['heureObservation'] ?? null;
        $dto->telephoneContact = $data['telephoneContact'] ?? null;
        $dto->commentaireSupplementaire = $data['commentaireSupplementaire'] ?? null;
        $dto->photo = $data['photo'] ?? null;
        $dto->video = $data['video'] ?? null;
        $dto->pieceJointe = $data['pieceJointe'] ?? null;
        $dto->urgent = isset($data['urgent']) && (bool) $data['urgent'];

        try {
            $signalement = $this->signalementService->create($dto, $avisRecherche, $utilisateur);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_BAD_REQUEST);
        }

        return ApiResponse::success([
            'signalement' => $signalement,
        ], 'Signalement publié avec succès.', Response::HTTP_CREATED);
    }

    #[Route('/api/avis-recherches/{id}/signalements/public', name: 'api_get_signalements_public', methods: ['GET'])]
    public function getPublic(int $id): JsonResponse
    {
        $avisRecherche = $this->avisRechercheService->findById($id);
        $data = $this->signalementService->getPublicByAvisRecherche($avisRecherche);
        return ApiResponse::success($data, 'Signalements récupérés avec succès.');
    }

    #[Route('/api/avis-recherches/{id}/signalements', name: 'api_get_signalements', methods: ['GET'])]
    public function getByAvisRecherche(int $id): JsonResponse
    {
        $avisRecherche = $this->avisRechercheService->findById($id);
        $user = $this->getUser();

        $isOwner = $user instanceof Utilisateur && $avisRecherche instanceof AvisCitoyen && $avisRecherche->getAuteur()?->getId() === $user->getId();
        $isCommissariat = $user instanceof Utilisateur && in_array('ROLE_COMMISSARIAT', $user->getRoles());
        $isSuperAdmin = $user instanceof Utilisateur && in_array('ROLE_SUPER_ADMIN', $user->getRoles());

        if ($isOwner || $isCommissariat || $isSuperAdmin) {
            $data = $this->signalementService->getPrivateByAvisRecherche($avisRecherche);
        } else {
            $data = $this->signalementService->getPublicByAvisRecherche($avisRecherche);
        }

        return ApiResponse::success($data, 'Signalements récupérés avec succès.');
    }

    #[Route('/api/signalements/{id}', name: 'api_get_signalement', methods: ['GET'])]
    public function getById(int $id): JsonResponse
    {
        $data = $this->signalementService->getById($id);
        return ApiResponse::success($data, 'Signalement récupéré avec succès.');
    }

    #[Route('/api/signalements/{id}/contacter', name: 'api_contacter_temoin', methods: ['POST'])]
    public function contacterTemoin(int $id): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();

        $signalement = $this->em->getRepository(Signalement::class)->find($id);
        if (!$signalement) {
            return ApiResponse::error('Signalement introuvable.', Response::HTTP_NOT_FOUND);
        }

        $temoin = $signalement->getUtilisateur();
        if (!$temoin) {
            return ApiResponse::error('Témoin introuvable.', Response::HTTP_NOT_FOUND);
        }

        $avisRecherche = $signalement->getAvisRecherche();
        if (!$avisRecherche) {
            return ApiResponse::error('Avis de recherche associé introuvable.', Response::HTTP_NOT_FOUND);
        }

        $existing = $this->em->getRepository(\App\Entity\Conversation::class)->findExistingConversation(
            $avisRecherche, $utilisateur, $temoin
        );
        if ($existing) {
            return ApiResponse::success([
                'conversation_id' => $existing->getId(),
            ], 'Conversation déjà existante.');
        }

        $conversation = new \App\Entity\Conversation();
        $conversation->setAvisRecherche($avisRecherche);
        $conversation->setCreateurSignalement($utilisateur);
        $conversation->setProprietaireAvis($temoin);
        $conversation->setStatut(ConversationStatut::ACTIVE);
        $conversation->setType(ConversationType::COMMISSARIAT_TEMOIN);

        $this->em->persist($conversation);
        $this->em->flush();

        $this->notificationService->create(
            $temoin,
            'Nouveau message',
            sprintf(
                '%s %s souhaite vous contacter suite à votre signalement concernant %s %s.',
                $utilisateur->getPrenom(),
                $utilisateur->getNom(),
                $avisRecherche->getPrenom(),
                $avisRecherche->getNom()
            ),
            \App\Enum\NotificationType::MESSAGE
        );

        return ApiResponse::success([
            'conversation_id' => $conversation->getId(),
        ], 'Conversation créée avec le témoin.');
    }

    #[Route('/api/signalements/{id}/masquer', name: 'api_hide_signalement', methods: ['PATCH'])]
    public function hide(int $id): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();

        if (!$this->authorizationService->canHideSignalement($utilisateur)) {
            return ApiResponse::error('Non autorisé.', Response::HTTP_FORBIDDEN);
        }

        $this->signalementService->hide($id);
        return ApiResponse::success(null, 'Signalement masqué.');
    }

    #[Route('/api/signalements/{id}', name: 'api_delete_signalement', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $this->signalementService->delete($id, $utilisateur);
        return ApiResponse::success(null, 'Signalement supprimé avec succès.');
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
