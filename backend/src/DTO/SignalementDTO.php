<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class SignalementDTO
{
    #[Assert\NotBlank(message: 'La description est obligatoire.')]
    #[Assert\Length(min: 10, max: 2000)]
    public string $description;

    #[Assert\NotBlank(message: 'Le lieu est obligatoire.')]
    #[Assert\Length(max: 255)]
    public string $lieu;

    #[Assert\NotNull(message: 'La date d\'observation est obligatoire.')]
    public \DateTimeImmutable $dateObservation;

    public ?string $heureObservation = null;

    #[Assert\Length(max: 30)]
    public ?string $telephoneContact = null;

    public ?string $commentaireSupplementaire = null;

    public ?string $photo = null;

    public ?string $video = null;

    public ?string $pieceJointe = null;

    public bool $urgent = false;
}
