<?php

namespace App\Service;

use App\Repository\RegionRepository;
use App\Repository\VilleRepository;

class RegionService
{
    public function __construct(
        private readonly RegionRepository $regionRepository,
        private readonly VilleRepository $villeRepository,
    ) {
    }

    public function findAll(): array
    {
        $regions = $this->regionRepository->findAll();

        return array_map(fn($region) => [
            'id' => $region->getId(),
            'nom' => $region->getNom(),
            'code' => $region->getCode(),
        ], $regions);
    }

    public function findVillesByRegion(int $regionId): array
    {
        $villes = $this->villeRepository->findBy(
            ['region' => $regionId],
            ['nom' => 'ASC']
        );

        return array_map(fn($ville) => [
            'id' => $ville->getId(),
            'nom' => $ville->getNom(),
        ], $villes);
    }
}
