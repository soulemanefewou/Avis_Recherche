<?php

namespace App\Repository;

use App\Entity\AvisCitoyen;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class AvisCitoyenRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AvisCitoyen::class);
    }
}
