<?php

namespace App\DTO;

use App\Enum\Sexe;
use Symfony\Component\Validator\Constraints as Assert;

class CreateAvisRechercheDTO
{
    #[Assert\NotBlank(message: 'Le nom est obligatoire.')]
    public string $nom;

    #[Assert\NotBlank(message: 'Le prénom est obligatoire.')]
    public string $prenom;

    #[Assert\NotNull(message: 'Le sexe est obligatoire.')]
    public ?Sexe $sexe = null;

    #[Assert\NotBlank(message: 'Le dernier lieu vu est obligatoire.')]
    public string $dernierLieuVu;

    #[Assert\NotBlank(message: 'La description est obligatoire.')]
    public string $description;

    #[Assert\NotBlank(message: 'La date de disparition est obligatoire.')]
    public string $dateDisparition;

    #[Assert\NotNull(message: "L'âge approximatif est obligatoire.")]
    #[Assert\Positive(message: "L'âge doit être positif.")]
    public ?int $ageApprox = null;

    public ?string $tenueVestimentaire = null;

    public ?string $signesParticuliers = null;

    #[Assert\Positive(message: 'La taille doit être positive.')]
    public ?float $taille = null;

    #[Assert\Positive(message: 'Le poids doit être positif.')]
    public ?float $poids = null;

    #[Assert\NotBlank(message: 'Le téléphone est obligatoire.')]
    public ?string $telephone = null;

    public ?string $circonstances = null;

    #[Assert\NotNull(message: 'La région est obligatoire.')]
    public ?int $region = null;

    #[Assert\NotNull(message: 'La ville est obligatoire.')]
    public ?int $ville = null;
}
