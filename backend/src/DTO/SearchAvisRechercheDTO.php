<?php

namespace App\DTO;

use App\Enum\AvisStatut;
use App\Enum\Sexe;

class SearchAvisRechercheDTO
{
    public ?string $search = null;

    public ?Sexe $sexe = null;

    public ?AvisStatut $statut = null;

    public ?string $type = null;

    public ?int $region = null;

    public ?int $ville = null;

    public int $page = 1;

    public int $limit = 10;
}
