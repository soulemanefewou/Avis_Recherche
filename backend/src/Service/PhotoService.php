<?php

namespace App\Service;

use App\Repository\PhotoRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Filesystem\Filesystem;
use App\Entity\AvisRecherche;
use App\Entity\Photo;
use App\Entity\Utilisateur;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Uid\Uuid;
use App\Exception\MaxPhotosReachedException;
use App\Exception\InvalidFileTypeException;
use App\Exception\FileTooLargeException;
use App\Exception\PhotoNotFoundException;


class PhotoService
{

    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    private const MAX_PHOTOS = 5;

    private const MAX_FILE_SIZE = 5 * 1024 * 1024;

    private function generateFileName(UploadedFile $fichier): string
    {
        return Uuid::v4()->toRfc4122() . '.' . $fichier->guessExtension();
    }

    private function createUploadDirectory(
        AvisRecherche $avisRecherche
    ): string
    {
        $directory = $this->uploadsDirectory
            . '/avis-recherches/'
            . $avisRecherche->getId();

        if (!$this->filesystem->exists($directory)) {
            $this->filesystem->mkdir($directory);
        }

        return $directory;
    }

    private function checkPhotoLimit(
        AvisRecherche $avisRecherche
    ): void
    {
        if ($avisRecherche->getPhotos()->count() >= self::MAX_PHOTOS ) {
            throw new MaxPhotosReachedException();
        }
    }

    private function validateFile(
        UploadedFile $fichier
    ): void
    {
        if (!in_array(
            $fichier->getMimeType(),
            self::ALLOWED_MIME_TYPES,
            true
        )) {
            throw new InvalidFileTypeException();
        }

        if ($fichier->getSize() > self::MAX_FILE_SIZE) {
            throw new FileTooLargeException();
        }
    }

    private function createPhotoEntity(
        AvisRecherche $avisRecherche,
        string $nomOriginal,
        string $mimeType,
        int $taille,
        string $fileName
    ): Photo
    {
        $photo = new Photo();

        $photo->setNomOriginal($nomOriginal);

        $photo->setNomFichier($fileName);

        $photo->setChemin(
            'uploads/avis-recherches/'
            . $avisRecherche->getId()
            . '/'
            . $fileName
        );

        $photo->setMimeType($mimeType);

        $photo->setTaille($taille);

        $photo->setAvisRecherche($avisRecherche);

        return $photo;
    }

    private function getAbsolutePath(Photo $photo): string
    {
        return $this->uploadsDirectory . DIRECTORY_SEPARATOR .
            str_replace(
                'uploads' . DIRECTORY_SEPARATOR,
                '',
                str_replace(
                    '/',
                    DIRECTORY_SEPARATOR,
                    $photo->getChemin()
                )
            );
    }

    private function resetMainPhoto(
        AvisRecherche $avisRecherche
    ): void
    {
        foreach ($avisRecherche->getPhotos() as $photo) {
            $photo->setEstPrincipale(false);
        }
    }

    public function __construct(
        private PhotoRepository $photoRepository,
        private EntityManagerInterface $entityManager,
        private Filesystem $filesystem,
        private AuthorizationService $authorizationService,

        #[Autowire('%uploads_directory%')]
        private string $uploadsDirectory
    ) {
    }

    public function upload(
        AvisRecherche $avisRecherche,
        UploadedFile $fichier,
        Utilisateur $utilisateur
    ): Photo
    {
        $this->authorizationService->ensureCanEditAvis($avisRecherche, $utilisateur);

        $this->checkPhotoLimit($avisRecherche);

        $this->validateFile($fichier);

        $directory = $this->createUploadDirectory($avisRecherche);

        $mimeType = $fichier->getMimeType();
        $taille = $fichier->getSize();
        $nomOriginal = $fichier->getClientOriginalName();

        $fileName = $this->generateFileName($fichier);

        $fichier->move($directory, $fileName);

       $photo = $this->createPhotoEntity(
            $avisRecherche,
            $nomOriginal,
            $mimeType,
            $taille,
            $fileName
        );

        if ($avisRecherche->getPhotos()->isEmpty()) {
            $photo->setEstPrincipale(true);
        }

        $this->entityManager->persist($photo);

        $this->entityManager->flush();

        return $photo;
       
    }

    public function findByAvisRecherche(
        AvisRecherche $avisRecherche
    ): array
    {
        return $this->photoRepository->findBy(
            [
                'avisRecherche' => $avisRecherche
            ],
            [
                'id' => 'ASC'
            ]
        );
    }

    public function delete(
        Photo $photo,
        Utilisateur $utilisateur
    ): void
    {
        $etaitPrincipale = $photo->isEstPrincipale();

        $avisRecherche = $photo->getAvisRecherche();

        $this->authorizationService->ensureCanDeletePhoto($photo, $utilisateur);
        $path = $this->getAbsolutePath($photo);

        if (file_exists($path)) {
            unlink($path);
        }

        $this->entityManager->remove($photo);

        $photosRestantes = $this->photoRepository->findBy(
            ['avisRecherche' => $avisRecherche],
            ['id' => 'ASC']
        );

        $photosRestantes = array_filter(
            $photosRestantes,
            fn(Photo $p) => $p !== $photo
        );

        if ($etaitPrincipale && !empty($photosRestantes)) {
            $nouvellePhotoPrincipale = reset($photosRestantes);
            $nouvellePhotoPrincipale->setEstPrincipale(true);
        }

        $this->entityManager->flush();
    }

    public function findById(int $id): Photo
    {
        $photo = $this->photoRepository->find($id);

        if (!$photo) {
            throw new PhotoNotFoundException();
        }

        return $photo;
    }

    public function defineAsMain(
        Photo $photo,
        Utilisateur $utilisateur
    ): void
    {
        $this->authorizationService->ensureCanDeletePhoto($photo, $utilisateur);

        $avisRecherche = $photo->getAvisRecherche();

        $this->resetMainPhoto($avisRecherche);

        $photo->setEstPrincipale(true);

        $this->entityManager->flush();
    }


}
