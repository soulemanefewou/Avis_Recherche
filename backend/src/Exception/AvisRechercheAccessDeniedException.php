<?php

namespace App\Exception;

class AvisRechercheAccessDeniedException extends \Exception
{
    public function __construct()
    {
        parent::__construct(
            "Vous n'êtes pas autorisé à effectuer cette action.",
            403
        );
    }
}