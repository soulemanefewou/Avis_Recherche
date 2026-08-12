<?php

namespace App\Repository;

use App\Entity\Region;
use App\Entity\Utilisateur;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Utilisateur>
 */
class UtilisateurRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Utilisateur::class);
    }

    /**
     * @return Utilisateur[]
     */
    public function findByRole(string $role): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.roles LIKE :role')
            ->setParameter('role', '%' . $role . '%')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Utilisateur[]
     */
    public function findByRegion(?Region $region): array
    {
        if ($region === null) {
            return [];
        }

        return $this->createQueryBuilder('u')
            ->where('u.region = :region')
            ->setParameter('region', $region)
            ->getQuery()
            ->getResult();
    }
}
