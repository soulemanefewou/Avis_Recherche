<?php

namespace App\Exception;

use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PhotoNotFoundException extends NotFoundHttpException
{
    public function __construct()
    {
        parent::__construct('Photo introuvable.');
    }
}