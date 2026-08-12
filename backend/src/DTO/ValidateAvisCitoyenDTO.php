<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class ValidateAvisCitoyenDTO
{
    #[Assert\NotNull(message: 'La décision est obligatoire.')]
    public bool $valide;

    #[Assert\Length(max: 1000, maxMessage: 'Le motif ne peut pas dépasser {{ limit }} caractères.')]
    public ?string $motifRejet = null;
}
