<?php

namespace App\Exception;

use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class NotificationNotFoundException extends NotFoundHttpException
{
    public function __construct()
    {
        parent::__construct('Notification introuvable.');
    }
}