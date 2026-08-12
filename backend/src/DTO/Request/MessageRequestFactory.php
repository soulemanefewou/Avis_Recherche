<?php

namespace App\DTO\Request;

use App\DTO\Request\CreateMessageRequest;
use App\Enum\MessageType;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class MessageRequestFactory
{
    public function __construct(
        private readonly ValidatorInterface $validator
    ) {
    }

    public function createFromRequest(Request $request): CreateMessageRequest
    {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            throw new BadRequestHttpException('Le corps de la requête est invalide.');
        }

        $dto = new CreateMessageRequest();

        $dto->contenu = trim($data['contenu'] ?? '');

        $dto->type = isset($data['type'])
            ? MessageType::from($data['type'])
            : MessageType::USER;

        $errors = $this->validator->validate($dto);

        if (count($errors) > 0) {
            throw new BadRequestHttpException((string) $errors);
        }

        return $dto;
    }
}