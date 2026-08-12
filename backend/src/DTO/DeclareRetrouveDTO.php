<?php

namespace App\DTO;

use App\Enum\AvisStatut;
use Symfony\Component\Validator\Constraints as Assert;

class DeclareRetrouveDTO
{
    #[Assert\NotNull(message: 'Le statut est obligatoire.')]
    public ?AvisStatut $statut = null;

    #[Assert\Length(max: 2000, maxMessage: 'La description ne peut pas dépasser {{ limit }} caractères.')]
    public ?string $description = null;
}
