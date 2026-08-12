<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class CreateCommissariatDemandeDTO
{
    #[Assert\NotBlank(message: 'Le nom du commissariat est obligatoire.')]
    public string $nom;

    #[Assert\NotBlank(message: "L'adresse est obligatoire.")]
    public string $adresse;

    #[Assert\NotBlank(message: 'Le téléphone est obligatoire.')]
    public string $telephone;

    #[Assert\Email(message: 'Email invalide.')]
    public string $email;

    #[Assert\NotBlank(message: 'Le responsable est obligatoire.')]
    public string $responsable;

    #[Assert\NotNull(message: 'La région est obligatoire.')]
    public int $region;

    #[Assert\NotNull(message: 'La ville est obligatoire.')]
    public int $ville;

    #[Assert\NotBlank(message: 'Le prénom est obligatoire.')]
    public string $prenom;

    #[Assert\NotBlank(message: 'Le mot de passe est obligatoire.')]
    #[Assert\Length(min: 8, minMessage: 'Le mot de passe doit contenir au moins 8 caractères.')]
    public string $motDePasse;
}
