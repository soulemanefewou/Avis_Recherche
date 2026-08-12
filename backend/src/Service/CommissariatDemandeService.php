<?php

namespace App\Service;

use App\DTO\CreateCommissariatDemandeDTO;
use App\Entity\CommissariatDemande;
use App\Entity\Utilisateur;
use App\Enum\ValidationStatut;
use App\Repository\CommissariatDemandeRepository;
use App\Repository\RegionRepository;
use App\Repository\VilleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Uid\Uuid;

class CommissariatDemandeService
{
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
    ];

    private const MAX_FILE_SIZE = 10 * 1024 * 1024;

    public function __construct(
        private EntityManagerInterface $entityManager,
        private CommissariatDemandeRepository $repository,
        private RegionRepository $regionRepository,
        private VilleRepository $villeRepository,
        private NotificationService $notificationService,
        private UserPasswordHasherInterface $passwordHasher,
        private Filesystem $filesystem,
    ) {
    }

    public function create(CreateCommissariatDemandeDTO $dto, UploadedFile $fichier): CommissariatDemande
    {
        $region = $this->regionRepository->find($dto->region);
        if (!$region) {
            throw new \InvalidArgumentException('Région introuvable.');
        }
        $ville = $this->villeRepository->find($dto->ville);
        if (!$ville) {
            throw new \InvalidArgumentException('Ville introuvable.');
        }

        if (!in_array($fichier->getMimeType(), self::ALLOWED_MIME_TYPES, true)) {
            throw new \InvalidArgumentException('Type de fichier non autorisé. Formats acceptés : JPEG, PNG, WEBP, PDF.');
        }
        if ($fichier->getSize() > self::MAX_FILE_SIZE) {
            throw new \InvalidArgumentException('Fichier trop volumineux (max 10 Mo).');
        }

        $utilisateur = new Utilisateur();
        $utilisateur->setNom($dto->nom);
        $utilisateur->setPrenom($dto->prenom);
        $utilisateur->setEmail($dto->email);
        $utilisateur->setTelephone($dto->telephone);
        $utilisateur->setRoles(['ROLE_USER']);
        $utilisateur->setPassword($this->passwordHasher->hashPassword($utilisateur, $dto->motDePasse));

        $demande = new CommissariatDemande();
        $demande->setNom($dto->nom);
        $demande->setAdresse($dto->adresse);
        $demande->setTelephone($dto->telephone);
        $demande->setEmail($dto->email);
        $demande->setResponsable($dto->responsable);
        $demande->setRegion($region);
        $demande->setVille($ville);
        $demande->setUtilisateur($utilisateur);
        $demande->setStatut(ValidationStatut::EN_ATTENTE);

        $this->entityManager->persist($utilisateur);
        $this->entityManager->flush();

        $directory = 'uploads/justificatifs/demandes/' . $utilisateur->getId();
        $fullDirectory = $this->filesystem->isAbsolutePath($directory)
            ? $directory
            : dirname(__DIR__, 2) . '/public/' . $directory;
        if (!$this->filesystem->exists($fullDirectory)) {
            $this->filesystem->mkdir($fullDirectory);
        }

        $fileName = Uuid::v4()->toRfc4122() . '.' . $fichier->guessExtension();
        $fichier->move($fullDirectory, $fileName);

        $demande->setDocumentPath($directory . '/' . $fileName);
        $demande->setDocumentNomOriginal($fichier->getClientOriginalName());

        $this->entityManager->persist($demande);
        $this->entityManager->flush();

        $this->notificationService->notifyDemandeCommissariatAValider($demande);

        return $demande;
    }

    public function findAll(): array
    {
        return $this->repository->findBy([], ['createdAt' => 'DESC']);
    }

    public function findById(int $id): CommissariatDemande
    {
        $demande = $this->repository->find($id);
        if (!$demande) {
            throw new \RuntimeException('Demande introuvable.', 404);
        }
        return $demande;
    }

    public function validate(int $id): CommissariatDemande
    {
        $demande = $this->findById($id);
        $demande->setStatut(ValidationStatut::VALIDE);
        $demande->setTraiteLe(new \DateTimeImmutable());
        $this->entityManager->flush();

        $this->notificationService->notifyDemandeValidation(
            $demande->getUtilisateur(),
            'Votre demande de compte commissariat a été validée. Vous pouvez maintenant vous connecter avec votre email et mot de passe.'
        );

        return $demande;
    }

    public function reject(int $id, string $motif): void
    {
        $demande = $this->findById($id);
        $demande->setStatut(ValidationStatut::REJETE);
        $demande->setMotifRejet($motif);
        $demande->setTraiteLe(new \DateTimeImmutable());
        $this->entityManager->flush();

        $this->notificationService->notifyDemandeValidation(
            $demande->getUtilisateur(),
            'Votre demande de compte commissariat a été rejetée. Motif : ' . $motif
        );
    }
}
