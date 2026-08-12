<?php

namespace App\Exception;

use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class MessageNotFoundException extends NotFoundHttpException
{
    public function __construct()
    {
        parent::__construct('Le message demandé est introuvable.');
    }
}