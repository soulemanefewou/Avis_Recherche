<?php

namespace App\Controller;

use App\Entity\Commissariat;
use App\Entity\Conversation;
use App\Entity\Message;
use App\Entity\Signalement;
use App\Entity\Utilisateur;
use App\Enum\AvisStatut;
use App\Enum\ConversationStatut;
use App\Enum\SignalementStatut;
use App\Enum\ValidationStatut;
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

#[Route('/api/super-admin')]
class SuperAdminController extends AbstractController
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
        $user = $this->getUser();
        $this->denyAccessUnlessGranted('ROLE_SUPER_ADMIN');
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

    private function formatCommissariat(Commissariat $c): array
    {
        return [
            'id' => $c->getId(),
            'nom' => $c->getNom(),
            'adresse' => $c->getAdresse(),
            'telephone' => $c->getTelephone(),
            'email' => $c->getEmail(),
            'responsable' => $c->getResponsable(),
            'actif' => $c->isActif(),
            'region' => $c->getRegion() ? ['id' => $c->getRegion()->getId(), 'nom' => $c->getRegion()->getNom()] : null,
            'ville' => $c->getVille() ? ['id' => $c->getVille()->getId(), 'nom' => $c->getVille()->getNom()] : null,
        ];
    }

    private function formatDemande($d): array
    {
        return [
            'id' => $d->getId(),
            'nom' => $d->getNom(),
            'adresse' => $d->getAdresse(),
            'telephone' => $d->getTelephone(),
            'email' => $d->getEmail(),
            'responsable' => $d->getResponsable(),
            'prenom' => $d->getUtilisateur()?->getPrenom(),
            'statut' => $d->getStatut()->value,
            'motifRejet' => $d->getMotifRejet(),
            'documentPath' => $d->getDocumentPath(),
            'documentNomOriginal' => $d->getDocumentNomOriginal(),
            'createdAt' => $d->getCreatedAt()?->format('c'),
            'traiteLe' => $d->getTraiteLe()?->format('c'),
            'region' => $d->getRegion() ? ['id' => $d->getRegion()->getId(), 'nom' => $d->getRegion()->getNom()] : null,
            'ville' => $d->getVille() ? ['id' => $d->getVille()->getId(), 'nom' => $d->getVille()->getNom()] : null,
        ];
    }

    // ──────────────────────────────────────────────
    // F. Dashboard
    // ──────────────────────────────────────────────

    #[Route('/dashboard', name: 'api_super_admin_dashboard', methods: ['GET'])]
    public function dashboard(): JsonResponse
    {
        $this->getAuthUser();
        $conn = $this->em->getConnection();

        $totalAvis = (int) $conn->fetchOne('SELECT COUNT(*) FROM avis_recherche WHERE actif = 1');
        $retrouves = (int) $conn->fetchOne(
            'SELECT COUNT(*) FROM avis_recherche WHERE statut IN (:s1, :s2)',
            ['s1' => AvisStatut::RETROUVE_VIVANT->value, 's2' => AvisStatut::RETROUVE_DECEDE->value]
        );
        $enAttenteValidation = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM avis_recherche WHERE type = 'CITOYEN' AND validation_statut = :s",
            ['s' => ValidationStatut::EN_ATTENTE->value]
        );
        $enAttenteConfirmation = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM avis_recherche WHERE statut = :s",
            ['s' => AvisStatut::RETROUVE_EN_ATTENTE_CONFIRMATION->value]
        );
        $totalSignalements = (int) $conn->fetchOne('SELECT COUNT(*) FROM signalement');
        $totalConversations = (int) $conn->fetchOne('SELECT COUNT(*) FROM conversation');
        $totalUsers = (int) $conn->fetchOne('SELECT COUNT(*) FROM utilisateur');
        $totalCommissariats = (int) $conn->fetchOne('SELECT COUNT(*) FROM commissariat');

        $parRegion = $conn->fetchAllAssociative(
            "SELECT r.nom, COUNT(a.id) as total FROM avis_recherche a JOIN region r ON a.region_id = r.id WHERE a.actif = 1 GROUP BY r.nom ORDER BY total DESC"
        );

        $parStatut = $conn->fetchAllAssociative(
            "SELECT statut, COUNT(*) as total FROM avis_recherche WHERE actif = 1 GROUP BY statut"
        );

        $recentActivity = $conn->fetchAllAssociative(
            "SELECT 'avis' as source, id, nom, prenom, created_at FROM avis_recherche ORDER BY created_at DESC LIMIT 10"
        );

        return ApiResponse::success([
            'stats' => [
                'avis_actifs' => $totalAvis,
                'retrouves' => $retrouves,
                'en_attente_validation' => $enAttenteValidation,
                'en_attente_confirmation' => $enAttenteConfirmation,
                'signalements' => $totalSignalements,
                'conversations' => $totalConversations,
                'utilisateurs' => $totalUsers,
                'commissariats' => $totalCommissariats,
            ],
            'par_region' => $parRegion,
            'par_statut' => $parStatut,
            'activite_recente' => $recentActivity,
        ]);
    }

    // ──────────────────────────────────────────────
    // A. Gestion des commissariats
    // ──────────────────────────────────────────────

    #[Route('/commissariats', name: 'api_super_admin_commissariats_list', methods: ['GET'])]
    public function listCommissariats(): JsonResponse
    {
        $this->getAuthUser();
        $all = $this->em->getRepository(Commissariat::class)->findBy([], ['id' => 'DESC']);
        $data = array_map(fn(Commissariat $c) => $this->formatCommissariat($c), $all);
        return ApiResponse::success($data);
    }

    #[Route('/commissariats', name: 'api_super_admin_commissariats_create', methods: ['POST'])]
    public function createCommissariat(Request $request): JsonResponse
    {
        $this->getAuthUser();
        $data = json_decode($request->getContent(), true);

        $nom = $data['nom'] ?? '';
        $adresse = $data['adresse'] ?? '';
        $telephone = $data['telephone'] ?? '';
        $email = $data['email'] ?? '';
        $responsable = $data['responsable'] ?? '';
        $regionId = $data['region'] ?? null;
        $villeId = $data['ville'] ?? null;

        if (!$nom || !$adresse || !$telephone || !$responsable || !$regionId || !$villeId) {
            return ApiResponse::error('Tous les champs obligatoires doivent être remplis.', Response::HTTP_BAD_REQUEST);
        }

        $region = $this->em->getRepository(\App\Entity\Region::class)->find($regionId);
        $ville = $this->em->getRepository(\App\Entity\Ville::class)->find($villeId);
        if (!$region || !$ville) {
            return ApiResponse::error('Région ou ville introuvable.', Response::HTTP_BAD_REQUEST);
        }

        $existing = $this->em->getRepository(Utilisateur::class)->findOneBy(['email' => $email]);
        if ($existing) {
            return ApiResponse::error('Cet email est déjà utilisé.', Response::HTTP_CONFLICT);
        }

        $utilisateur = new Utilisateur();
        $utilisateur->setNom($nom);
        $utilisateur->setPrenom($responsable);
        $utilisateur->setEmail($email);
        $utilisateur->setTelephone($telephone);
        $utilisateur->setRoles(['ROLE_COMMISSARIAT']);
        $utilisateur->setPassword($this->passwordHasher->hashPassword($utilisateur, 'commissariat123'));

        $commissariat = new Commissariat();
        $commissariat->setNom($nom);
        $commissariat->setAdresse($adresse);
        $commissariat->setTelephone($telephone);
        $commissariat->setEmail($email);
        $commissariat->setResponsable($responsable);
        $commissariat->setRegion($region);
        $commissariat->setVille($ville);
        $commissariat->setUtilisateur($utilisateur);

        $this->em->persist($utilisateur);
        $this->em->persist($commissariat);
        $this->em->flush();

        return ApiResponse::success($this->formatCommissariat($commissariat), 'Commissariat créé.', Response::HTTP_CREATED);
    }

    #[Route('/commissariats/{id}', name: 'api_super_admin_commissariats_show', methods: ['GET'])]
    public function showCommissariat(int $id): JsonResponse
    {
        $this->getAuthUser();
        $c = $this->em->getRepository(Commissariat::class)->find($id);
        if (!$c) {
            return ApiResponse::error('Commissariat introuvable.', Response::HTTP_NOT_FOUND);
        }
        return ApiResponse::success($this->formatCommissariat($c));
    }

    #[Route('/commissariats/{id}', name: 'api_super_admin_commissariats_update', methods: ['PUT'])]
    public function updateCommissariat(int $id, Request $request): JsonResponse
    {
        $this->getAuthUser();
        $c = $this->em->getRepository(Commissariat::class)->find($id);
        if (!$c) {
            return ApiResponse::error('Commissariat introuvable.', Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (isset($data['nom'])) $c->setNom($data['nom']);
        if (isset($data['adresse'])) $c->setAdresse($data['adresse']);
        if (isset($data['telephone'])) $c->setTelephone($data['telephone']);
        if (isset($data['email'])) $c->setEmail($data['email']);
        if (isset($data['responsable'])) $c->setResponsable($data['responsable']);

        $this->em->flush();
        return ApiResponse::success($this->formatCommissariat($c), 'Commissariat mis à jour.');
    }

    #[Route('/commissariats/{id}/desactiver', name: 'api_super_admin_commissariats_desactiver', methods: ['PATCH'])]
    public function deactivateCommissariat(int $id): JsonResponse
    {
        $this->getAuthUser();
        $c = $this->em->getRepository(Commissariat::class)->find($id);
        if (!$c) {
            return ApiResponse::error('Commissariat introuvable.', Response::HTTP_NOT_FOUND);
        }
        $c->setActif(false);
        $this->em->flush();
        return ApiResponse::success($this->formatCommissariat($c), 'Commissariat désactivé.');
    }

    #[Route('/commissariats/{id}/reactiver', name: 'api_super_admin_commissariats_reactiver', methods: ['PATCH'])]
    public function reactivateCommissariat(int $id): JsonResponse
    {
        $this->getAuthUser();
        $c = $this->em->getRepository(Commissariat::class)->find($id);
        if (!$c) {
            return ApiResponse::error('Commissariat introuvable.', Response::HTTP_NOT_FOUND);
        }
        $c->setActif(true);
        $this->em->flush();
        return ApiResponse::success($this->formatCommissariat($c), 'Commissariat réactivé.');
    }

    #[Route('/commissariats/{id}', name: 'api_super_admin_commissariats_delete', methods: ['DELETE'])]
    public function deleteCommissariat(int $id): JsonResponse
    {
        $this->getAuthUser();
        $c = $this->em->getRepository(Commissariat::class)->find($id);
        if (!$c) {
            return ApiResponse::error('Commissariat introuvable.', Response::HTTP_NOT_FOUND);
        }
        $this->em->remove($c);
        $this->em->flush();
        return ApiResponse::success(null, 'Commissariat supprimé.');
    }

    // ──────────────────────────────────────────────
    // A. Demandes de commissariat
    // ──────────────────────────────────────────────

    #[Route('/commissariat-demandes', name: 'api_super_admin_demandes_list', methods: ['GET'])]
    public function listDemandes(): JsonResponse
    {
        $this->getAuthUser();
        $all = $this->em->getRepository(\App\Entity\CommissariatDemande::class)->findBy([], ['createdAt' => 'DESC']);
        $data = array_map(fn($d) => $this->formatDemande($d), $all);
        return ApiResponse::success($data);
    }

    #[Route('/commissariat-demandes/{id}/valider', name: 'api_super_admin_demande_valider', methods: ['POST'])]
    public function validateDemande(int $id): JsonResponse
    {
        $this->getAuthUser();
        $demande = $this->em->getRepository(\App\Entity\CommissariatDemande::class)->find($id);
        if (!$demande) {
            return ApiResponse::error('Demande introuvable.', Response::HTTP_NOT_FOUND);
        }
        if ($demande->getStatut() !== ValidationStatut::EN_ATTENTE) {
            return ApiResponse::error('Cette demande a déjà été traitée.', Response::HTTP_BAD_REQUEST);
        }

        $utilisateur = $demande->getUtilisateur();
        $utilisateur->setRoles(['ROLE_COMMISSARIAT']);

        $commissariat = new Commissariat();
        $commissariat->setNom($demande->getNom());
        $commissariat->setAdresse($demande->getAdresse());
        $commissariat->setTelephone($demande->getTelephone());
        $commissariat->setEmail($demande->getEmail());
        $commissariat->setResponsable($demande->getResponsable());
        $commissariat->setRegion($demande->getRegion());
        $commissariat->setVille($demande->getVille());
        $commissariat->setUtilisateur($utilisateur);

        $demande->setStatut(ValidationStatut::VALIDE);
        $demande->setTraiteLe(new \DateTimeImmutable());

        $this->em->persist($commissariat);
        $this->em->flush();

        $this->notificationService->notifyDemandeValidation(
            $utilisateur,
            'Votre demande de compte commissariat a été validée. Vous pouvez maintenant vous connecter.'
        );

        return ApiResponse::success([
            'commissariat' => $this->formatCommissariat($commissariat),
            'utilisateur' => [
                'email' => $utilisateur->getEmail(),
                'nom' => $utilisateur->getNom(),
                'prenom' => $utilisateur->getPrenom(),
            ],
        ], 'Demande validée. Compte commissariat créé.');
    }

    #[Route('/commissariat-demandes/{id}/rejeter', name: 'api_super_admin_demande_rejeter', methods: ['POST'])]
    public function rejectDemande(int $id, Request $request): JsonResponse
    {
        $this->getAuthUser();
        $data = json_decode($request->getContent(), true);
        $motif = $data['motif'] ?? '';
        if (!$motif) {
            return ApiResponse::error('Le motif de rejet est obligatoire.', Response::HTTP_BAD_REQUEST);
        }
        $demande = $this->em->getRepository(\App\Entity\CommissariatDemande::class)->find($id);
        if (!$demande) {
            return ApiResponse::error('Demande introuvable.', Response::HTTP_NOT_FOUND);
        }
        $demande->setStatut(ValidationStatut::REJETE);
        $demande->setMotifRejet($motif);
        $demande->setTraiteLe(new \DateTimeImmutable());
        $this->em->flush();

        $this->notificationService->notifyDemandeValidation(
            $demande->getUtilisateur(),
            'Votre demande de compte commissariat a été rejetée. Motif : ' . $motif
        );

        return ApiResponse::success(null, 'Demande rejetée.');
    }

    // ──────────────────────────────────────────────
    // B. Gestion des avis citoyens
    // ──────────────────────────────────────────────

    #[Route('/avis-citoyens', name: 'api_super_admin_avis_citoyens', methods: ['GET'])]
    public function listAvisCitoyens(Request $request): JsonResponse
    {
        $this->getAuthUser();
        $conn = $this->em->getConnection();
        $page = max(1, (int) $request->query->get('page', 1));
        $limit = max(1, min(100, (int) $request->query->get('limit', 20)));
        $statut = $request->query->get('statut');
        $avisStatut = $request->query->get('avisStatut');
        $search = $request->query->get('search');

        $where = ["a.type = 'CITOYEN'"];
        $params = [];

        if ($statut) {
            $where[] = 'a.validation_statut = :statut';
            $params['statut'] = $statut;
        }
        if ($avisStatut) {
            $where[] = 'a.statut = :avisStatut';
            $params['avisStatut'] = $avisStatut;
        }
        if ($search) {
            $where[] = '(a.nom LIKE :s OR a.prenom LIKE :s OR a.description LIKE :s)';
            $params['s'] = '%' . $search . '%';
        }

        $whereClause = implode(' AND ', $where);
        $total = (int) $conn->fetchOne("SELECT COUNT(*) FROM avis_recherche a WHERE {$whereClause}", $params);
        $offset = ($page - 1) * $limit;

        $rows = $conn->fetchAllAssociative(
            "SELECT a.* FROM avis_recherche a WHERE {$whereClause} ORDER BY a.created_at DESC LIMIT {$limit} OFFSET {$offset}",
            $params
        );

        $data = [];
        foreach ($rows as $row) {
            $avis = $this->em->getRepository(\App\Entity\AvisRecherche::class)->find((int) $row['id']);
            if ($avis) {
                $item = [
                    'id' => $avis->getId(),
                    'nom' => $avis->getNom(),
                    'prenom' => $avis->getPrenom(),
                    'sexe' => $avis->getSexe()->value,
                    'ageApprox' => $avis->getAgeApprox(),
                    'description' => $avis->getDescription(),
                    'statut' => $avis->getStatut()->value,
                    'telephone' => $avis->getTelephone(),
                    'dernierLieuVu' => $avis->getDernierLieuVu(),
                    'dateDisparition' => $avis->getDateDisparition()?->format('c'),
                    'createdAt' => $avis->getCreatedAt()?->format('c'),
                    'type' => $avis->getType(),
                ];
                if ($avis instanceof \App\Entity\AvisCitoyen) {
                    $item['validationStatut'] = $avis->getValidationStatut()->value;
                    $item['motifRejet'] = $avis->getMotifRejet();
                    $item['suiviActif'] = $avis->isSuiviActif();
                    $item['auteur'] = $avis->getAuteur() ? [
                        'id' => $avis->getAuteur()->getId(),
                        'nom' => $avis->getAuteur()->getNom(),
                        'prenom' => $avis->getAuteur()->getPrenom(),
                        'email' => $avis->getAuteur()->getEmail(),
                    ] : null;
                    $pieces = [];
                    foreach ($avis->getPiecesJustificatives() as $p) {
                        $pieces[] = [
                            'id' => $p->getId(),
                            'type' => $p->getType(),
                            'nomOriginal' => $p->getNomOriginal(),
                            'taille' => $p->getTaille(),
                        ];
                    }
                    $item['piecesJustificatives'] = $pieces;
                }
                $photos = [];
                foreach ($avis->getPhotos() as $ph) {
                    $photos[] = $this->photoMapper->toArray($ph);
                }
                $item['photos'] = $photos;
                $data[] = $item;
            }
        }

        return ApiResponse::paginated($data, [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
        ]);
    }

    #[Route('/avis-citoyens/{id}', name: 'api_super_admin_avis_citoyen_show', methods: ['GET'])]
    public function showAvisCitoyen(int $id): JsonResponse
    {
        $this->getAuthUser();
        $avis = $this->em->getRepository(\App\Entity\AvisRecherche::class)->find($id);
        if (!$avis) {
            return ApiResponse::error('Avis introuvable.', Response::HTTP_NOT_FOUND);
        }

        $item = [
            'id' => $avis->getId(),
            'nom' => $avis->getNom(),
            'prenom' => $avis->getPrenom(),
            'sexe' => $avis->getSexe()->value,
            'ageApprox' => $avis->getAgeApprox(),
            'description' => $avis->getDescription(),
            'circonstances' => $avis->getCirconstances(),
            'tenueVestimentaire' => $avis->getTenueVestimentaire(),
            'signesParticuliers' => $avis->getSignesParticuliers(),
            'taille' => $avis->getTaille(),
            'poids' => $avis->getPoids(),
            'statut' => $avis->getStatut()->value,
            'telephone' => $avis->getTelephone(),
            'dernierLieuVu' => $avis->getDernierLieuVu(),
            'dateDisparition' => $avis->getDateDisparition()?->format('c'),
            'createdAt' => $avis->getCreatedAt()?->format('c'),
            'type' => $avis->getType(),
        ];

        if ($avis instanceof \App\Entity\AvisCitoyen) {
            $item['validationStatut'] = $avis->getValidationStatut()->value;
            $item['motifRejet'] = $avis->getMotifRejet();
            $item['auteur'] = $avis->getAuteur() ? $this->formatUser($avis->getAuteur()) : null;
            $pieces = [];
            foreach ($avis->getPiecesJustificatives() as $p) {
                $pieces[] = [
                    'id' => $p->getId(),
                    'type' => $p->getType(),
                    'nomOriginal' => $p->getNomOriginal(),
                    'chemin' => $p->getChemin(),
                    'mimeType' => $p->getMimeType(),
                    'taille' => $p->getTaille(),
                ];
            }
            $item['piecesJustificatives'] = $pieces;
        }

        $photos = [];
        foreach ($avis->getPhotos() as $ph) {
            $photos[] = $this->photoMapper->toArray($ph);
        }
        $item['photos'] = $photos;

        return ApiResponse::success($item);
    }

    #[Route('/avis-citoyens/{id}/valider', name: 'api_super_admin_avis_valider', methods: ['POST'])]
    public function validerAvisCitoyen(int $id): JsonResponse
    {
        $this->getAuthUser();
        $avis = $this->em->getRepository(\App\Entity\AvisRecherche::class)->find($id);
        if (!$avis || !($avis instanceof \App\Entity\AvisCitoyen)) {
            return ApiResponse::error('Avis citoyen introuvable.', Response::HTTP_NOT_FOUND);
        }
        $avis->setValidationStatut(ValidationStatut::VALIDE);
        $avis->setDateValidation(new \DateTimeImmutable());
        $avis->setStatut(AvisStatut::RECHERCHE);
        $this->em->flush();

        if ($avis->getAuteur() !== null) {
            $this->notificationService->notifyAvisCitoyenPublie($avis->getAuteur(), $avis);
            $this->notificationService->notifyNouvelAvisRegion($avis, $avis->getAuteur());
        }

        return ApiResponse::success(null, 'Avis validé et publié.');
    }

    #[Route('/avis-citoyens/{id}/rejeter', name: 'api_super_admin_avis_rejeter', methods: ['POST'])]
    public function rejeterAvisCitoyen(int $id, Request $request): JsonResponse
    {
        $this->getAuthUser();
        $data = json_decode($request->getContent(), true);
        $motif = $data['motif'] ?? '';
        if (!$motif) {
            return ApiResponse::error('Le motif de rejet est obligatoire.', Response::HTTP_BAD_REQUEST);
        }
        $avis = $this->em->getRepository(\App\Entity\AvisRecherche::class)->find($id);
        if (!$avis || !($avis instanceof \App\Entity\AvisCitoyen)) {
            return ApiResponse::error('Avis citoyen introuvable.', Response::HTTP_NOT_FOUND);
        }
        $avis->setValidationStatut(ValidationStatut::REJETE);
        $avis->setMotifRejet($motif);
        $avis->setStatut(AvisStatut::REJETE);
        $this->em->flush();

        if ($avis->getAuteur() !== null) {
            $this->notificationService->notifyAvisCitoyenRejete($avis->getAuteur(), $avis, $motif);
        }

        return ApiResponse::success(null, 'Avis rejeté.');
    }

    // ──────────────────────────────────────────────
    // C. Confirmation statut Retrouvé
    // ──────────────────────────────────────────────

    #[Route('/avis/{id}/confirmer-retrouve', name: 'api_super_admin_confirmer_retrouve', methods: ['POST'])]
    public function confirmerRetrouve(int $id, Request $request): JsonResponse
    {
        $this->getAuthUser();
        $data = json_decode($request->getContent(), true);
        $avis = $this->em->getRepository(\App\Entity\AvisRecherche::class)->find($id);
        if (!$avis) {
            return ApiResponse::error('Avis introuvable.', Response::HTTP_NOT_FOUND);
        }
        if ($avis->getStatut() !== AvisStatut::RETROUVE_EN_ATTENTE_CONFIRMATION) {
            return ApiResponse::error('Cet avis n\'est pas en attente de confirmation.', Response::HTTP_BAD_REQUEST);
        }

        $confirme = $data['confirme'] ?? false;
        if ($confirme) {
            $nouveauStatut = $data['statut'] ?? AvisStatut::RETROUVE_VIVANT->value;
            $avis->setStatut(AvisStatut::from($nouveauStatut));
        } else {
            $avis->setStatut(AvisStatut::RECHERCHE);
        }
        $this->em->flush();

        if ($avis instanceof \App\Entity\AvisCitoyen && $avis->getAuteur() !== null) {
            $this->notificationService->notifyRetrouveConfirme(
                $avis->getAuteur(),
                $avis,
                $avis->getStatut()->label()
            );
        }

        return ApiResponse::success(null, $confirme ? 'Statut retrouvé confirmé.' : 'Retour au statut recherché.');
    }

    // ──────────────────────────────────────────────
    // D. Modération
    // ──────────────────────────────────────────────

    #[Route('/signalements', name: 'api_super_admin_signalements', methods: ['GET'])]
    public function listSignalements(Request $request): JsonResponse
    {
        $this->getAuthUser();
        $conn = $this->em->getConnection();
        $page = max(1, (int) $request->query->get('page', 1));
        $limit = max(1, min(100, (int) $request->query->get('limit', 20)));
        $statut = $request->query->get('statut');

        $where = [];
        $params = [];
        if ($statut) {
            $where[] = 's.statut = :statut';
            $params['statut'] = $statut;
        }
        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $total = (int) $conn->fetchOne("SELECT COUNT(*) FROM signalement s {$whereClause}", $params);
        $offset = ($page - 1) * $limit;

        $rows = $conn->fetchAllAssociative(
            "SELECT s.* FROM signalement s {$whereClause} ORDER BY s.created_at DESC LIMIT {$limit} OFFSET {$offset}",
            $params
        );

        $data = [];
        foreach ($rows as $row) {
            $s = $this->em->getRepository(Signalement::class)->find((int) $row['id']);
            if ($s) {
                $data[] = [
                    'id' => $s->getId(),
                    'description' => $s->getDescription(),
                    'lieu' => $s->getLieu(),
                    'dateObservation' => $s->getDateObservation()?->format('c'),
                    'telephoneContact' => $s->getTelephoneContact(),
                    'statut' => $s->getStatut()->value,
                    'createdAt' => $s->getCreatedAt()?->format('c'),
                    'utilisateur' => [
                        'id' => $s->getUtilisateur()->getId(),
                        'nom' => $s->getUtilisateur()->getNom(),
                        'prenom' => $s->getUtilisateur()->getPrenom(),
                    ],
                    'avisRecherche' => [
                        'id' => $s->getAvisRecherche()->getId(),
                        'nom' => $s->getAvisRecherche()->getNom(),
                        'prenom' => $s->getAvisRecherche()->getPrenom(),
                    ],
                ];
            }
        }
        return ApiResponse::paginated($data, ['page' => $page, 'limit' => $limit, 'total' => $total]);
    }

    #[Route('/signalements/{id}/masquer', name: 'api_super_admin_signalement_masquer', methods: ['PATCH'])]
    public function masquerSignalement(int $id): JsonResponse
    {
        $this->getAuthUser();
        $s = $this->em->getRepository(Signalement::class)->find($id);
        if (!$s) {
            return ApiResponse::error('Signalement introuvable.', Response::HTTP_NOT_FOUND);
        }
        $s->setStatut(SignalementStatut::MASQUE);
        $this->em->flush();
        return ApiResponse::success(null, 'Signalement masqué.');
    }

    #[Route('/signalements/{id}', name: 'api_super_admin_signalement_delete', methods: ['DELETE'])]
    public function deleteSignalement(int $id): JsonResponse
    {
        $this->getAuthUser();
        $s = $this->em->getRepository(Signalement::class)->find($id);
        if (!$s) {
            return ApiResponse::error('Signalement introuvable.', Response::HTTP_NOT_FOUND);
        }
        $this->em->remove($s);
        $this->em->flush();
        return ApiResponse::success(null, 'Signalement supprimé.');
    }

    #[Route('/avis/{id}/masquer', name: 'api_super_admin_avis_masquer', methods: ['PATCH'])]
    public function masquerAvis(int $id): JsonResponse
    {
        $this->getAuthUser();
        $avis = $this->em->getRepository(\App\Entity\AvisRecherche::class)->find($id);
        if (!$avis) {
            return ApiResponse::error('Avis introuvable.', Response::HTTP_NOT_FOUND);
        }
        $avis->setActif(false);
        $this->em->flush();
        return ApiResponse::success(null, 'Avis masqué.');
    }

    #[Route('/avis/{id}', name: 'api_super_admin_avis_delete', methods: ['DELETE'])]
    public function deleteAvis(int $id): JsonResponse
    {
        $this->getAuthUser();
        $avis = $this->em->getRepository(\App\Entity\AvisRecherche::class)->find($id);
        if (!$avis) {
            return ApiResponse::error('Avis introuvable.', Response::HTTP_NOT_FOUND);
        }
        $this->em->remove($avis);
        $this->em->flush();
        return ApiResponse::success(null, 'Avis supprimé.');
    }

    #[Route('/messages/signales', name: 'api_super_admin_messages_signales', methods: ['GET'])]
    public function listMessagesSignales(): JsonResponse
    {
        $this->getAuthUser();
        $conn = $this->em->getConnection();
        $rows = $conn->fetchAllAssociative(
            "SELECT m.id FROM message m WHERE m.signale_par_id IS NOT NULL ORDER BY m.created_at DESC"
        );
        $data = [];
        foreach ($rows as $row) {
            $m = $this->em->getRepository(Message::class)->find((int) $row['id']);
            if ($m) {
                $data[] = [
                    'id' => $m->getId(),
                    'contenu' => $m->getContenu(),
                    'createdAt' => $m->getCreatedAt()?->format('c'),
                    'auteur' => [
                        'id' => $m->getAuteur()->getId(),
                        'nom' => $m->getAuteur()->getNom(),
                        'prenom' => $m->getAuteur()->getPrenom(),
                    ],
                    'signalePar' => [
                        'id' => $m->getSignalePar()->getId(),
                        'nom' => $m->getSignalePar()->getNom(),
                        'prenom' => $m->getSignalePar()->getPrenom(),
                    ],
                ];
            }
        }
        return ApiResponse::success($data);
    }

    #[Route('/messages/{id}', name: 'api_super_admin_message_delete', methods: ['DELETE'])]
    public function deleteMessage(int $id): JsonResponse
    {
        $this->getAuthUser();
        $m = $this->em->getRepository(Message::class)->find($id);
        if (!$m) {
            return ApiResponse::error('Message introuvable.', Response::HTTP_NOT_FOUND);
        }
        $this->em->remove($m);
        $this->em->flush();
        return ApiResponse::success(null, 'Message supprimé.');
    }

    // ──────────────────────────────────────────────
    // E. Conversations
    // ──────────────────────────────────────────────

    #[Route('/conversations', name: 'api_super_admin_conversations', methods: ['GET'])]
    public function listConversations(Request $request): JsonResponse
    {
        $this->getAuthUser();
        $statut = $request->query->get('statut');
        $conn = $this->em->getConnection();

        $where = [];
        $params = [];
        if ($statut) {
            $where[] = 'c.statut = :statut';
            $params['statut'] = $statut;
        }
        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $rows = $conn->fetchAllAssociative(
            "SELECT c.id, c.statut, c.type, c.created_at, c.last_message_at,
                    a.id as avis_id, a.nom as avis_nom, a.prenom as avis_prenom,
                    cs.id as cs_id, cs.nom as cs_nom, cs.prenom as cs_prenom,
                    pa.id as pa_id, pa.nom as pa_nom, pa.prenom as pa_prenom
             FROM conversation c
             JOIN avis_recherche a ON c.avis_recherche_id = a.id
             JOIN utilisateur cs ON c.createur_signalement_id = cs.id
             JOIN utilisateur pa ON c.proprietaire_avis_id = pa.id
             {$whereClause}
             ORDER BY c.last_message_at DESC",
            $params
        );

        $data = [];
        foreach ($rows as $row) {
            $conv = $this->em->getRepository(Conversation::class)->find((int) $row['id']);
            $msgCount = $conv ? $conv->getMessages()->count() : 0;
            $data[] = [
                'id' => (int) $row['id'],
                'statut' => $row['statut'],
                'type' => $row['type'],
                'createdAt' => $row['created_at'],
                'lastMessageAt' => $row['last_message_at'],
                'messageCount' => $msgCount,
                'avis' => ['id' => (int) $row['avis_id'], 'nom' => $row['avis_nom'], 'prenom' => $row['avis_prenom']],
                'createurSignalement' => ['id' => (int) $row['cs_id'], 'nom' => $row['cs_nom'], 'prenom' => $row['cs_prenom']],
                'proprietaireAvis' => ['id' => (int) $row['pa_id'], 'nom' => $row['pa_nom'], 'prenom' => $row['pa_prenom']],
            ];
        }
        return ApiResponse::success($data);
    }

    #[Route('/conversations/{id}/cloturer', name: 'api_super_admin_conversation_cloturer', methods: ['PATCH'])]
    public function cloturerConversation(int $id): JsonResponse
    {
        $this->getAuthUser();
        $conv = $this->em->getRepository(Conversation::class)->find($id);
        if (!$conv) {
            return ApiResponse::error('Conversation introuvable.', Response::HTTP_NOT_FOUND);
        }
        $conv->setStatut(ConversationStatut::ARCHIVEE);
        $this->em->flush();
        return ApiResponse::success(null, 'Conversation clôturée.');
    }

    // ──────────────────────────────────────────────
    // G. Consultation
    // ──────────────────────────────────────────────

    #[Route('/avis', name: 'api_super_admin_avis_all', methods: ['GET'])]
    public function listAllAvis(Request $request): JsonResponse
    {
        $this->getAuthUser();
        $conn = $this->em->getConnection();
        $page = max(1, (int) $request->query->get('page', 1));
        $limit = max(1, min(100, (int) $request->query->get('limit', 20)));
        $type = $request->query->get('type');
        $statut = $request->query->get('statut');
        $search = $request->query->get('search');

        $where = ['a.actif = 1'];
        $params = [];
        if ($type) { $where[] = "a.type = :type"; $params['type'] = $type; }
        if ($statut) { $where[] = "a.statut = :statut"; $params['statut'] = $statut; }
        if ($search) { $where[] = "(a.nom LIKE :s OR a.prenom LIKE :s)"; $params['s'] = '%' . $search . '%'; }
        $whereClause = implode(' AND ', $where);

        $total = (int) $conn->fetchOne("SELECT COUNT(*) FROM avis_recherche a WHERE {$whereClause}", $params);
        $offset = ($page - 1) * $limit;
        $rows = $conn->fetchAllAssociative(
            "SELECT a.id, a.nom, a.prenom, a.sexe, a.age_approx, a.statut, a.type, a.dernier_lieu_vu, a.created_at, a.validation_statut
             FROM avis_recherche a WHERE {$whereClause} ORDER BY a.created_at DESC LIMIT {$limit} OFFSET {$offset}",
            $params
        );

        return ApiResponse::paginated($rows, ['page' => $page, 'limit' => $limit, 'total' => $total]);
    }

    #[Route('/utilisateurs', name: 'api_super_admin_utilisateurs', methods: ['GET'])]
    public function listUtilisateurs(Request $request): JsonResponse
    {
        $this->getAuthUser();
        $conn = $this->em->getConnection();
        $page = max(1, (int) $request->query->get('page', 1));
        $limit = max(1, min(100, (int) $request->query->get('limit', 20)));

        $total = (int) $conn->fetchOne('SELECT COUNT(*) FROM utilisateur');
        $offset = ($page - 1) * $limit;
        $rows = $conn->fetchAllAssociative(
            "SELECT id, nom, prenom, email, telephone, actif, created_at FROM utilisateur ORDER BY id DESC LIMIT {$limit} OFFSET {$offset}"
        );

        return ApiResponse::paginated($rows, ['page' => $page, 'limit' => $limit, 'total' => $total]);
    }
}
