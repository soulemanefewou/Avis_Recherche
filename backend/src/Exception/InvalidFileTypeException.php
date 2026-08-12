<?php

namespace App\Exception;

class InvalidFileTypeException extends \Exception
{
    public function __construct()
    {
        parent::__construct(
            'Seuls les fichiers JPEG, PNG et WEBP sont autorisés.',
            400
        );
    }
}