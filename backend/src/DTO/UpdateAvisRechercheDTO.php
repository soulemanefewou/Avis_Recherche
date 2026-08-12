<?php

namespace App\DTO;

use App\Enum\Sexe;

class UpdateAvisRechercheDTO
{
    public ?string $nom = null;

    public ?string $prenom = null;

    public ?Sexe $sexe = null;

    public ?string $description = null;

    public ?string $dernierLieuVu = null;

    public ?string $dateDisparition = null;

    public ?int $ageApprox = null;

    public ?string $tenueVestimentaire = null;

    public ?string $signesParticuliers = null;

    public ?float $taille = null;

    public ?float $poids = null;

    public ?string $telephone = null;

    public ?string $circonstances = null;

    public ?int $region = null;

    public ?int $ville = null;
}
