<?php

namespace App\Entity;

use App\Repository\UtilisateurRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UtilisateurRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Utilisateur implements UserInterface, PasswordAuthenticatedUserInterface
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
    private ?string $prenom = null;

    #[ORM\Column(length: 255, unique: true)]
    #[Assert\Email]
    #[Assert\NotBlank]
    private ?string $email = null;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank]
    #[Assert\Regex(pattern: '/^(?:\+237)?[26][0-9]{8}$/', message: 'Numéro de téléphone camerounais invalide.')]
    private ?string $telephone = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $photoProfil = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $lieuResidence = null;

    #[ORM\Column(type: 'boolean')]
    private bool $actif = true;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Assert\Length(min: 8, minMessage: 'Le mot de passe doit contenir au moins {{ limit }} caractères.')]
    private ?string $password = null;

    #[ORM\Column(type: 'json')]
    private array $roles = [];

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $fcmToken = null;

    #[ORM\ManyToOne(targetEntity: Region::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?Region $region = null;

    /**
     * @var Collection<int, AvisCitoyen>
     */
    #[ORM\OneToMany(targetEntity: AvisCitoyen::class, mappedBy: 'auteur')]
    private Collection $avisCitoyens;

    /**
     * @var Collection<int, Signalement>
     */
    #[ORM\OneToMany(targetEntity: Signalement::class, mappedBy: 'utilisateur')]
    private Collection $signalements;

    /**
     * @var Collection<int, Conversation>
     */
    #[ORM\OneToMany(targetEntity: Conversation::class, mappedBy: 'createurSignalement')]
    private Collection $conversationsCreees;

    /**
     * @var Collection<int, Conversation>
     */
    #[ORM\OneToMany(targetEntity: Conversation::class, mappedBy: 'proprietaireAvis')]
    private Collection $conversationsRecues;

    /**
     * @var Collection<int, Message>
     */
    #[ORM\OneToMany(targetEntity: Message::class, mappedBy: 'auteur')]
    private Collection $messages;

    /**
     * @var Collection<int, Message>
     */
    #[ORM\OneToMany(targetEntity: Message::class, mappedBy: 'signalePar')]
    private Collection $messagesSignales;

    #[ORM\OneToOne(targetEntity: Commissariat::class, mappedBy: 'utilisateur', cascade: ['persist', 'remove'])]
    private ?Commissariat $commissariat = null;

    /**
     * @var Collection<int, Notification>
     */
    #[ORM\OneToMany(targetEntity: Notification::class, mappedBy: 'utilisateur')]
    private Collection $notifications;

    /**
     * @var Collection<int, CommissariatDemande>
     */
    #[ORM\OneToMany(targetEntity: CommissariatDemande::class, mappedBy: 'utilisateur')]
    private Collection $demandesCommissariat;

    public function __construct()
    {
        $this->avisCitoyens = new ArrayCollection();
        $this->signalements = new ArrayCollection();
        $this->conversationsCreees = new ArrayCollection();
        $this->conversationsRecues = new ArrayCollection();
        $this->messages = new ArrayCollection();
        $this->notifications = new ArrayCollection();
        $this->messagesSignales = new ArrayCollection();
        $this->demandesCommissariat = new ArrayCollection();
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

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;
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

    public function getPhotoProfil(): ?string
    {
        return $this->photoProfil;
    }

    public function setPhotoProfil(?string $photoProfil): static
    {
        $this->photoProfil = $photoProfil;
        return $this;
    }

    public function getLieuResidence(): ?string
    {
        return $this->lieuResidence;
    }

    public function setLieuResidence(?string $lieuResidence): static
    {
        $this->lieuResidence = $lieuResidence;
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

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    #[ORM\PreUpdate]
    public function preUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;
        return $this;
    }

    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    public function getRoles(): array
    {
        return array_values(array_unique($this->roles));
    }

    public function setRoles(array $roles): static
    {
        $this->roles = $roles;
        return $this;
    }

    public function getFcmToken(): ?string
    {
        return $this->fcmToken;
    }

    public function setFcmToken(?string $fcmToken): static
    {
        $this->fcmToken = $fcmToken;
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

    public function eraseCredentials(): void
    {
    }

    /**
     * @return Collection<int, AvisCitoyen>
     */
    public function getAvisCitoyens(): Collection
    {
        return $this->avisCitoyens;
    }

    /**
     * @return Collection<int, Signalement>
     */
    public function getSignalements(): Collection
    {
        return $this->signalements;
    }

    /**
     * @return Collection<int, Conversation>
     */
    public function getConversationsCreees(): Collection
    {
        return $this->conversationsCreees;
    }

    /**
     * @return Collection<int, Conversation>
     */
    public function getConversationsRecues(): Collection
    {
        return $this->conversationsRecues;
    }

    /**
     * @return Collection<int, Message>
     */
    public function getMessages(): Collection
    {
        return $this->messages;
    }

    /**
     * @return Collection<int, Message>
     */
    public function getMessagesSignales(): Collection
    {
        return $this->messagesSignales;
    }

    public function getCommissariat(): ?Commissariat
    {
        return $this->commissariat;
    }

    public function setCommissariat(?Commissariat $commissariat): static
    {
        $this->commissariat = $commissariat;
        return $this;
    }

    /**
     * @return Collection<int, Notification>
     */
    public function getNotifications(): Collection
    {
        return $this->notifications;
    }

    /**
     * @return Collection<int, CommissariatDemande>
     */
    public function getDemandesCommissariat(): Collection
    {
        return $this->demandesCommissariat;
    }
}
