<?php
namespace App\Exception;

class SignalementNotFoundException extends \RuntimeException
{
    public function __construct()
    {
        parent::__construct('Signalement introuvable.', 404);
    }
}