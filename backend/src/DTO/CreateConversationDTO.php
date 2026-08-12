<?php

namespace App\DTO;

use App\Enum\ConversationType;
use Symfony\Component\Validator\Constraints as Assert;

class CreateConversationDTO
{
    #[Assert\NotNull(message: "L'avis de recherche est obligatoire.")]
    public ?int $avisRecherche = null;

    #[Assert\NotBlank(message: 'Le contenu du premier message est obligatoire.')]
    #[Assert\Length(min: 1, max: 5000)]
    public ?string $contenu = null;

    public ?ConversationType $type = null;
}
