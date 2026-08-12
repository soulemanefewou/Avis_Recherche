<?php

namespace App\Entity;

use App\Repository\PhotoRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PhotoRepository::class)]
class Photo
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $nomOriginal = null;

    #[ORM\Column(length: 255)]
    private ?string $nomFichier = null;

    #[ORM\Column(length: 255)]
    private ?string $chemin = null;

    #[ORM\Column(length: 255)]
    private ?string $mimeType = null;

    #[ORM\Column]
    private ?int $taille = null;

    #[ORM\Column]
    private bool $estPrincipale = false;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\ManyToOne(inversedBy: 'photos')]
    #[ORM\JoinColumn(nullable: false)]
    private ?AvisRecherche $avisRecherche = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->estPrincipale = false;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNomOriginal(): ?string
    {
        return $this->nomOriginal;
    }

    public function setNomOriginal(string $nomOriginal): static
    {
        $this->nomOriginal = $nomOriginal;

        return $this;
    }

    public function getNomFichier(): ?string
    {
        return $this->nomFichier;
    }

    public function setNomFichier(string $nomFichier): static
    {
        $this->nomFichier = $nomFichier;

        return $this;
    }

    public function getChemin(): ?string
    {
        return $this->chemin;
    }

    public function setChemin(string $chemin): static
    {
        $this->chemin = $chemin;

        return $this;
    }

    public function getMimeType(): ?string
    {
        return $this->mimeType;
    }

    public function setMimeType(string $mimeType): static
    {
        $this->mimeType = $mimeType;

        return $this;
    }

    public function getTaille(): ?int
    {
        return $this->taille;
    }

    public function setTaille(int $taille): static
    {
        $this->taille = $taille;

        return $this;
    }

    public function isEstPrincipale(): bool
    {
        return $this->estPrincipale;
    }

    public function setEstPrincipale(bool $estPrincipale): static
    {
        $this->estPrincipale = $estPrincipale;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getAvisRecherche(): ?AvisRecherche
    {
        return $this->avisRecherche;
    }

    public function setAvisRecherche(?AvisRecherche $avisRecherche): static
    {
        $this->avisRecherche = $avisRecherche;

        return $this;
    }
}
