<?php

namespace App\EventListener;

use Throwable;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;

class ApiExceptionListener
{
    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        $statusCode = $exception->getCode();

        if ($statusCode < 100 || $statusCode >= 600) {
            $statusCode = 500;
        }

        $response = new JsonResponse(
            [
                'success' => false,
                'message' => $exception->getMessage(),
            ],
            $statusCode
        );

        $event->setResponse($response);
    }
}