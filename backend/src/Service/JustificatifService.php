<?php

namespace App\Service;

use App\Entity\AvisCitoyen;
use App\Entity\Justificatif;
use App\Enum\JustificatifType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Uid\Uuid;

class JustificatifService
{
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
    ];

    private const MAX_FILE_SIZE = 5 * 1024 * 1024;

    public function __construct(
        private EntityManagerInterface $entityManager,
        private Filesystem $filesystem,
        #[Autowire('%uploads_directory%')]
        private string $uploadsDirectory,
    ) {
    }

    public function upload(AvisCitoyen $avisCitoyen, UploadedFile $fichier, JustificatifType $type): Justificatif
    {
        if (!in_array($fichier->getMimeType(), self::ALLOWED_MIME_TYPES, true)) {
            throw new \InvalidArgumentException('Type de fichier non autorisé.');
        }
        if ($fichier->getSize() > self::MAX_FILE_SIZE) {
            throw new \InvalidArgumentException('Fichier trop volumineux (max 5 Mo).');
        }

        $directory = $this->uploadsDirectory . '/justificatifs/' . $avisCitoyen->getId();
        if (!$this->filesystem->exists($directory)) {
            $this->filesystem->mkdir($directory);
        }

        $fileName = Uuid::v4()->toRfc4122() . '.' . $fichier->guessExtension();
        $fichier->move($directory, $fileName);

        $justificatif = new Justificatif();
        $justificatif->setType($type);
        $justificatif->setNomOriginal($fichier->getClientOriginalName());
        $justificatif->setNomFichier($fileName);
        $justificatif->setChemin('uploads/justificatifs/' . $avisCitoyen->getId() . '/' . $fileName);
        $justificatif->setMimeType($fichier->getMimeType());
        $justificatif->setTaille($fichier->getSize());
        $justificatif->setAvisCitoyen($avisCitoyen);

        $avisCitoyen->addPieceJustificative($justificatif);

        $this->entityManager->persist($justificatif);
        $this->entityManager->flush();

        return $justificatif;
    }

    public function deletePiecesForAvis(AvisCitoyen $avisCitoyen): void
    {
        foreach ($avisCitoyen->getPiecesJustificatives() as $piece) {
            $path = $this->uploadsDirectory . '/' . ltrim($piece->getChemin(), '/');
            if ($this->filesystem->exists($path)) {
                $this->filesystem->remove($path);
            }
            $this->entityManager->remove($piece);
        }
        $avisCitoyen->getPiecesJustificatives()->clear();
        $this->entityManager->flush();
    }
}
