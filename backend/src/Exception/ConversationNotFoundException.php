<?php

namespace App\Exception;

use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ConversationNotFoundException extends NotFoundHttpException
{
    public function __construct(
        string $message = 'Conversation introuvable.'
    ) {
        parent::__construct($message);
    }
}