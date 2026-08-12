<?php

namespace App\Repository;

use App\Entity\AvisOfficiel;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class AvisOfficielRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AvisOfficiel::class);
    }
}
