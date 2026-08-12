<?php

namespace App\Controller;

use App\DTO\CreateAvisRechercheDTO;
use App\DTO\UpdateAvisRechercheDTO;
use App\DTO\SearchAvisRechercheDTO;
use App\DTO\ValidateAvisCitoyenDTO;
use App\DTO\DeclareRetrouveDTO;
use App\Entity\Utilisateur;
use App\Enum\Sexe;
use App\Enum\AvisStatut;
use App\Exception\UnauthenticatedException;
use App\Mapper\AvisRechercheMapper;
use App\Response\ApiResponse;
use App\Service\AvisRechercheService;
use App\Service\AuthorizationService;
use App\Service\JustificatifService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/avis-recherches')]
class AvisRechercheController extends AbstractController
{
    public function __construct(
        private AvisRechercheService $avisRechercheService,
        private AvisRechercheMapper $avisRechercheMapper,
        private AuthorizationService $authorizationService,
        private JustificatifService $justificatifService,
    ) {
    }

    #[Route('', name: 'api_create_avis_citoyen', methods: ['POST'])]
    public function createCitoyen(Request $request): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $data = json_decode($request->getContent(), true);

        $dto = new CreateAvisRechercheDTO();
        $dto->nom = $data['nom'] ?? '';
        $dto->prenom = $data['prenom'] ?? '';
        $dto->description = $data['description'] ?? '';
        $dto->dernierLieuVu = $data['dernierLieuVu'] ?? '';
        $dto->dateDisparition = $data['dateDisparition'] ?? '';
        $dto->sexe = isset($data['sexe']) ? Sexe::from($data['sexe']) : null;
        $dto->ageApprox = isset($data['ageApprox']) ? (int) $data['ageApprox'] : null;
        $dto->tenueVestimentaire = $data['tenueVestimentaire'] ?? null;
        $dto->signesParticuliers = $data['signesParticuliers'] ?? null;
        $dto->taille = isset($data['taille']) ? (float) $data['taille'] : null;
        $dto->poids = isset($data['poids']) ? (float) $data['poids'] : null;
        $dto->telephone = $data['telephone'] ?? '';
        $dto->circonstances = $data['circonstances'] ?? null;
        $dto->region = isset($data['region']) ? (int) $data['region'] : null;
        $dto->ville = isset($data['ville']) ? (int) $data['ville'] : null;

        try {
            $avis = $this->avisRechercheService->createAvisCitoyen($dto, $utilisateur);
        } catch (\InvalidArgumentException|\Exception $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_BAD_REQUEST);
        }

        $message = in_array('ROLE_SUPER_ADMIN', $utilisateur->getRoles(), true)
            ? 'Avis de recherche créé et publié.'
            : 'Avis de recherche créé. En attente de validation.';

        return ApiResponse::created(
            $this->avisRechercheMapper->toArray($avis),
            $message
        );
    }

    #[Route('/mes-avis', name: 'api_my_avis', methods: ['GET'])]
    public function myAvis(): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $avis = $this->avisRechercheService->getMyAvis($utilisateur);
        return ApiResponse::success(
            $this->avisRechercheMapper->collection($avis)
        );
    }

    #[Route('', name: 'api_get_all_avis', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $dto = new SearchAvisRechercheDTO();
        $dto->search = $request->query->get('search');
        if ($request->query->has('sexe')) {
            $dto->sexe = Sexe::from($request->query->get('sexe'));
        }
        if ($request->query->has('statut')) {
            $dto->statut = AvisStatut::from($request->query->get('statut'));
        }
        $dto->type = $request->query->get('type');
        $dto->region = $request->query->has('region') ? (int) $request->query->get('region') : null;
        $dto->ville = $request->query->has('ville') ? (int) $request->query->get('ville') : null;
        $dto->page = (int) $request->query->get('page', 1);
        $dto->limit = (int) $request->query->get('limit', 10);

        $result = $this->avisRechercheService->findAll($dto);

        $mappedData = $this->avisRechercheMapper->collection($result['data'] ?? []);

        return ApiResponse::paginated($mappedData, [
            'page' => $dto->page,
            'limit' => $dto->limit,
            'total' => $result['total'] ?? 0,
        ]);
    }

    #[Route('/{id}', name: 'api_get_avis', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $avis = $this->avisRechercheService->findById($id);
        return ApiResponse::success($this->avisRechercheMapper->toArray($avis));
    }

    #[Route('/{id}', name: 'api_update_avis', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $data = json_decode($request->getContent(), true);

        $dto = new UpdateAvisRechercheDTO();
        $dto->nom = $data['nom'] ?? null;
        $dto->prenom = $data['prenom'] ?? null;
        $dto->sexe = isset($data['sexe']) ? Sexe::from($data['sexe']) : null;
        $dto->description = $data['description'] ?? null;
        $dto->dernierLieuVu = $data['dernierLieuVu'] ?? null;
        $dto->dateDisparition = $data['dateDisparition'] ?? null;
        $dto->ageApprox = isset($data['ageApprox']) ? (int) $data['ageApprox'] : null;
        $dto->tenueVestimentaire = $data['tenueVestimentaire'] ?? null;
        $dto->signesParticuliers = $data['signesParticuliers'] ?? null;
        $dto->taille = isset($data['taille']) ? (float) $data['taille'] : null;
        $dto->poids = isset($data['poids']) ? (float) $data['poids'] : null;
        $dto->telephone = $data['telephone'] ?? null;
        $dto->circonstances = $data['circonstances'] ?? null;
        $dto->region = isset($data['region']) ? (int) $data['region'] : null;
        $dto->ville = isset($data['ville']) ? (int) $data['ville'] : null;

        try {
            $avis = $this->avisRechercheService->update($id, $dto, $utilisateur);
        } catch (\App\Exception\AccessDeniedException $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_FORBIDDEN);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_BAD_REQUEST);
        }

        return ApiResponse::success($this->avisRechercheMapper->toArray($avis), 'Avis modifié avec succès.');
    }

    #[Route('/{id}/archive', name: 'api_archive_avis', methods: ['PATCH'])]
    public function archive(int $id): JsonResponse
    {
        try {
            $avis = $this->avisRechercheService->archive($id);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_BAD_REQUEST);
        }

        return ApiResponse::success(['statut' => $avis->getStatut()->value], 'Avis archivé avec succès.');
    }

    #[Route('/{id}/valider', name: 'api_validate_avis_citoyen', methods: ['POST'])]
    public function validateAvisCitoyen(int $id, Request $request): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $this->authorizationService->ensureCanValidateAvis($utilisateur);

        $data = json_decode($request->getContent(), true);
        $dto = new ValidateAvisCitoyenDTO();
        $dto->valide = $data['valide'] ?? false;
        $dto->motifRejet = $data['motifRejet'] ?? null;

        try {
            $avis = $this->avisRechercheService->validateAvisCitoyen($id, $dto);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_BAD_REQUEST);
        }

        $message = $dto->valide ? 'Avis validé et publié.' : 'Avis rejeté.';
        return ApiResponse::success($this->avisRechercheMapper->toArray($avis), $message);
    }

    #[Route('/{id}/declarer-retrouve', name: 'api_declare_retrouve', methods: ['POST'])]
    public function declareRetrouve(int $id, Request $request): JsonResponse
    {
        $utilisateur = $this->getAuthenticatedUser();
        $data = json_decode($request->getContent(), true);

        $dto = new DeclareRetrouveDTO();
        $dto->statut = isset($data['statut']) ? AvisStatut::from($data['statut']) : null;
        $dto->description = $data['description'] ?? null;

        try {
            $avis = $this->avisRechercheService->declareRetrouve($id, $dto, $utilisateur);
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), Response::HTTP_BAD_REQUEST);
        }

        return ApiResponse::success($this->avisRechercheMapper->toArray($avis), 'Statut mis à jour.');
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
