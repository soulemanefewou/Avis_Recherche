<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class CreateMessageDTO
{
    #[Assert\NotBlank(message: 'Le contenu du message est obligatoire.')]
    #[Assert\Length(min: 1, max: 5000)]
    public ?string $contenu = null;
}
