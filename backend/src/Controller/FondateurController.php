<?php

namespace App\Controller;

use App\Entity\Commissariat;
use App\Entity\Conversation;
use App\Entity\Notification;
use App\Entity\Signalement;
use App\Entity\Utilisateur;
use App\Enum\AvisStatut;
use App\Response\ApiResponse;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/fondateur')]
class FondateurController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
        private NotificationService $notificationService,
    ) {
    }

    private function getAuthUser(): Utilisateur
    {
        /** @var Utilisateur|null */
        $user = $this->getUser();
        $this->denyAccessUnlessGranted('ROLE_FONDATEUR');

        return $user;
    }

    private function findUser(int $id): ?Utilisateur
    {
        return $this->em->getRepository(Utilisateur::class)->find($id);
    }

    private function formatUser(Utilisateur $u): array
    {
        return [
            'id' => $u->getId(),
            'nom' => $u->getNom(),
            'prenom' => $u->getPrenom(),
            'email' => $u->getEmail(),
            'telephone' => $u->getTelephone(),
            'roles' => $u->getRoles(),
            'actif' => $u->isActif(),
            'createdAt' => $u->getCreatedAt()?->format('c'),
        ];
    }

    // ──────────────────────────────────────────────
    // 1. Dashboard
    // ──────────────────────────────────────────────

    #[Route('/dashboard', name: 'api_fondateur_dashboard', methods: ['GET'])]
    public function dashboard(): JsonResponse
    {
        $this->getAuthUser();

        $conn = $this->em->getConnection();

        $totalUtilisateurs = (int) $conn->fetchOne('SELECT COUNT(*) FROM utilisateur');
        $superAdmins = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM utilisateur WHERE CAST(roles AS text) LIKE :role",
            ['role' => '%ROLE_SUPER_ADMIN%']
        );
        $totalCommissariats = (int) $conn->fetchOne('SELECT COUNT(*) FROM commissariat');

        $totalAvis = (int) $conn->fetchOne('SELECT COUNT(*) FROM avis_recherche');
        $officiels = (int) $conn->fetchOne("SELECT COUNT(*) FROM avis_recherche WHERE type = 'OFFICIEL'");
        $citoyens = (int) $conn->fetchOne("SELECT COUNT(*) FROM avis_recherche WHERE type = 'CITOYEN'");
        $retrouves = (int) $conn->fetchOne(
            'SELECT COUNT(*) FROM avis_recherche WHERE statut IN (:s1, :s2)',
            ['s1' => AvisStatut::RETROUVE_VIVANT->value, 's2' => AvisStatut::RETROUVE_DECEDE->value]
        );
        $enAttente = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM avis_recherche WHERE type = 'CITOYEN' AND validation_statut = :statut",
            ['statut' => \App\Enum\ValidationStatut::EN_ATTENTE->value]
        );

        $totalSignalements = (int) $conn->fetchOne('SELECT COUNT(*) FROM signalement');
        $totalConversations = (int) $conn->fetchOne('SELECT COUNT(*) FROM conversation');
        $totalNotifications = (int) $conn->fetchOne('SELECT COUNT(*) FROM notification');

        $uploadsPath = $this->getParameter('kernel.project_dir') . '/public/uploads';
        $usedMb = 0.0;
        $freeMb = 0.0;
        if (is_dir($uploadsPath)) {
            $total = @disk_total_space($uploadsPath) ?: 0;
            $free = @disk_free_space($uploadsPath) ?: 0;
            $usedMb = round(($total - $free) / 1024 / 1024, 2);
            $freeMb = round($free / 1024 / 1024, 2);
        }

        return ApiResponse::success([
            'utilisateurs' => $totalUtilisateurs,
            'super_admins' => $superAdmins,
            'commissariats' => $totalCommissariats,
            'avis' => [
                'total' => $totalAvis,
                'officiels' => $officiels,
                'citoyens' => $citoyens,
                'retrouves' => $retrouves,
                'en_attente' => $enAttente,
            ],
            'signalements' => $totalSignalements,
            'conversations' => $totalConversations,
            'notifications' => $totalNotifications,
            'storage' => [
                'used_mb' => $usedMb,
                'free_mb' => $freeMb,
            ],
        ]);
    }

    // ──────────────────────────────────────────────
    // 2. List users (paginated)
    // ──────────────────────────────────────────────

    #[Route('/utilisateurs', name: 'api_fondateur_utilisateurs_list', methods: ['GET'])]
    public function listUsers(Request $request): JsonResponse
    {
        $this->getAuthUser();

        $page = max(1, (int) $request->query->get('page', 1));
        $limit = max(1, min(100, (int) $request->query->get('limit', 20)));
        $search = $request->query->get('search');
        $role = $request->query->get('role');

        $conn = $this->em->getConnection();
        $where = [];
        $params = [];

        if ($search) {
            $where[] = '(u.nom LIKE :s OR u.prenom LIKE :s OR u.email LIKE :s OR u.telephone LIKE :s)';
            $params['s'] = '%' . $search . '%';
        }

        if ($role) {
            $where[] = 'CAST(u.roles AS text) LIKE :role';
            $params['role'] = '%' . $role . '%';
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $total = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM utilisateur u {$whereClause}",
            $params
        );

        $offset = ($page - 1) * $limit;
        $rows = $conn->fetchAllAssociative(
            "SELECT * FROM utilisateur u {$whereClause} ORDER BY u.id DESC LIMIT {$limit} OFFSET {$offset}",
            $params
        );

        $users = [];
        foreach ($rows as $row) {
            $user = $this->em->getRepository(Utilisateur::class)->find((int) $row['id']);
            if ($user) {
                $users[] = $this->formatUser($user);
            }
        }

        return ApiResponse::paginated($users, [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
        ]);
    }

    // ──────────────────────────────────────────────
    // 3. Get single user
    // ──────────────────────────────────────────────

    #[Route('/utilisateurs/{id}', name: 'api_fondateur_utilisateurs_show', methods: ['GET'])]
    public function showUser(int $id): JsonResponse
    {
        $this->getAuthUser();

        $user = $this->findUser($id);
        if (!$user) {
            return ApiResponse::error('Utilisateur non trouvé.', Response::HTTP_NOT_FOUND);
        }

        return ApiResponse::success($this->formatUser($user));
    }

    // ──────────────────────────────────────────────
    // 4. Update user
    // ──────────────────────────────────────────────

    #[Route('/utilisateurs/{id}', name: 'api_fondateur_utilisateurs_update', methods: ['PUT'])]
    public function updateUser(int $id, Request $request): JsonResponse
    {
        $this->getAuthUser();

        $user = $this->findUser($id);
        if (!$user) {
            return ApiResponse::error('Utilisateur non trouvé.', Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['nom'])) {
            $user->setNom($data['nom']);
        }
        if (isset($data['prenom'])) {
            $user->setPrenom($data['prenom']);
        }
        if (isset($data['telephone'])) {
            $user->setTelephone($data['telephone']);
        }
        if (isset($data['email'])) {
            $existing = $this->em->getRepository(Utilisateur::class)
                ->findOneBy(['email' => $data['email']]);
            if ($existing && $existing->getId() !== $id) {
                return ApiResponse::error('Cet email est déjà utilisé.', Response::HTTP_CONFLICT);
            }
            $user->setEmail($data['email']);
        }

        $this->em->flush();

        return ApiResponse::success($this->formatUser($user), 'Utilisateur mis à jour.');
    }

    // ──────────────────────────────────────────────
    // 5. Change user roles
    // ──────────────────────────────────────────────

    #[Route('/utilisateurs/{id}/roles', name: 'api_fondateur_utilisateurs_roles', methods: ['PATCH'])]
    public function changeUserRoles(int $id, Request $request): JsonResponse
    {
        $this->getAuthUser();

        $user = $this->findUser($id);
        if (!$user) {
            return ApiResponse::error('Utilisateur non trouvé.', Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $roles = $data['roles'] ?? null;

        if (!is_array($roles) || count($roles) !== 1) {
            return ApiResponse::error('Un seul rôle doit être fourni.', Response::HTTP_BAD_REQUEST);
        }

        $allowed = ['ROLE_USER', 'ROLE_COMMISSARIAT', 'ROLE_SUPER_ADMIN', 'ROLE_FONDATEUR'];
        foreach ($roles as $r) {
            if (!in_array($r, $allowed, true)) {
                return ApiResponse::error("Rôle invalide : {$r}", Response::HTTP_BAD_REQUEST);
            }
        }

        $user->setRoles($roles);
        $this->em->flush();

        return ApiResponse::success($this->formatUser($user), 'Rôles mis à jour.');
    }

    // ──────────────────────────────────────────────
    // 6. Deactivate user
    // ──────────────────────────────────────────────

    #[Route('/utilisateurs/{id}/desactiver', name: 'api_fondateur_utilisateurs_desactiver', methods: ['PATCH'])]
    public function deactivateUser(int $id): JsonResponse
    {
        $utilisateur = $this->getAuthUser();

        if ($utilisateur->getId() === $id) {
            return ApiResponse::error('Vous ne pouvez pas vous désactiver vous-même.', Response::HTTP_FORBIDDEN);
        }

        $user = $this->findUser($id);
        if (!$user) {
            return ApiResponse::error('Utilisateur non trouvé.', Response::HTTP_NOT_FOUND);
        }

        $user->setActif(false);
        $this->em->flush();

        $this->notificationService->notifyCompteDesactive($user);

        return ApiResponse::success($this->formatUser($user), 'Utilisateur désactivé.');
    }

    // ──────────────────────────────────────────────
    // 7. Reactivate user
    // ──────────────────────────────────────────────

    #[Route('/utilisateurs/{id}/reactiver', name: 'api_fondateur_utilisateurs_reactiver', methods: ['PATCH'])]
    public function reactivateUser(int $id): JsonResponse
    {
        $this->getAuthUser();

        $user = $this->findUser($id);
        if (!$user) {
            return ApiResponse::error('Utilisateur non trouvé.', Response::HTTP_NOT_FOUND);
        }

        $user->setActif(true);
        $this->em->flush();

        $this->notificationService->notifyCompteReactive($user);

        return ApiResponse::success($this->formatUser($user), 'Utilisateur réactivé.');
    }

    // ──────────────────────────────────────────────
    // 8. Create Super Admin
    // ──────────────────────────────────────────────

    #[Route('/super-admins', name: 'api_fondateur_super_admins_create', methods: ['POST'])]
    public function createSuperAdmin(Request $request): JsonResponse
    {
        $this->getAuthUser();

        $data = json_decode($request->getContent(), true);

        $nom = $data['nom'] ?? '';
        $prenom = $data['prenom'] ?? '';
        $email = $data['email'] ?? '';
        $telephone = $data['telephone'] ?? '';
        $password = $data['password'] ?? '';

        if (!$nom || !$prenom || !$email || !$telephone || !$password) {
            return ApiResponse::error('Tous les champs sont obligatoires.', Response::HTTP_BAD_REQUEST);
        }

        $existing = $this->em->getRepository(Utilisateur::class)->findOneBy(['email' => $email]);
        if ($existing) {
            return ApiResponse::error('Cet email est déjà utilisé.', Response::HTTP_CONFLICT);
        }

        $superAdmin = new Utilisateur();
        $superAdmin->setNom($nom);
        $superAdmin->setPrenom($prenom);
        $superAdmin->setEmail($email);
        $superAdmin->setTelephone($telephone);
        $superAdmin->setRoles(['ROLE_SUPER_ADMIN']);
        $superAdmin->setPassword($this->passwordHasher->hashPassword($superAdmin, $password));

        $this->em->persist($superAdmin);
        $this->em->flush();

        $this->notificationService->notifySystem('Nouveau Super Admin créé.');

        return ApiResponse::success($this->formatUser($superAdmin), 'Super Admin créé avec succès.', Response::HTTP_CREATED);
    }

    // ──────────────────────────────────────────────
    // 9. List Super Admins
    // ──────────────────────────────────────────────

    #[Route('/super-admins', name: 'api_fondateur_super_admins_list', methods: ['GET'])]
    public function listSuperAdmins(): JsonResponse
    {
        $this->getAuthUser();

        // NB : JSON_CONTAINS est MySQL/MariaDB et n'existe pas sous PostgreSQL.
        // On filtre via CAST(roles AS text) LIKE, portable PostgreSQL.
        $conn = $this->em->getConnection();
        $rows = $conn->fetchAllAssociative(
            "SELECT id FROM utilisateur u
             WHERE CAST(u.roles AS text) LIKE :role
               AND CAST(u.roles AS text) NOT LIKE :fondateur
             ORDER BY u.id DESC",
            [
                'role' => '%ROLE_SUPER_ADMIN%',
                'fondateur' => '%ROLE_FONDATEUR%',
            ]
        );

        $admins = [];
        foreach ($rows as $row) {
            $user = $this->em->getRepository(Utilisateur::class)->find((int) $row['id']);
            if ($user) {
                $admins[] = $this->formatUser($user);
            }
        }

        return ApiResponse::success($admins);
    }

    // ──────────────────────────────────────────────
    // 10. Get single Super Admin
    // ──────────────────────────────────────────────

    #[Route('/super-admins/{id}', name: 'api_fondateur_super_admins_show', methods: ['GET'])]
    public function showSuperAdmin(int $id): JsonResponse
    {
        $this->getAuthUser();

        $user = $this->findUser($id);
        if (!$user || !in_array('ROLE_SUPER_ADMIN', $user->getRoles(), true)) {
            return ApiResponse::error('Super Admin non trouvé.', Response::HTTP_NOT_FOUND);
        }

        return ApiResponse::success($this->formatUser($user));
    }

    // ──────────────────────────────────────────────
    // 12. Deactivate Super Admin
    // ──────────────────────────────────────────────

    #[Route('/super-admins/{id}/desactiver', name: 'api_fondateur_super_admins_desactiver', methods: ['PATCH'])]
    public function deactivateSuperAdmin(int $id): JsonResponse
    {
        $utilisateur = $this->getAuthUser();

        if ($utilisateur->getId() === $id) {
            return ApiResponse::error('Vous ne pouvez pas vous désactiver vous-même.', Response::HTTP_FORBIDDEN);
        }

        $user = $this->findUser($id);
        if (!$user || !in_array('ROLE_SUPER_ADMIN', $user->getRoles(), true)) {
            return ApiResponse::error('Super Admin non trouvé.', Response::HTTP_NOT_FOUND);
        }

        $user->setActif(false);
        $this->em->flush();

        return ApiResponse::success($this->formatUser($user), 'Super Admin désactivé.');
    }

    // ──────────────────────────────────────────────
    // 13. Reactivate Super Admin
    // ──────────────────────────────────────────────

    #[Route('/super-admins/{id}/reactiver', name: 'api_fondateur_super_admins_reactiver', methods: ['PATCH'])]
    public function reactivateSuperAdmin(int $id): JsonResponse
    {
        $this->getAuthUser();

        $user = $this->findUser($id);
        if (!$user || !in_array('ROLE_SUPER_ADMIN', $user->getRoles(), true)) {
            return ApiResponse::error('Super Admin non trouvé.', Response::HTTP_NOT_FOUND);
        }

        $user->setActif(true);
        $this->em->flush();

        return ApiResponse::success($this->formatUser($user), 'Super Admin réactivé.');
    }

    // ──────────────────────────────────────────────
    // 14. Delete Super Admin
    // ──────────────────────────────────────────────

    #[Route('/super-admins/{id}', name: 'api_fondateur_super_admins_delete', methods: ['DELETE'])]
    public function deleteSuperAdmin(int $id): JsonResponse
    {
        $utilisateur = $this->getAuthUser();

        if ($utilisateur->getId() === $id) {
            return ApiResponse::error('Vous ne pouvez pas vous supprimer vous-même.', Response::HTTP_FORBIDDEN);
        }

        $user = $this->findUser($id);
        if (!$user || !in_array('ROLE_SUPER_ADMIN', $user->getRoles(), true)) {
            return ApiResponse::error('Super Admin non trouvé.', Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($user);
        $this->em->flush();

        return ApiResponse::success(null, 'Super Admin supprimé.');
    }

}
