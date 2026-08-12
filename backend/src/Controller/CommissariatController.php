<?php

namespace App\Controller;

use App\Entity\AvisOfficiel;
use App\Entity\AvisRecherche;
use App\Entity\Commissariat;
use App\Entity\Signalement;
use App\Entity\Utilisateur;
use App\Enum\AvisStatut;
use App\Enum\Sexe;
use App\Enum\SignalementStatut;
use App\Mapper\PhotoMapper;
use App\Response\ApiResponse;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/commissariat')]
class CommissariatController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
        private PhotoMapper $photoMapper,
        private NotificationService $notificationService,
    ) {
    }

    private function getAuthUser(): Utilisateur
    {
        /** @var Utilisateur|null */
        $user = $this->getUser();
        $this->denyAccessUnlessGranted('ROLE_COMMISSARIAT');

        return $user;
    }

    private function getUserCommissariat(Utilisateur $user): Commissariat
    {
        $commissariat = $user->getCommissariat();
        if (!$commissariat) {
            throw $this->createNotFoundException('Aucun commissariat associé à cet utilisateur.');
        }

        return $commissariat;
    }

    private function formatAvis(AvisRecherche $a): array
    {
        $photos = [];
        foreach ($a->getPhotos() as $p) {
            $photos[] = $this->photoMapper->toArray($p);
        }

        $commissariatId = null;
        $commissariatNom = null;
        if ($a instanceof AvisOfficiel && $a->getCommissariat()) {
            $commissariatId = $a->getCommissariat()->getId();
            $commissariatNom = $a->getCommissariat()->getNom();
        }

        return [
            'id' => $a->getId(),
            'nom' => $a->getNom(),
            'prenom' => $a->getPrenom(),
            'sexe' => $a->getSexe()?->value,
            'ageApprox' => $a->getAgeApprox(),
            'dateDisparition' => $a->getDateDisparition()?->format('c'),
            'dernierLieuVu' => $a->getDernierLieuVu(),
            'description' => $a->getDescription(),
            'circonstances' => $a->getCirconstances(),
            'tenueVestimentaire' => $a->getTenueVestimentaire(),
            'signesParticuliers' => $a->getSignesParticuliers(),
            'taille' => $a->getTaille(),
            'poids' => $a->getPoids(),
            'telephone' => $a->getTelephone(),
            'statut' => $a->getStatut()->value,
            'actif' => $a->isActif(),
            'type' => $a instanceof AvisOfficiel ? 'OFFICIEL' : 'CITOYEN',
            'region' => $a->getRegion() ? ['id' => $a->getRegion()->getId(), 'nom' => $a->getRegion()->getNom()] : null,
            'ville' => $a->getVille() ? ['id' => $a->getVille()->getId(), 'nom' => $a->getVille()->getNom()] : null,
            'commissariat_id' => $commissariatId,
            'commissariat_nom' => $commissariatNom,
            'photos' => $photos,
            'signalementsCount' => $a->getSignalements()->count(),
            'createdAt' => $a->getCreatedAt()?->format('c'),
            'updatedAt' => $a->getUpdatedAt()?->format('c'),
        ];
    }

    private function formatSignalement(Signalement $s): array
    {
        $utilisateur = $s->getUtilisateur();
        $avis = $s->getAvisRecherche();

        return [
            'id' => $s->getId(),
            'description' => $s->getDescription(),
            'lieu' => $s->getLieu(),
            'dateObservation' => $s->getDateObservation()?->format('c'),
            'telephoneContact' => $s->getTelephoneContact(),
            'statut' => $s->getStatut()?->value,
            'createdAt' => $s->getCreatedAt()?->format('c'),
            'utilisateur' => $utilisateur ? [
                'id' => $utilisateur->getId(),
                'nom' => $utilisateur->getNom(),
                'prenom' => $utilisateur->getPrenom(),
                'telephone' => $utilisateur->getTelephone(),
            ] : null,
            'avisRecherche' => $avis ? [
                'id' => $avis->getId(),
                'nom' => $avis->getNom(),
                'prenom' => $avis->getPrenom(),
            ] : null,
        ];
    }

    private function checkAvisOwnership(int $avisId, int $commissariatId): ?array
    {
        $conn = $this->em->getConnection();
        $row = $conn->fetchAssociative(
            'SELECT id FROM avis_recherche WHERE id = :id AND type = :type AND commissariat_id = :cid',
            ['id' => $avisId, 'type' => 'OFFICIEL', 'cid' => $commissariatId]
        );

        return $row ?: null;
    }

    // ──────────────────────────────────────────────
    // 1. Account Management
    // ──────────────────────────────────────────────

    #[Route('/profile', name: 'api_commissariat_profile', methods: ['GET'])]
    public function profile(): JsonResponse
    {
        $user = $this->getAuthUser();
        $commissariat = $this->getUserCommissariat($user);

        return ApiResponse::success([
            'utilisateur' => [
                'id' => $user->getId(),
                'nom' => $user->getNom(),
                'prenom' => $user->getPrenom(),
                'email' => $user->getEmail(),
                'telephone' => $user->getTelephone(),
                'roles' => $user->getRoles(),
            ],
            'commissariat' => [
                'id' => $commissariat->getId(),
                'nom' => $commissariat->getNom(),
                'adresse' => $commissariat->getAdresse(),
                'telephone' => $commissariat->getTelephone(),
                'email' => $commissariat->getEmail(),
                'responsable' => $commissariat->getResponsable(),
                'actif' => $commissariat->isActif(),
                'region' => $commissariat->getRegion() ? ['id' => $commissariat->getRegion()->getId(), 'nom' => $commissariat->getRegion()->getNom()] : null,
                'ville' => $commissariat->getVille() ? ['id' => $commissariat->getVille()->getId(), 'nom' => $commissariat->getVille()->getNom()] : null,
            ],
        ]);
    }

    #[Route('/profile', name: 'api_commissariat_profile_update', methods: ['PUT'])]
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $this->getAuthUser();
        $commissariat = $this->getUserCommissariat($user);
        $data = json_decode($request->getContent(), true);

        if (isset($data['telephone'])) {
            $user->setTelephone($data['telephone']);
        }
        if (isset($data['email'])) {
            $existing = $this->em->getRepository(Utilisateur::class)->findOneBy(['email' => $data['email']]);
            if ($existing && $existing->getId() !== $user->getId()) {
                return ApiResponse::error('Cet email est déjà utilisé.', Response::HTTP_CONFLICT);
            }
            $user->setEmail($data['email']);
        }
        if (isset($data['commissariat_telephone'])) {
            $commissariat->setTelephone($data['commissariat_telephone']);
        }
        if (isset($data['commissariat_email'])) {
            $commissariat->setEmail($data['commissariat_email']);
        }
        if (isset($data['responsable'])) {
            $commissariat->setResponsable($data['responsable']);
        }
        if (isset($data['responsablePrenom'])) {
            $user->setPrenom($data['responsablePrenom']);
        }
        if (isset($data['commissariat_nom'])) {
            $commissariat->setNom($data['commissariat_nom']);
        }
        if (isset($data['adresse'])) {
            $commissariat->setAdresse($data['adresse']);
        }

        $this->em->flush();

        return ApiResponse::success([
            'utilisateur' => [
                'id' => $user->getId(),
                'nom' => $user->getNom(),
                'prenom' => $user->getPrenom(),
                'email' => $user->getEmail(),
                'telephone' => $user->getTelephone(),
            ],
            'commissariat' => [
                'id' => $commissariat->getId(),
                'nom' => $commissariat->getNom(),
                'adresse' => $commissariat->getAdresse(),
                'telephone' => $commissariat->getTelephone(),
                'email' => $commissariat->getEmail(),
                'responsable' => $commissariat->getResponsable(),
            ],
        ], 'Profil mis à jour avec succès.');
    }

    #[Route('/password', name: 'api_commissariat_password', methods: ['PUT'])]
    public function changePassword(Request $request): JsonResponse
    {
        $user = $this->getAuthUser();
        $data = json_decode($request->getContent(), true);

        $currentPassword = $data['currentPassword'] ?? '';
        $newPassword = $data['newPassword'] ?? '';

        if (!$currentPassword || !$newPassword) {
            return ApiResponse::error('Les champs currentPassword et newPassword sont obligatoires.', Response::HTTP_BAD_REQUEST);
        }

        if (!$this->passwordHasher->isPasswordValid($user, $currentPassword)) {
            return ApiResponse::error('Le mot de passe actuel est incorrect.', Response::HTTP_BAD_REQUEST);
        }

        $user->setPassword($this->passwordHasher->hashPassword($user, $newPassword));
        $this->em->flush();

        return ApiResponse::success(null, 'Mot de passe modifié avec succès.');
    }

    // ──────────────────────────────────────────────
    // 2. Publish Official Avis
    // ──────────────────────────────────────────────

    #[Route('/avis', name: 'api_commissariat_avis_create', methods: ['POST'])]
    public function createAvis(Request $request): JsonResponse
    {
        $user = $this->getAuthUser();
        $commissariat = $this->getUserCommissariat($user);
        $data = json_decode($request->getContent(), true);

        $required = ['nom', 'prenom', 'sexe', 'ageApprox', 'dernierLieuVu', 'description', 'dateDisparition', 'telephone', 'region', 'ville'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return ApiResponse::error("Le champ \"{$field}\" est obligatoire.", Response::HTTP_BAD_REQUEST);
            }
        }

        $region = $this->em->getRepository(\App\Entity\Region::class)->find((int) $data['region']);
        if (!$region) {
            return ApiResponse::error('Région non trouvée.', Response::HTTP_NOT_FOUND);
        }

        $ville = $this->em->getRepository(\App\Entity\Ville::class)->find((int) $data['ville']);
        if (!$ville) {
            return ApiResponse::error('Ville non trouvée.', Response::HTTP_NOT_FOUND);
        }

        $sexe = Sexe::tryFrom($data['sexe']);
        if (!$sexe) {
            return ApiResponse::error(' Sexe invalide. Valeurs acceptées : HOMME, FEMME.', Response::HTTP_BAD_REQUEST);
        }

        $avis = new AvisOfficiel();
        $avis->setNom($data['nom']);
        $avis->setPrenom($data['prenom']);
        $avis->setSexe($sexe);
        $avis->setAgeApprox((int) $data['ageApprox']);
        $avis->setDernierLieuVu($data['dernierLieuVu']);
        $avis->setDescription($data['description']);
        $avis->setDateDisparition(new \DateTimeImmutable($data['dateDisparition']));
        $avis->setTelephone($data['telephone']);
        $avis->setRegion($region);
        $avis->setVille($ville);
        $avis->setStatut(AvisStatut::RECHERCHE);
        $avis->setActif(true);
        $avis->setCommissariat($commissariat);

        if (!empty($data['circonstances'])) {
            $avis->setCirconstances($data['circonstances']);
        }
        if (!empty($data['tenueVestimentaire'])) {
            $avis->setTenueVestimentaire($data['tenueVestimentaire']);
        }
        if (!empty($data['signesParticuliers'])) {
            $avis->setSignesParticuliers($data['signesParticuliers']);
        }
        if (isset($data['taille'])) {
            $avis->setTaille((float) $data['taille']);
        }
        if (isset($data['poids'])) {
            $avis->setPoids((float) $data['poids']);
        }

        $this->em->persist($avis);
        $this->em->flush();

        $this->notificationService->notifyNouvelAvisRegion($avis, $user);

        return ApiResponse::created(
            $this->formatAvis($avis),
            'Avis de recherche publié avec succès.'
        );
    }

    #[Route('/avis/{id}/publier', name: 'api_commissariat_avis_publish', methods: ['POST'])]
    public function publishAvis(int $id): JsonResponse
    {
        $user = $this->getAuthUser();
        $commissariat = $this->getUserCommissariat($user);

        if (!$this->checkAvisOwnership($id, $commissariat->getId())) {
            return ApiResponse::error('Avis non trouvé ou accès interdit.', Response::HTTP_NOT_FOUND);
        }

        $avis = $this->em->getRepository(AvisRecherche::class)->find($id);
        if (!$avis) {
            return ApiResponse::error('Avis non trouvé.', Response::HTTP_NOT_FOUND);
        }

        if ($avis->getStatut() !== AvisStatut::BROUILLON) {
            return ApiResponse::error('Cet avis est déjà publié.', Response::HTTP_BAD_REQUEST);
        }

        if ($avis->getPhotos()->count() === 0) {
            return ApiResponse::error(
                'Ajoutez au moins une photo avant de publier l\'avis.',
                Response::HTTP_BAD_REQUEST
            );
        }

        $avis->setStatut(AvisStatut::RECHERCHE);
        $avis->setActif(true);
        $this->em->flush();

        $this->notificationService->notifyNouvelAvisRegion($avis, $user);

        return ApiResponse::success(
            $this->formatAvis($avis),
            'Avis publié avec succès.'
        );
    }

    // ──────────────────────────────────────────────
    // 3. Manage Own Avis
    // ──────────────────────────────────────────────

    #[Route('/avis', name: 'api_commissariat_avis_list', methods: ['GET'])]
    public function listAvis(Request $request): JsonResponse
    {
        $user = $this->getAuthUser();
        $commissariat = $this->getUserCommissariat($user);

        $page = max(1, (int) $request->query->get('page', 1));
        $limit = max(1, min(100, (int) $request->query->get('limit', 20)));
        $search = $request->query->get('search');
        $statut = $request->query->get('statut');

        $conn = $this->em->getConnection();
        $where = ['a.type = :type AND a.commissariat_id = :cid'];
        $params = ['type' => 'OFFICIEL', 'cid' => $commissariat->getId()];

        if ($search) {
            $where[] = '(a.nom LIKE :search OR a.prenom LIKE :search)';
            $params['search'] = '%' . $search . '%';
        }

        if ($statut) {
            $where[] = 'a.statut = :statut';
            $params['statut'] = $statut;
        }

        $whereClause = implode(' AND ', $where);

        $total = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM avis_recherche a WHERE {$whereClause}",
            $params
        );

        $offset = ($page - 1) * $limit;
        $rows = $conn->fetchAllAssociative(
            "SELECT a.id FROM avis_recherche a WHERE {$whereClause} ORDER BY a.created_at DESC LIMIT {$limit} OFFSET {$offset}",
            $params
        );

        $avis = [];
        foreach ($rows as $row) {
            $entity = $this->em->getRepository(AvisRecherche::class)->find((int) $row['id']);
            if ($entity) {
                $avis[] = $this->formatAvis($entity);
            }
        }

        return ApiResponse::paginated($avis, [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
        ]);
    }

    #[Route('/avis/{id}', name: 'api_commissariat_avis_show', methods: ['GET'])]
    public function showAvis(int $id): JsonResponse
    {
        $user = $this->getAuthUser();
        $commissariat = $this->getUserCommissariat($user);

        if (!$this->checkAvisOwnership($id, $commissariat->getId())) {
            return ApiResponse::error('Avis non trouvé ou accès interdit.', Response::HTTP_NOT_FOUND);
        }

        $avis = $this->em->getRepository(AvisRecherche::class)->find($id);
        if (!$avis) {
            return ApiResponse::error('Avis non trouvé.', Response::HTTP_NOT_FOUND);
        }

        return ApiResponse::success($this->formatAvis($avis));
    }

    #[Route('/avis/{id}', name: 'api_commissariat_avis_update', methods: ['PUT'])]
    public function updateAvis(int $id, Request $request): JsonResponse
    {
        $user = $this->getAuthUser();
        $commissariat = $this->getUserCommissariat($user);

        if (!$this->checkAvisOwnership($id, $commissariat->getId())) {
            return ApiResponse::error('Avis non trouvé ou accès interdit.', Response::HTTP_NOT_FOUND);
        }

        $avis = $this->em->getRepository(AvisRecherche::class)->find($id);
        if (!$avis) {
            return ApiResponse::error('Avis non trouvé.', Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['nom'])) {
            $avis->setNom($data['nom']);
        }
        if (isset($data['prenom'])) {
            $avis->setPrenom($data['prenom']);
        }
        if (isset($data['sexe'])) {
            $sexe = Sexe::tryFrom($data['sexe']);
            if ($sexe) {
                $avis->setSexe($sexe);
            }
        }
        if (isset($data['ageApprox'])) {
            $avis->setAgeApprox((int) $data['ageApprox']);
        }
        if (isset($data['dernierLieuVu'])) {
            $avis->setDernierLieuVu($data['dernierLieuVu']);
        }
        if (isset($data['description'])) {
            $avis->setDescription($data['description']);
        }
        if (isset($data['dateDisparition'])) {
            $avis->setDateDisparition(new \DateTimeImmutable($data['dateDisparition']));
        }
        if (isset($data['telephone'])) {
            $avis->setTelephone($data['telephone']);
        }
        if (isset($data['circonstances'])) {
            $avis->setCirconstances($data['circonstances']);
        }
        if (isset($data['tenueVestimentaire'])) {
            $avis->setTenueVestimentaire($data['tenueVestimentaire']);
        }
        if (isset($data['signesParticuliers'])) {
            $avis->setSignesParticuliers($data['signesParticuliers']);
        }
        if (isset($data['taille'])) {
            $avis->setTaille((float) $data['taille']);
        }
        if (isset($data['poids'])) {
            $avis->setPoids((float) $data['poids']);
        }

        if (isset($data['region'])) {
            $region = $this->em->getRepository(\App\Entity\Region::class)->find((int) $data['region']);
            if ($region) {
                $avis->setRegion($region);
            }
        }
        if (isset($data['ville'])) {
            $ville = $this->em->getRepository(\App\Entity\Ville::class)->find((int) $data['ville']);
            if ($ville) {
                $avis->setVille($ville);
            }
        }

        $avis->preUpdate();
        $this->em->flush();

        return ApiResponse::success($this->formatAvis($avis), 'Avis mis à jour avec succès.');
    }

    #[Route('/avis/{id}/archive', name: 'api_commissariat_avis_archive', methods: ['PATCH'])]
    public function archiveAvis(int $id): JsonResponse
    {
        $user = $this->getAuthUser();
        $commissariat = $this->getUserCommissariat($user);

        if (!$this->checkAvisOwnership($id, $commissariat->getId())) {
            return ApiResponse::error('Avis non trouvé ou accès interdit.', Response::HTTP_NOT_FOUND);
        }

        $avis = $this->em->getRepository(AvisRecherche::class)->find($id);
        if (!$avis) {
            return ApiResponse::error('Avis non trouvé.', Response::HTTP_NOT_FOUND);
        }

        $avis->setStatut(AvisStatut::RECHERCHE_CLOTUREE);
        $avis->setActif(false);
        $this->em->flush();

        return ApiResponse::success($this->formatAvis($avis), 'Avis archivé avec succès.');
    }

    #[Route('/avis/{id}', name: 'api_commissariat_avis_delete', methods: ['DELETE'])]
    public function deleteAvis(int $id): JsonResponse
    {
        $user = $this->getAuthUser();
        $commissariat = $this->getUserCommissariat($user);

        if (!$this->checkAvisOwnership($id, $commissariat->getId())) {
            return ApiResponse::error('Avis non trouvé ou accès interdit.', Response::HTTP_NOT_FOUND);
        }

        $avis = $this->em->getRepository(AvisRecherche::class)->find($id);
        if (!$avis) {
            return ApiResponse::error('Avis non trouvé.', Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($avis);
        $this->em->flush();

        return ApiResponse::success(null, 'Avis supprimé avec succès.');
    }

    // ──────────────────────────────────────────────
    // 4. Modify Avis Status
    // ──────────────────────────────────────────────

    #[Route('/avis/{id}/statut', name: 'api_commissariat_avis_statut', methods: ['PATCH'])]
    public function updateAvisStatut(int $id, Request $request): JsonResponse
    {
        $user = $this->getAuthUser();
        $commissariat = $this->getUserCommissariat($user);

        if (!$this->checkAvisOwnership($id, $commissariat->getId())) {
            return ApiResponse::error('Avis non trouvé ou accès interdit.', Response::HTTP_NOT_FOUND);
        }

        $avis = $this->em->getRepository(AvisRecherche::class)->find($id);
        if (!$avis) {
            return ApiResponse::error('Avis non trouvé.', Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $newStatut = $data['statut'] ?? null;

        if (!$newStatut) {
            return ApiResponse::error('Le champ "statut" est obligatoire.', Response::HTTP_BAD_REQUEST);
        }

        $allowed = [
            AvisStatut::RECHERCHE->value,
            AvisStatut::RETROUVE_VIVANT->value,
            AvisStatut::RETROUVE_DECEDE->value,
            AvisStatut::RECHERCHE_CLOTUREE->value,
        ];

        if (!in_array($newStatut, $allowed, true)) {
            return ApiResponse::error(
                'Statut invalide. Valeurs acceptées : ' . implode(', ', $allowed),
                Response::HTTP_BAD_REQUEST
            );
        }

        if ($newStatut === AvisStatut::RECHERCHE->value) {
            $this->notificationService->notifyNouvelAvisRegion($avis, $user);
        }

        $avis->setStatut(AvisStatut::from($newStatut));
        $avis->setActif($newStatut !== AvisStatut::RECHERCHE_CLOTUREE->value);
        $this->em->flush();

        return ApiResponse::success($this->formatAvis($avis), 'Statut mis à jour avec succès.');
    }

    // ──────────────────────────────────────────────
    // 5. View Signalements
    // ──────────────────────────────────────────────

    #[Route('/avis/{id}/signalements', name: 'api_commissariat_avis_signalements', methods: ['GET'])]
    public function listSignalementsForAvis(int $id, Request $request): JsonResponse
    {
        $user = $this->getAuthUser();
        $commissariat = $this->getUserCommissariat($user);

        if (!$this->checkAvisOwnership($id, $commissariat->getId())) {
            return ApiResponse::error('Avis non trouvé ou accès interdit.', Response::HTTP_NOT_FOUND);
        }

        $conn = $this->em->getConnection();
        $rows = $conn->fetchAllAssociative(
            'SELECT s.id FROM signalement s WHERE s.avis_recherche_id = :aid ORDER BY s.created_at DESC',
            ['aid' => $id]
        );

        $signalements = [];
        foreach ($rows as $row) {
            $entity = $this->em->getRepository(Signalement::class)->find((int) $row['id']);
            if ($entity) {
                $signalements[] = $this->formatSignalement($entity);
            }
        }

        return ApiResponse::success($signalements);
    }

    #[Route('/signalements', name: 'api_commissariat_signalements_all', methods: ['GET'])]
    public function listAllMySignalements(Request $request): JsonResponse
    {
        $user = $this->getAuthUser();
        $commissariat = $this->getUserCommissariat($user);

        $page = max(1, (int) $request->query->get('page', 1));
        $limit = max(1, min(100, (int) $request->query->get('limit', 20)));

        $conn = $this->em->getConnection();

        $total = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM signalement s
             INNER JOIN avis_recherche a ON a.id = s.avis_recherche_id
             WHERE a.type = :type AND a.commissariat_id = :cid",
            ['type' => 'OFFICIEL', 'cid' => $commissariat->getId()]
        );

        $offset = ($page - 1) * $limit;
        $rows = $conn->fetchAllAssociative(
            "SELECT s.id FROM signalement s
             INNER JOIN avis_recherche a ON a.id = s.avis_recherche_id
             WHERE a.type = :type AND a.commissariat_id = :cid
             ORDER BY s.created_at DESC
             LIMIT {$limit} OFFSET {$offset}",
            ['type' => 'OFFICIEL', 'cid' => $commissariat->getId()]
        );

        $signalements = [];
        foreach ($rows as $row) {
            $entity = $this->em->getRepository(Signalement::class)->find((int) $row['id']);
            if ($entity) {
                $signalements[] = $this->formatSignalement($entity);
            }
        }

        return ApiResponse::paginated($signalements, [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
        ]);
    }

    // ──────────────────────────────────────────────
    // 6. Moderate Signalements
    // ──────────────────────────────────────────────

    #[Route('/signalements/{id}/masquer', name: 'api_commissariat_signalement_masquer', methods: ['PATCH'])]
    public function masquerSignalement(int $id): JsonResponse
    {
        $user = $this->getAuthUser();
        $commissariat = $this->getUserCommissariat($user);

        $conn = $this->em->getConnection();
        $row = $conn->fetchAssociative(
            "SELECT s.id FROM signalement s
             INNER JOIN avis_recherche a ON a.id = s.avis_recherche_id
             WHERE s.id = :sid AND a.type = :type AND a.commissariat_id = :cid",
            ['sid' => $id, 'type' => 'OFFICIEL', 'cid' => $commissariat->getId()]
        );

        if (!$row) {
            return ApiResponse::error('Signalement non trouvé ou accès interdit.', Response::HTTP_NOT_FOUND);
        }

        $signalement = $this->em->getRepository(Signalement::class)->find($id);
        $signalement->setStatut(SignalementStatut::MASQUE);
        $this->em->flush();

        return ApiResponse::success($this->formatSignalement($signalement), 'Signalement masqué avec succès.');
    }

    #[Route('/signalements/{id}/demasquer', name: 'api_commissariat_signalement_demasquer', methods: ['PATCH'])]
    public function demasquerSignalement(int $id): JsonResponse
    {
        $user = $this->getAuthUser();
        $commissariat = $this->getUserCommissariat($user);

        $conn = $this->em->getConnection();
        $row = $conn->fetchAssociative(
            "SELECT s.id FROM signalement s
             INNER JOIN avis_recherche a ON a.id = s.avis_recherche_id
             WHERE s.id = :sid AND a.type = :type AND a.commissariat_id = :cid",
            ['sid' => $id, 'type' => 'OFFICIEL', 'cid' => $commissariat->getId()]
        );

        if (!$row) {
            return ApiResponse::error('Signalement non trouvé ou accès interdit.', Response::HTTP_NOT_FOUND);
        }

        $signalement = $this->em->getRepository(Signalement::class)->find($id);
        $signalement->setStatut(SignalementStatut::PUBLIE);
        $this->em->flush();

        return ApiResponse::success($this->formatSignalement($signalement), 'Signalement démasqué avec succès.');
    }

    // ──────────────────────────────────────────────
    // 10. Dashboard
    // ──────────────────────────────────────────────

    #[Route('/dashboard', name: 'api_commissariat_dashboard', methods: ['GET'])]
    public function dashboard(): JsonResponse
    {
        $user = $this->getAuthUser();
        $commissariat = $this->getUserCommissariat($user);

        $conn = $this->em->getConnection();
        $cid = $commissariat->getId();

        $avisActifs = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM avis_recherche WHERE type = :type AND commissariat_id = :cid AND statut = :statut",
            ['type' => 'OFFICIEL', 'cid' => $cid, 'statut' => AvisStatut::RECHERCHE->value]
        );

        $retrouves = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM avis_recherche WHERE type = :type AND commissariat_id = :cid AND statut IN (:s1, :s2)",
            ['type' => 'OFFICIEL', 'cid' => $cid, 's1' => AvisStatut::RETROUVE_VIVANT->value, 's2' => AvisStatut::RETROUVE_DECEDE->value]
        );

        $signalementsRecus = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM signalement s
             INNER JOIN avis_recherche a ON a.id = s.avis_recherche_id
             WHERE a.type = :type AND a.commissariat_id = :cid",
            ['type' => 'OFFICIEL', 'cid' => $cid]
        );

        $totalAvis = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM avis_recherche WHERE type = :type AND commissariat_id = :cid",
            ['type' => 'OFFICIEL', 'cid' => $cid]
        );

        $tauxResolution = $totalAvis > 0
            ? round(($retrouves / $totalAvis) * 100, 1)
            : 0.0;

        $historiqueRows = $conn->fetchAllAssociative(
            "SELECT a.id, a.nom, a.prenom, a.statut, a.created_at
             FROM avis_recherche a
             WHERE a.type = :type AND a.commissariat_id = :cid
             ORDER BY a.created_at DESC
             LIMIT 10",
            ['type' => 'OFFICIEL', 'cid' => $cid]
        );

        $historique = [];
        foreach ($historiqueRows as $row) {
            $historique[] = [
                'id' => (int) $row['id'],
                'nom' => $row['nom'],
                'prenom' => $row['prenom'],
                'statut' => $row['statut'],
                'createdAt' => $row['created_at'],
            ];
        }

        return ApiResponse::success([
            'commissariat_nom' => $commissariat->getNom(),
            'avis_actifs' => $avisActifs,
            'retrouves' => $retrouves,
            'signalements_recus' => $signalementsRecus,
            'taux_resolution' => $tauxResolution,
            'historique' => $historique,
        ]);
    }

    // ──────────────────────────────────────────────
    // 12. Statistics
    // ──────────────────────────────────────────────

    #[Route('/statistiques', name: 'api_commissariat_statistiques', methods: ['GET'])]
    public function statistiques(): JsonResponse
    {
        $user = $this->getAuthUser();
        $commissariat = $this->getUserCommissariat($user);

        $conn = $this->em->getConnection();
        $cid = $commissariat->getId();

        $avisCrees = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM avis_recherche WHERE type = :type AND commissariat_id = :cid",
            ['type' => 'OFFICIEL', 'cid' => $cid]
        );

        $avisActifs = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM avis_recherche WHERE type = :type AND commissariat_id = :cid AND statut = :statut",
            ['type' => 'OFFICIEL', 'cid' => $cid, 'statut' => AvisStatut::RECHERCHE->value]
        );

        $personnesRetrouvees = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM avis_recherche WHERE type = :type AND commissariat_id = :cid AND statut IN (:s1, :s2)",
            ['type' => 'OFFICIEL', 'cid' => $cid, 's1' => AvisStatut::RETROUVE_VIVANT->value, 's2' => AvisStatut::RETROUVE_DECEDE->value]
        );

        $tauxReussite = $avisCrees > 0
            ? round(($personnesRetrouvees / $avisCrees) * 100, 1)
            : 0.0;

        $signalementsRecus = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM signalement s
             INNER JOIN avis_recherche a ON a.id = s.avis_recherche_id
             WHERE a.type = :type AND a.commissariat_id = :cid",
            ['type' => 'OFFICIEL', 'cid' => $cid]
        );

        $evolutionRows = $conn->fetchAllAssociative(
            "SELECT
               DATE_FORMAT(a.created_at, '%Y-%m') AS mois,
               COUNT(*) AS creees,
               SUM(CASE WHEN a.statut = :actif THEN 1 ELSE 0 END) AS activees,
               SUM(CASE WHEN a.statut IN (:s1, :s2) THEN 1 ELSE 0 END) AS retrouves
             FROM avis_recherche a
             WHERE a.type = :type AND a.commissariat_id = :cid
               AND a.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
             GROUP BY mois
             ORDER BY mois ASC",
            [
                'type' => 'OFFICIEL',
                'cid' => $cid,
                'actif' => AvisStatut::RECHERCHE->value,
                's1' => AvisStatut::RETROUVE_VIVANT->value,
                's2' => AvisStatut::RETROUVE_DECEDE->value,
            ]
        );

        $evolutionMensuelle = [];
        foreach ($evolutionRows as $row) {
            $evolutionMensuelle[] = [
                'mois' => $row['mois'],
                'creees' => (int) $row['creees'],
                'activees' => (int) $row['activees'],
                'retrouves' => (int) $row['retrouves'],
            ];
        }

        $statusDistribution = $conn->fetchAllAssociative(
            "SELECT statut, COUNT(*) AS total
             FROM avis_recherche
             WHERE type = :type AND commissariat_id = :cid
             GROUP BY statut
             ORDER BY total DESC",
            ['type' => 'OFFICIEL', 'cid' => $cid]
        );

        return ApiResponse::success([
            'avis_crees' => $avisCrees,
            'avis_actifs' => $avisActifs,
            'personnes_retrouves' => $personnesRetrouvees,
            'taux_reussite' => $tauxReussite,
            'signalements_recus' => $signalementsRecus,
            'evolution_mensuelle' => $evolutionMensuelle,
            'status_distribution' => $statusDistribution,
        ]);
    }
}
