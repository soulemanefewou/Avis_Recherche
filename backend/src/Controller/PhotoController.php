<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use App\Exception\UnauthenticatedException;
use App\Mapper\PhotoMapper;
use App\Response\ApiResponse;
use App\Service\AvisRechercheService;
use App\Service\PhotoService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api')]
class PhotoController extends AbstractController
{
    public function __construct(
        private PhotoService $photoService,
        private AvisRechercheService $avisRechercheService,
        private PhotoMapper $photoMapper
    ) {
    }

    #[Route('/avis-recherches/{id}/photos', name: 'api_upload_photo', methods: ['POST'])]
    public function upload(int $id, Request $request): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $avisRecherche = $this->avisRechercheService->findById($id);

        $fichier = $request->files->get('photo');
        if (!$fichier) {
            return ApiResponse::error('Aucun fichier envoyé.', Response::HTTP_BAD_REQUEST);
        }

        try {
            $photo = $this->photoService->upload($avisRecherche, $fichier, $utilisateur);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_BAD_REQUEST);
        }

        return ApiResponse::success(
            $this->photoMapper->toArray($photo),
            'Photo ajoutée avec succès.',
            Response::HTTP_CREATED
        );
    }

    #[Route('/avis-recherches/{id}/photos', name: 'api_get_avis_photos', methods: ['GET'])]
    public function getPhotos(int $id): JsonResponse
    {
        $avisRecherche = $this->avisRechercheService->findById($id);
        $photos = $this->photoService->findByAvisRecherche($avisRecherche);

        $data = array_map(
            fn($photo) => $this->photoMapper->toArray($photo),
            $photos
        );

        return ApiResponse::success($data, 'Photos récupérées avec succès.');
    }

    #[Route('/photos/{id}', name: 'api_delete_photo', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $photo = $this->photoService->findById($id);

        try {
            $this->photoService->delete($photo, $utilisateur);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_FORBIDDEN);
        }

        return ApiResponse::success(null, 'Photo supprimée avec succès.');
    }

    #[Route('/photos/{id}/principale', name: 'api_define_main_photo', methods: ['PATCH'])]
    public function defineAsMain(int $id): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $photo = $this->photoService->findById($id);

        try {
            $this->photoService->defineAsMain($photo, $utilisateur);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_FORBIDDEN);
        }

        return ApiResponse::success(null, 'Photo principale mise à jour avec succès.');
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
