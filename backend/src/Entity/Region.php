<?php

namespace App\Entity;

use App\Repository\RegionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: RegionRepository::class)]
class Region
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[Assert\NotBlank(message: 'Le nom de la région est obligatoire.')]
    #[ORM\Column(length: 100)]
    private ?string $nom = null;

    #[Assert\NotBlank(message: 'Le code de la région est obligatoire.')]
    #[Assert\Length(
        max: 10,
        maxMessage: 'Le code ne doit pas dépasser {{ limit }} caractères.'
    )]
    #[ORM\Column(length: 10)]
    private ?string $code = null;

    /**
     * @var Collection<int, Ville>
     */
    #[ORM\OneToMany(targetEntity: Ville::class, mappedBy: 'region')]
    private Collection $villes;

    /**
     * @var Collection<int, Commissariat>
     */
    #[ORM\OneToMany(targetEntity: Commissariat::class, mappedBy: 'region')]
    private Collection $commissariats;

    /**
     * @var Collection<int, AvisRecherche>
     */
    #[ORM\OneToMany(targetEntity: AvisRecherche::class, mappedBy: 'region')]
    private Collection $avisRecherches;

    public function __construct()
    {
        $this->villes = new ArrayCollection();
        $this->commissariats = new ArrayCollection();
        $this->avisRecherches = new ArrayCollection();
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

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(string $code): static
    {
        $this->code = $code;

        return $this;
    }

    /**
     * @return Collection<int, Ville>
     */
    public function getVilles(): Collection
    {
        return $this->villes;
    }

    public function addVille(Ville $ville): static
    {
        if (!$this->villes->contains($ville)) {
            $this->villes->add($ville);
            $ville->setRegion($this);
        }

        return $this;
    }

    public function removeVille(Ville $ville): static
    {
        if ($this->villes->removeElement($ville)) {
            // set the owning side to null (unless already changed)
            if ($ville->getRegion() === $this) {
                $ville->setRegion(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Commissariat>
     */
    public function getCommissariats(): Collection
    {
        return $this->commissariats;
    }

    public function addCommissariat(Commissariat $commissariat): static
    {
        if (!$this->commissariats->contains($commissariat)) {
            $this->commissariats->add($commissariat);
            $commissariat->setRegion($this);
        }

        return $this;
    }

    public function removeCommissariat(Commissariat $commissariat): static
    {
        if ($this->commissariats->removeElement($commissariat)) {
            // set the owning side to null (unless already changed)
            if ($commissariat->getRegion() === $this) {
                $commissariat->setRegion(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, AvisRecherche>
     */
    public function getAvisRecherches(): Collection
    {
        return $this->avisRecherches;
    }

    public function addAvisRecherch(AvisRecherche $avisRecherch): static
    {
        if (!$this->avisRecherches->contains($avisRecherch)) {
            $this->avisRecherches->add($avisRecherch);
            $avisRecherch->setRegion($this);
        }

        return $this;
    }

    public function removeAvisRecherch(AvisRecherche $avisRecherch): static
    {
        if ($this->avisRecherches->removeElement($avisRecherch)) {
            // set the owning side to null (unless already changed)
            if ($avisRecherch->getRegion() === $this) {
                $avisRecherch->setRegion(null);
            }
        }

        return $this;
    }
}
