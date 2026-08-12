<?php

namespace App\Mapper;

use App\Entity\Photo;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class PhotoMapper
{
    public function __construct(
        #[Autowire('%app_base_url%')]
        private string $baseUrl
    ) {
    }

    public function toArray(Photo $photo): array
    {
         return [
            'id' => $photo->getId(),
            'nomOriginal' => $photo->getNomOriginal(),
            'url' => $this->baseUrl . '/' . $photo->getChemin(),
            'taille' => $photo->getTaille(),
            'mimeType' => $photo->getMimeType(),
            'estPrincipale' => $photo->isEstPrincipale(),
        ];
    }
}