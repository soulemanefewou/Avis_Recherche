<?php

namespace App\Response;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ApiResponse
{
    public static function success(
        mixed $data = null,
        ?string $message = null,
        int $status = Response::HTTP_OK
    ): JsonResponse
    {
        $response = [
            'success' => true,
        ];

        if ($message !== null) {
            $response['message'] = $message;
        }

        if ($data !== null) {
            $response['data'] = $data;
        }

        return new JsonResponse($response, $status);
    }

    public static function created(
        mixed $data = null,
        string $message = 'Ressource créée avec succès.'
    ): JsonResponse
    {
        return self::success(
            $data,
            $message,
            Response::HTTP_CREATED
        );
    }

    public static function paginated(
        array $data,
        array $pagination
    ): JsonResponse
    {
        return new JsonResponse([
            'success' => true,
            'data' => $data,
            'pagination' => $pagination
        ]);
    }

    public static function error(
        string $message,
        int $status,
        mixed $errors = null
    ): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return new JsonResponse($response, $status);
    }
}