<?php

namespace App\Entity;

use App\Enum\ValidationStatut;
use App\Repository\AvisCitoyenRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AvisCitoyenRepository::class)]
class AvisCitoyen extends AvisRecherche
{
    #[ORM\ManyToOne(inversedBy: 'avisCitoyens')]
    private ?Utilisateur $auteur = null;

    #[ORM\Column(type: 'string', enumType: ValidationStatut::class)]
    private ValidationStatut $validationStatut = ValidationStatut::EN_ATTENTE;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $dateValidation = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $motifRejet = null;

    #[ORM\Column(type: 'boolean')]
    private bool $suiviActif = true;

    /**
     * @var Collection<int, Justificatif>
     */
    #[ORM\OneToMany(targetEntity: Justificatif::class, mappedBy: 'avisCitoyen', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $piecesJustificatives;

    public function __construct()
    {
        parent::__construct();
        $this->piecesJustificatives = new ArrayCollection();
    }

    public function getAuteur(): ?Utilisateur
    {
        return $this->auteur;
    }

    public function setAuteur(?Utilisateur $auteur): static
    {
        $this->auteur = $auteur;
        return $this;
    }

    public function getValidationStatut(): ValidationStatut
    {
        return $this->validationStatut;
    }

    public function setValidationStatut(ValidationStatut $validationStatut): static
    {
        $this->validationStatut = $validationStatut;
        return $this;
    }

    public function getDateValidation(): ?\DateTimeImmutable
    {
        return $this->dateValidation;
    }

    public function setDateValidation(?\DateTimeImmutable $dateValidation): static
    {
        $this->dateValidation = $dateValidation;
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

    public function isSuiviActif(): bool
    {
        return $this->suiviActif;
    }

    public function setSuiviActif(bool $suiviActif): static
    {
        $this->suiviActif = $suiviActif;
        return $this;
    }

    /**
     * @return Collection<int, Justificatif>
     */
    public function getPiecesJustificatives(): Collection
    {
        return $this->piecesJustificatives;
    }

    public function addPieceJustificative(Justificatif $piece): static
    {
        if (!$this->piecesJustificatives->contains($piece)) {
            $this->piecesJustificatives->add($piece);
            $piece->setAvisCitoyen($this);
        }
        return $this;
    }

    public function removePieceJustificative(Justificatif $piece): static
    {
        if ($this->piecesJustificatives->removeElement($piece)) {
            if ($piece->getAvisCitoyen() === $this) {
                $piece->setAvisCitoyen(null);
            }
        }
        return $this;
    }
}
