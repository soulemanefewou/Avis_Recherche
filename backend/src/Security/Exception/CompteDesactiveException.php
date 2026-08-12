<?php

namespace App\Security\Exception;

use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;

class CompteDesactiveException extends CustomUserMessageAccountStatusException
{
    public function __construct()
    {
        parent::__construct('Votre compte a été désactivé par le fondateur. Vous ne pouvez plus vous connecter.');
    }
}
