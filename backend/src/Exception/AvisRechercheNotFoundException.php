<?php

namespace App\Exception;

class AvisRechercheNotFoundException extends \Exception
{
    public function __construct()
    {
        parent::__construct(
            'Avis de recherche introuvable.',
            404
        );
    }
}