<?php

namespace App\Factory;

use App\DTO\Request\CreateSignalementRequest;
use Symfony\Component\HttpFoundation\Request;

class SignalementRequestFactory
{
    public function createFromRequest(
        Request $request
    ): CreateSignalementRequest
    {
        $data = $request->toArray();

        return new CreateSignalementRequest(
            description: trim($data['description'] ?? ''),
            lieu: trim($data['lieu'] ?? ''),
            dateObservation: new \DateTimeImmutable(
                $data['dateObservation']
            ),
            telephoneContact: trim(
                $data['telephoneContact'] ?? ''
            )
        );
    }
}