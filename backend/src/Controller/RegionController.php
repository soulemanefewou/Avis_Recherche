<?php

namespace App\Controller;

use App\Response\ApiResponse;
use App\Service\RegionService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/regions')]
class RegionController extends AbstractController
{
    public function __construct(
        private readonly RegionService $regionService
    ) {
    }

    #[Route('', name: 'api_regions_index', methods: ['GET'])]
    public function index(): JsonResponse
    {
        return ApiResponse::success(
            $this->regionService->findAll(),
            'Régions récupérées avec succès.'
        );
    }

    #[Route('/{id}/villes', name: 'api_regions_villes', methods: ['GET'])]
    public function villes(int $id): JsonResponse
    {
        return ApiResponse::success(
            $this->regionService->findVillesByRegion($id),
            'Villes récupérées avec succès.'
        );
    }
}
