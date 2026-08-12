<?php

namespace App\Entity;

use App\Enum\ValidationStatut;
use App\Repository\CommissariatDemandeRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CommissariatDemandeRepository::class)]
class CommissariatDemande
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private ?string $nom = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private ?string $adresse = null;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank]
    private ?string $telephone = null;

    #[ORM\Column(length: 255)]
    #[Assert\Email]
    #[Assert\NotBlank]
    private ?string $email = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private ?string $responsable = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $documentPath = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $documentNomOriginal = null;

    #[ORM\Column(type: 'string', enumType: ValidationStatut::class)]
    private ValidationStatut $statut = ValidationStatut::EN_ATTENTE;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $motifRejet = null;

    #[ORM\ManyToOne(inversedBy: 'demandesCommissariat')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $utilisateur = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?Region $region = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?Ville $ville = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $traiteLe = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): static
    {
        $this->nom = $nom;
        return $this;
    }

    public function getAdresse(): ?string
    {
        return $this->adresse;
    }

    public function setAdresse(string $adresse): static
    {
        $this->adresse = $adresse;
        return $this;
    }

    public function getTelephone(): ?string
    {
        return $this->telephone;
    }

    public function setTelephone(string $telephone): static
    {
        $this->telephone = $telephone;
        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;
        return $this;
    }

    public function getResponsable(): ?string
    {
        return $this->responsable;
    }

    public function setResponsable(string $responsable): static
    {
        $this->responsable = $responsable;
        return $this;
    }

    public function getDocumentPath(): ?string
    {
        return $this->documentPath;
    }

    public function setDocumentPath(?string $documentPath): static
    {
        $this->documentPath = $documentPath;
        return $this;
    }

    public function getDocumentNomOriginal(): ?string
    {
        return $this->documentNomOriginal;
    }

    public function setDocumentNomOriginal(?string $documentNomOriginal): static
    {
        $this->documentNomOriginal = $documentNomOriginal;
        return $this;
    }

    public function getStatut(): ValidationStatut
    {
        return $this->statut;
    }

    public function setStatut(ValidationStatut $statut): static
    {
        $this->statut = $statut;
        return $this;
    }

    public function getMotifRejet(): ?string
    {
        return $this->motifRejet;
    }

    public function setMotifRejet(?string $motifRejet): static
    {
        $this->motifRejet = $motifRejet;
        return $this;
    }

    public function getUtilisateur(): ?Utilisateur
    {
        return $this->utilisateur;
    }

    public function setUtilisateur(?Utilisateur $utilisateur): static
    {
        $this->utilisateur = $utilisateur;
        return $this;
    }

    public function getRegion(): ?Region
    {
        return $this->region;
    }

    public function setRegion(?Region $region): static
    {
        $this->region = $region;
        return $this;
    }

    public function getVille(): ?Ville
    {
        return $this->ville;
    }

    public function setVille(?Ville $ville): static
    {
        $this->ville = $ville;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getTraiteLe(): ?\DateTimeImmutable
    {
        return $this->traiteLe;
    }

    public function setTraiteLe(?\DateTimeImmutable $traiteLe): static
    {
        $this->traiteLe = $traiteLe;
        return $this;
    }
}
