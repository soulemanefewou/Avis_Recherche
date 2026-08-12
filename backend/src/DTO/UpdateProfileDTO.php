<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class UpdateProfileDTO
{
    #[Assert\Length(min: 1, max: 255)]
    public ?string $nom = null;

    #[Assert\Length(min: 1, max: 255)]
    public ?string $prenom = null;

    #[Assert\Regex(pattern: '/^(?:\+237)?[26][0-9]{8}$/', message: 'Numéro de téléphone camerounais invalide.')]
    public ?string $telephone = null;

    #[Assert\Length(max: 255)]
    public ?string $lieuResidence = null;

    public ?int $region = null;
}
