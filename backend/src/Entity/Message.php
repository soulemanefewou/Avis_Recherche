<?php

namespace App\Entity;

use App\Repository\MessageRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Enum\MessageType;
use DateTimeImmutable;

#[ORM\Entity(repositoryClass: MessageRepository::class)]
class Message
{

    public function __construct()
    {
        $now = new DateTimeImmutable();

        $this->createdAt = $now;
        $this->updatedAt = $now;
        $this->lu = false;
        $this->type = MessageType::USER;
    }

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $contenu = null;

    #[ORM\Column]
    private ?DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    private ?DateTimeImmutable $updatedAt = null;

    #[ORM\Column]
    private ?bool $lu = null;

    #[ORM\Column(enumType: MessageType::class)]
    private MessageType $type;

    #[ORM\ManyToOne(inversedBy: 'messages')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Conversation $conversation = null;

    #[ORM\ManyToOne(inversedBy: 'messages')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Utilisateur $auteur = null;

    #[ORM\ManyToOne(inversedBy: 'messagesSignales')]
    private ?Utilisateur $signalePar = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getContenu(): ?string
    {
        return $this->contenu;
    }

    public function setContenu(string $contenu): static
    {
        $this->contenu = $contenu;

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

    public function getUpdatedAt(): ?DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }

    public function getLu(): ?bool
    {
        return $this->lu;
    }

    public function isLu(): bool
    {
        return $this->lu ?? false;
    }

    public function setLu(bool $lu): static
    {
        $this->lu = $lu;

        return $this;
    }

    public function getType(): MessageType
    {
        return $this->type;
    }

    public function setType(MessageType $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getConversation(): ?Conversation
    {
        return $this->conversation;
    }

    public function setConversation(?Conversation $conversation): static
    {
        $this->conversation = $conversation;

        return $this;
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

    public function getSignalePar(): ?Utilisateur
    {
        return $this->signalePar;
    }

    public function setSignalePar(?Utilisateur $signalePar): static
    {
        $this->signalePar = $signalePar;
        return $this;
    }

    public function markAsRead(): static
    {
        $this->lu = true;
        $this->updatedAt = new DateTimeImmutable();

        return $this;
    }

}
