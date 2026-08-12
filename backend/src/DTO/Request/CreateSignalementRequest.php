<?php

namespace App\DTO\Request;
use Symfony\Component\Validator\Constraints as Assert;

class CreateSignalementRequest
{
    public function __construct(
    #[Assert\NotBlank]
    #[Assert\Length(min: 10, max: 2000)]
    public readonly string $description,

    #[Assert\NotBlank]
    #[Assert\Length(max: 255)]
    public readonly string $lieu,

    #[Assert\NotNull]
    public readonly \DateTimeImmutable $dateObservation,

    #[Assert\Length(max: 30)]
    public readonly ?string $telephoneContact = null
) {
}
}