<?php

namespace App\Entity;

use App\Repository\CommissariatRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CommissariatRepository::class)]
class Commissariat
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
    #[Assert\Regex(pattern: '/^(?:\+237)?[26][0-9]{8}$/', message: 'Numéro de téléphone camerounais invalide.')]
    private ?string $telephone = null;

    #[ORM\Column(length: 255)]
    #[Assert\Email]
    private ?string $email = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    private ?string $responsable = null;

    #[ORM\Column(type: 'boolean')]
    private bool $actif = true;

    #[ORM\OneToOne(targetEntity: Utilisateur::class, inversedBy: 'commissariat', cascade: ['persist', 'remove'])]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $utilisateur = null;

    #[ORM\ManyToOne(inversedBy: 'commissariats')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Region $region = null;

    #[ORM\ManyToOne(inversedBy: 'commissariats')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Ville $ville = null;

    /**
     * @var Collection<int, AvisOfficiel>
     */
    #[ORM\OneToMany(targetEntity: AvisOfficiel::class, mappedBy: 'commissariat')]
    private Collection $avisOfficiels;

    public function __construct()
    {
        $this->avisOfficiels = new ArrayCollection();
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

    public function isActif(): bool
    {
        return $this->actif;
    }

    public function setActif(bool $actif): static
    {
        $this->actif = $actif;
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

    /**
     * @return Collection<int, AvisOfficiel>
     */
    public function getAvisOfficiels(): Collection
    {
        return $this->avisOfficiels;
    }

    public function addAvisOfficiel(AvisOfficiel $avisOfficiel): static
    {
        if (!$this->avisOfficiels->contains($avisOfficiel)) {
            $this->avisOfficiels->add($avisOfficiel);
            $avisOfficiel->setCommissariat($this);
        }
        return $this;
    }

    public function removeAvisOfficiel(AvisOfficiel $avisOfficiel): static
    {
        if ($this->avisOfficiels->removeElement($avisOfficiel)) {
            if ($avisOfficiel->getCommissariat() === $this) {
                $avisOfficiel->setCommissariat(null);
            }
        }
        return $this;
    }
}
