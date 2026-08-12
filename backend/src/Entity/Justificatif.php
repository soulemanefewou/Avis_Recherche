<?php

namespace App\Entity;

use App\Enum\JustificatifType;
use App\Repository\JustificatifRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: JustificatifRepository::class)]
class Justificatif
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: 'string', enumType: JustificatifType::class)]
    #[Assert\NotNull]
    private ?JustificatifType $type = null;

    #[ORM\Column(length: 255)]
    private ?string $nomOriginal = null;

    #[ORM\Column(length: 255)]
    private ?string $nomFichier = null;

    #[ORM\Column(length: 255)]
    private ?string $chemin = null;

    #[ORM\Column(length: 255)]
    private ?string $mimeType = null;

    #[ORM\Column(type: 'integer')]
    private ?int $taille = null;

    #[ORM\ManyToOne(inversedBy: 'piecesJustificatives')]
    #[ORM\JoinColumn(nullable: false)]
    private ?AvisCitoyen $avisCitoyen = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getType(): ?JustificatifType
    {
        return $this->type;
    }

    public function setType(JustificatifType $type): static
    {
        $this->type = $type;
        return $this;
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

    public function getAvisCitoyen(): ?AvisCitoyen
    {
        return $this->avisCitoyen;
    }

    public function setAvisCitoyen(?AvisCitoyen $avisCitoyen): static
    {
        $this->avisCitoyen = $avisCitoyen;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }
}
