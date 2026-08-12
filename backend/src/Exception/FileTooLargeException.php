<?php

namespace App\Exception;

class FileTooLargeException extends \Exception
{
    public function __construct()
    {
        parent::__construct(
            'La taille maximale autorisée est de 5 Mo.',
            400
        );
    }
}