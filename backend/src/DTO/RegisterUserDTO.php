<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class RegisterUserDTO
{
    #[Assert\NotBlank(message: 'Le nom est obligatoire.')]
    public string $nom;

    #[Assert\NotBlank(message: 'Le prénom est obligatoire.')]
    public string $prenom;

    #[Assert\NotBlank(message: "L'email est obligatoire.")]
    #[Assert\Email(message: 'Veuillez saisir un email valide.')]
    public string $email;

    #[Assert\NotBlank(message: 'Le téléphone est obligatoire.')]
    #[Assert\Length(
        min: 9,
        max: 20,
        minMessage: 'Le numéro de téléphone est trop court.',
        maxMessage: 'Le numéro de téléphone est trop long.'
    )]
    public string $telephone;

    #[Assert\NotBlank(message: 'Le mot de passe est obligatoire.')]
    #[Assert\Length(
        min: 8,
        minMessage: 'Le mot de passe doit contenir au moins {{ limit }} caractères.'
    )]
    public string $password;

    public ?string $lieuResidence = null;

    public ?int $region = null;
}
