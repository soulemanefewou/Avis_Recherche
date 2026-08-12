<?php

namespace App\Entity;

use App\Repository\VilleRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: VilleRepository::class)]
class Ville
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[Assert\NotBlank(message: 'Le nom de la ville est obligatoire.')]
    #[ORM\Column(length: 100)]
    private ?string $nom = null;

    #[ORM\ManyToOne(inversedBy: 'villes')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Region $region = null;

    /**
     * @var Collection<int, Commissariat>
     */
    #[ORM\OneToMany(targetEntity: Commissariat::class, mappedBy: 'ville')]
    private Collection $commissariats;

    /**
     * @var Collection<int, AvisRecherche>
     */
    #[ORM\OneToMany(targetEntity: AvisRecherche::class, mappedBy: 'ville')]
    private Collection $avisRecherches;

    public function __construct()
    {
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

    public function getRegion(): ?Region
    {
        return $this->region;
    }

    public function setRegion(?Region $region): static
    {
        $this->region = $region;

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
            $commissariat->setVille($this);
        }

        return $this;
    }

    public function removeCommissariat(Commissariat $commissariat): static
    {
        if ($this->commissariats->removeElement($commissariat)) {
            // set the owning side to null (unless already changed)
            if ($commissariat->getVille() === $this) {
                $commissariat->setVille(null);
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
            $avisRecherch->setVille($this);
        }

        return $this;
    }

    public function removeAvisRecherch(AvisRecherche $avisRecherch): static
    {
        if ($this->avisRecherches->removeElement($avisRecherch)) {
            // set the owning side to null (unless already changed)
            if ($avisRecherch->getVille() === $this) {
                $avisRecherch->setVille(null);
            }
        }

        return $this;
    }
}
