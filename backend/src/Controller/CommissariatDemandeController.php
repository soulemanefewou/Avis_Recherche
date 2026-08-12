<?php

namespace App\Controller;

use App\DTO\CreateCommissariatDemandeDTO;
use App\Response\ApiResponse;
use App\Service\CommissariatDemandeService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class CommissariatDemandeController extends AbstractController
{
    public function __construct(
        private CommissariatDemandeService $demandeService,
    ) {
    }

    #[Route('/api/commissariat-demandes', name: 'api_create_demande', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $file = $request->files->get('justificatif');
        $data = $request->request->all();

        if (!$file) {
            return ApiResponse::error('Le justificatif est obligatoire.', Response::HTTP_BAD_REQUEST);
        }

        $dto = new CreateCommissariatDemandeDTO();
        $dto->nom = $data['nom'] ?? '';
        $dto->adresse = $data['adresse'] ?? '';
        $dto->telephone = $data['telephone'] ?? '';
        $dto->email = $data['email'] ?? '';
        $dto->responsable = $data['responsable'] ?? '';
        $dto->prenom = $data['prenom'] ?? '';
        $dto->motDePasse = $data['motDePasse'] ?? '';
        $dto->region = isset($data['region']) ? (int) $data['region'] : 0;
        $dto->ville = isset($data['ville']) ? (int) $data['ville'] : 0;

        try {
            $demande = $this->demandeService->create($dto, $file);
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_BAD_REQUEST);
        }

        return ApiResponse::success([
            'id' => $demande->getId(),
            'nom' => $demande->getNom(),
            'statut' => $demande->getStatut()->value,
        ], 'Demande de commissariat soumise avec succès.');
    }

    #[Route('/api/commissariat-demandes/{id}', name: 'api_show_demande', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        try {
            $demande = $this->demandeService->findById($id);
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_NOT_FOUND);
        }

        return ApiResponse::success([
            'id' => $demande->getId(),
            'nom' => $demande->getNom(),
            'adresse' => $demande->getAdresse(),
            'telephone' => $demande->getTelephone(),
            'email' => $demande->getEmail(),
            'responsable' => $demande->getResponsable(),
            'prenom' => $demande->getUtilisateur()?->getPrenom(),
            'statut' => $demande->getStatut()->value,
            'motifRejet' => $demande->getMotifRejet(),
            'documentPath' => $demande->getDocumentPath(),
            'documentNomOriginal' => $demande->getDocumentNomOriginal(),
            'createdAt' => $demande->getCreatedAt()?->format('Y-m-d H:i:s'),
            'traiteLe' => $demande->getTraiteLe()?->format('Y-m-d H:i:s'),
            'region' => $demande->getRegion() ? ['id' => $demande->getRegion()->getId(), 'nom' => $demande->getRegion()->getNom()] : null,
            'ville' => $demande->getVille() ? ['id' => $demande->getVille()->getId(), 'nom' => $demande->getVille()->getNom()] : null,
        ]);
    }
}
