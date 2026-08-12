<?php

namespace App\Exception;

class AccessDeniedException extends \RuntimeException
{
    public function __construct(
        string $message = "Vous n'êtes pas autorisé à effectuer cette action."
    ) {
        parent::__construct($message, 403);
    }
}