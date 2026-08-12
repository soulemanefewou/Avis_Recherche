<?php

namespace App\DTO\Request;

use App\Enum\MessageType;
use Symfony\Component\Validator\Constraints as Assert;

class CreateMessageRequest
{
    #[Assert\NotBlank(message: 'Le contenu du message est obligatoire.')]
    #[Assert\Length(
        min: 1,
        max: 5000,
        minMessage: 'Le message doit contenir au moins {{ limit }} caractère.',
        maxMessage: 'Le message ne peut pas dépasser {{ limit }} caractères.'
    )]
    public string $contenu;

    #[Assert\NotNull(message: 'Le type du message est obligatoire.')]
    public MessageType $type = MessageType::USER;
}