<?php

namespace App\Exception;

class UnauthenticatedException extends \Exception
{
    public function __construct()
    {
        parent::__construct(
            'Utilisateur non authentifié.',
            401
        );
    }
}