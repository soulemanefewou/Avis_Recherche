<?php

namespace App\Entity;

use App\Enum\ConversationStatut;
use App\Enum\ConversationType;
use App\Repository\ConversationRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ConversationRepository::class)]
#[ORM\UniqueConstraint(
    name: 'uniq_conversation_utilisateurs_avis',
    columns: ['avis_recherche_id', 'createur_signalement_id', 'proprietaire_avis_id']
)]
class Conversation
{
    public function __construct()
    {
        $now = new DateTimeImmutable();

        $this->createdAt = $now;
        $this->updatedAt = $now;
        $this->lastMessageAt = $now;

        $this->messages = new ArrayCollection();
    }

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private ?DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?DateTimeImmutable $updatedAt = null;

    #[ORM\Column]
    private ?DateTimeImmutable $lastMessageAt = null;

    #[ORM\ManyToOne(inversedBy: 'conversations')]
    #[ORM\JoinColumn(nullable: false)]
    private ?AvisRecherche $avisRecherche = null;

    #[ORM\ManyToOne(inversedBy: 'conversationsCreees')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $createurSignalement = null;

    #[ORM\ManyToOne(inversedBy: 'conversationsRecues')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $proprietaireAvis = null;

    #[ORM\Column(type: 'string', enumType: ConversationStatut::class)]
    private ConversationStatut $statut = ConversationStatut::ACTIVE;

    #[ORM\Column(type: 'string', enumType: ConversationType::class)]
    private ConversationType $type = ConversationType::PROCHE_TEMOIN;

    /**
     * @var Collection<int, Message>
     */
    #[ORM\OneToMany(
        targetEntity: Message::class,
        mappedBy: 'conversation',
        orphanRemoval: true
    )]
    private Collection $messages;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCreatedAt(): ?DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getUpdatedAt(): ?DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }

    public function getLastMessageAt(): ?DateTimeImmutable
    {
        return $this->lastMessageAt;
    }

    public function setLastMessageAt(DateTimeImmutable $lastMessageAt): static
    {
        $this->lastMessageAt = $lastMessageAt;

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

    public function getCreateurSignalement(): ?Utilisateur
    {
        return $this->createurSignalement;
    }

    public function setCreateurSignalement(?Utilisateur $createurSignalement): static
    {
        $this->createurSignalement = $createurSignalement;

        return $this;
    }

    public function getProprietaireAvis(): ?Utilisateur
    {
        return $this->proprietaireAvis;
    }

    public function setProprietaireAvis(?Utilisateur $proprietaireAvis): static
    {
        $this->proprietaireAvis = $proprietaireAvis;

        return $this;
    }

    /**
     * @return Collection<int, Message>
     */
    public function getMessages(): Collection
    {
        return $this->messages;
    }

    public function addMessage(Message $message): static
    {
        if (!$this->messages->contains($message)) {
            $this->messages->add($message);
            $message->setConversation($this);

            $now = new DateTimeImmutable();
            $this->updatedAt = $now;
            $this->lastMessageAt = $now;
        }

        return $this;
    }

    public function removeMessage(Message $message): static
    {
        if ($this->messages->removeElement($message)) {
            if ($message->getConversation() === $this) {
                $message->setConversation(null);
            }

            $this->updatedAt = new DateTimeImmutable();
        }

        return $this;
    }

    public function getStatut(): ConversationStatut
    {
        return $this->statut;
    }

    public function setStatut(ConversationStatut $statut): static
    {
        $this->statut = $statut;
        return $this;
    }

    public function getType(): ConversationType
    {
        return $this->type;
    }

    public function setType(ConversationType $type): static
    {
        $this->type = $type;
        return $this;
    }
}