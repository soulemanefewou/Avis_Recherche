<?php

namespace App\Entity;

use App\Repository\SignalementRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Enum\SignalementStatut;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: SignalementRepository::class)]
class Signalement
{
    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->statut = SignalementStatut::PUBLIE;
        $this->urgent = false;
    }

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[Assert\NotBlank]
    #[Assert\Length(min: 10, max: 2000)]
    #[ORM\Column(type: Types::TEXT)]
    private ?string $description = null;

    #[Assert\NotBlank]
    #[ORM\Column(length: 255)]
    private ?string $lieu = null;

    #[Assert\NotBlank]
    #[ORM\Column]
    private ?\DateTimeImmutable $dateObservation = null;

    #[ORM\Column(length: 30, nullable: true)]
    private ?string $heureObservation = null;

    #[ORM\Column(length: 30, nullable: true)]
    private ?string $telephoneContact = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $commentaireSupplementaire = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $photo = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $video = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $pieceJointe = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(enumType: SignalementStatut::class)]
    private ?SignalementStatut $statut = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?bool $urgent = null;

    #[ORM\ManyToOne(inversedBy: 'signalements')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $utilisateur = null;

    #[ORM\ManyToOne(inversedBy: 'signalements')]
    #[ORM\JoinColumn(nullable: false)]
    private ?AvisRecherche $avisRecherche = null;

    public function getId(): ?int { return $this->id; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(string $description): static { $this->description = $description; return $this; }

    public function getLieu(): ?string { return $this->lieu; }
    public function setLieu(string $lieu): static { $this->lieu = $lieu; return $this; }

    public function getDateObservation(): ?\DateTimeImmutable { return $this->dateObservation; }
    public function setDateObservation(\DateTimeImmutable $dateObservation): static { $this->dateObservation = $dateObservation; return $this; }

    public function getHeureObservation(): ?string { return $this->heureObservation; }
    public function setHeureObservation(?string $heureObservation): static { $this->heureObservation = $heureObservation; return $this; }

    public function getTelephoneContact(): ?string { return $this->telephoneContact; }
    public function setTelephoneContact(?string $telephoneContact): static { $this->telephoneContact = $telephoneContact; return $this; }

    public function getCommentaireSupplementaire(): ?string { return $this->commentaireSupplementaire; }
    public function setCommentaireSupplementaire(?string $commentaireSupplementaire): static { $this->commentaireSupplementaire = $commentaireSupplementaire; return $this; }

    public function getPhoto(): ?string { return $this->photo; }
    public function setPhoto(?string $photo): static { $this->photo = $photo; return $this; }

    public function getVideo(): ?string { return $this->video; }
    public function setVideo(?string $video): static { $this->video = $video; return $this; }

    public function getPieceJointe(): ?string { return $this->pieceJointe; }
    public function setPieceJointe(?string $pieceJointe): static { $this->pieceJointe = $pieceJointe; return $this; }

    public function getStatut(): ?SignalementStatut { return $this->statut; }
    public function setStatut(SignalementStatut $statut): static { $this->statut = $statut; return $this; }

    public function isUrgent(): bool { return $this->urgent === true; }
    public function setUrgent(bool $urgent): static { $this->urgent = $urgent; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }

    public function getUpdatedAt(): ?\DateTimeImmutable { return $this->updatedAt; }
    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static { $this->updatedAt = $updatedAt; return $this; }

    public function getUtilisateur(): ?Utilisateur { return $this->utilisateur; }
    public function setUtilisateur(?Utilisateur $utilisateur): static { $this->utilisateur = $utilisateur; return $this; }

    public function getAvisRecherche(): ?AvisRecherche { return $this->avisRecherche; }
    public function setAvisRecherche(?AvisRecherche $avisRecherche): static { $this->avisRecherche = $avisRecherche; return $this; }
}
