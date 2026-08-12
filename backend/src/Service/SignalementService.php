<?php

namespace App\Service;

use App\Mapper\SignalementMapper;
use App\Repository\SignalementRepository;
use Doctrine\ORM\EntityManagerInterface;
use App\DTO\SignalementDTO;
use App\Entity\AvisRecherche;
use App\Entity\Signalement;
use App\Entity\Utilisateur;
use App\Enum\SignalementStatut;
use App\Exception\SignalementNotFoundException;
use App\Exception\InvalidFileTypeException;
use App\Exception\FileTooLargeException;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Uid\Uuid;

class SignalementService
{
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    private const MAX_FILE_SIZE = 5 * 1024 * 1024;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly SignalementRepository $signalementRepository,
        private readonly SignalementMapper $signalementMapper,
        private readonly NotificationService $notificationService,
        private readonly Filesystem $filesystem,

        #[Autowire('%uploads_directory%')]
        private readonly string $uploadsDirectory,

        #[Autowire('%app_base_url%')]
        private readonly string $baseUrl,
    ) {
    }

    public function uploadPhoto(UploadedFile $fichier, Utilisateur $utilisateur): array
    {
        $this->validateFile($fichier);

        $directory = $this->uploadsDirectory . '/signalements/' . $utilisateur->getId();
        if (!$this->filesystem->exists($directory)) {
            $this->filesystem->mkdir($directory);
        }

        $fileName = Uuid::v4()->toRfc4122() . '.' . $fichier->guessExtension();
        $fichier->move($directory, $fileName);

        $chemin = 'uploads/signalements/' . $utilisateur->getId() . '/' . $fileName;

        return [
            'url' => $this->baseUrl . '/' . $chemin,
            'chemin' => $chemin,
        ];
    }

    private function validateFile(UploadedFile $fichier): void
    {
        if (!in_array($fichier->getMimeType(), self::ALLOWED_MIME_TYPES, true)) {
            throw new InvalidFileTypeException();
        }

        if ($fichier->getSize() > self::MAX_FILE_SIZE) {
            throw new FileTooLargeException();
        }
    }

    public function create(SignalementDTO $dto, AvisRecherche $avisRecherche, Utilisateur $utilisateur): array
    {
        $signalement = new Signalement();
        $signalement->setDescription($dto->description);
        $signalement->setLieu($dto->lieu);
        $signalement->setDateObservation($dto->dateObservation);
        $signalement->setHeureObservation($dto->heureObservation);
        $signalement->setTelephoneContact($dto->telephoneContact);
        $signalement->setCommentaireSupplementaire($dto->commentaireSupplementaire);
        $signalement->setPhoto($dto->photo);
        $signalement->setVideo($dto->video);
        $signalement->setPieceJointe($dto->pieceJointe);
        $signalement->setUrgent($dto->urgent);
        $signalement->setUtilisateur($utilisateur);
        $signalement->setAvisRecherche($avisRecherche);
        $signalement->setStatut(SignalementStatut::PUBLIE);

        $this->entityManager->persist($signalement);
        $this->entityManager->flush();

        $this->notificationService->notifyNouveauSignalement($avisRecherche, $dto->urgent);

        return $this->signalementMapper->toArray($signalement);
    }

    public function getPublicByAvisRecherche(AvisRecherche $avisRecherche): array
    {
        $signalements = $this->signalementRepository->findBy(
            ['avisRecherche' => $avisRecherche, 'statut' => SignalementStatut::PUBLIE]
        );
        return array_map(
            fn(Signalement $s) => $this->signalementMapper->toArrayPublic($s),
            $signalements
        );
    }

    public function getPrivateByAvisRecherche(AvisRecherche $avisRecherche): array
    {
        $signalements = $this->signalementRepository->findByAvisRecherche($avisRecherche);
        return array_map(
            fn(Signalement $s) => $this->signalementMapper->toArrayPrivate($s),
            $signalements
        );
    }

    public function getById(int $id): array
    {
        $signalement = $this->signalementRepository->find($id);
        if (!$signalement) {
            throw new SignalementNotFoundException();
        }
        return $this->signalementMapper->toArray($signalement);
    }

    public function hide(int $id): void
    {
        $signalement = $this->signalementRepository->find($id);
        if (!$signalement) {
            throw new SignalementNotFoundException();
        }
        $signalement->setStatut(SignalementStatut::MASQUE);
        $this->entityManager->flush();
    }

    public function delete(int $id, Utilisateur $utilisateur): void
    {
        $signalement = $this->signalementRepository->find($id);
        if (!$signalement) {
            throw new SignalementNotFoundException();
        }
        $this->entityManager->remove($signalement);
        $this->entityManager->flush();
    }
}
