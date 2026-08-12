<?php

namespace App\Entity;

use App\Enum\AvisStatut;
use App\Enum\AvisType;
use App\Enum\Sexe;
use App\Repository\AvisRechercheRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AvisRechercheRepository::class)]
#[ORM\InheritanceType('SINGLE_TABLE')]
#[ORM\DiscriminatorColumn(name: 'type', type: 'string')]
#[ORM\DiscriminatorMap([
    'OFFICIEL' => AvisOfficiel::class,
    'CITOYEN' => AvisCitoyen::class,
])]
abstract class AvisRecherche
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Le nom est obligatoire.')]
    private ?string $nom = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Le prénom est obligatoire.')]
    private ?string $prenom = null;

    #[ORM\Column(type: 'string', enumType: Sexe::class)]
    #[Assert\NotNull]
    private ?Sexe $sexe = null;

    #[ORM\Column(type: 'integer')]
    #[Assert\PositiveOrZero]
    private ?int $ageApprox = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Assert\NotNull]
    private ?\DateTimeImmutable $dateDisparition = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private ?string $dernierLieuVu = null;

    #[ORM\Column(type: 'text')]
    #[Assert\NotBlank]
    private ?string $description = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $circonstances = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $tenueVestimentaire = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $signesParticuliers = null;

    #[ORM\Column(type: 'float', nullable: true)]
    #[Assert\PositiveOrZero]
    private ?float $taille = null;

    #[ORM\Column(type: 'float', nullable: true)]
    #[Assert\PositiveOrZero]
    private ?float $poids = null;

    #[ORM\Column(length: 30)]
    #[Assert\NotBlank]
    private ?string $telephone = null;

    #[ORM\Column(type: 'string', enumType: AvisStatut::class)]
    private AvisStatut $statut = AvisStatut::RECHERCHE;

    #[ORM\Column(type: 'boolean')]
    private bool $actif = true;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\ManyToOne(inversedBy: 'avisRecherches')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Region $region = null;

    #[ORM\ManyToOne(inversedBy: 'avisRecherches')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Ville $ville = null;

    /**
     * @var Collection<int, Photo>
     */
    #[ORM\OneToMany(targetEntity: Photo::class, mappedBy: 'avisRecherche', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $photos;

    /**
     * @var Collection<int, Signalement>
     */
    #[ORM\OneToMany(targetEntity: Signalement::class, mappedBy: 'avisRecherche', cascade: ['persist'], orphanRemoval: true)]
    private Collection $signalements;

    /**
     * @var Collection<int, Conversation>
     */
    #[ORM\OneToMany(targetEntity: Conversation::class, mappedBy: 'avisRecherche', cascade: ['persist'], orphanRemoval: true)]
    private Collection $conversations;

    public function __construct()
    {
        $this->photos = new ArrayCollection();
        $this->signalements = new ArrayCollection();
        $this->conversations = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
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

    public function getPrenom(): ?string
    {
        return $this->prenom;
    }

    public function setPrenom(string $prenom): static
    {
        $this->prenom = $prenom;
        return $this;
    }

    public function getSexe(): ?Sexe
    {
        return $this->sexe;
    }

    public function setSexe(Sexe $sexe): static
    {
        $this->sexe = $sexe;
        return $this;
    }

    public function getAgeApprox(): ?int
    {
        return $this->ageApprox;
    }

    public function setAgeApprox(int $ageApprox): static
    {
        $this->ageApprox = $ageApprox;
        return $this;
    }

    public function getDateDisparition(): ?\DateTimeImmutable
    {
        return $this->dateDisparition;
    }

    public function setDateDisparition(\DateTimeImmutable $dateDisparition): static
    {
        $this->dateDisparition = $dateDisparition;
        return $this;
    }

    public function getDernierLieuVu(): ?string
    {
        return $this->dernierLieuVu;
    }

    public function setDernierLieuVu(string $dernierLieuVu): static
    {
        $this->dernierLieuVu = $dernierLieuVu;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getCirconstances(): ?string
    {
        return $this->circonstances;
    }

    public function setCirconstances(?string $circonstances): static
    {
        $this->circonstances = $circonstances;
        return $this;
    }

    public function getTenueVestimentaire(): ?string
    {
        return $this->tenueVestimentaire;
    }

    public function setTenueVestimentaire(?string $tenueVestimentaire): static
    {
        $this->tenueVestimentaire = $tenueVestimentaire;
        return $this;
    }

    public function getSignesParticuliers(): ?string
    {
        return $this->signesParticuliers;
    }

    public function setSignesParticuliers(?string $signesParticuliers): static
    {
        $this->signesParticuliers = $signesParticuliers;
        return $this;
    }

    public function getTaille(): ?float
    {
        return $this->taille;
    }

    public function setTaille(?float $taille): static
    {
        $this->taille = $taille;
        return $this;
    }

    public function getPoids(): ?float
    {
        return $this->poids;
    }

    public function setPoids(?float $poids): static
    {
        $this->poids = $poids;
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

    public function getStatut(): AvisStatut
    {
        return $this->statut;
    }

    public function setStatut(AvisStatut $statut): static
    {
        $this->statut = $statut;
        $this->updatedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getType(): AvisType
    {
        return $this instanceof AvisOfficiel ? AvisType::OFFICIEL : AvisType::CITOYEN;
    }

    public function isActif(): bool
    {
        return $this->actif;
    }

    public function setActif(bool $actif): static
    {
        $this->actif = $actif;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
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

    /**
     * @return Collection<int, Photo>
     */
    public function getPhotos(): Collection
    {
        return $this->photos;
    }

    public function addPhoto(Photo $photo): static
    {
        if (!$this->photos->contains($photo)) {
            $this->photos->add($photo);
            $photo->setAvisRecherche($this);
        }
        return $this;
    }

    public function removePhoto(Photo $photo): static
    {
        if ($this->photos->removeElement($photo)) {
            if ($photo->getAvisRecherche() === $this) {
                $photo->setAvisRecherche(null);
            }
        }
        return $this;
    }

    /**
     * @return Collection<int, Signalement>
     */
    public function getSignalements(): Collection
    {
        return $this->signalements;
    }

    public function addSignalement(Signalement $signalement): static
    {
        if (!$this->signalements->contains($signalement)) {
            $this->signalements->add($signalement);
            $signalement->setAvisRecherche($this);
        }
        return $this;
    }

    /**
     * @return Collection<int, Conversation>
     */
    public function getConversations(): Collection
    {
        return $this->conversations;
    }

    public function preUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }
}
