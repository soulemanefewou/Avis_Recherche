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
        // CAST(roles AS text) : le LIKE direct sur une colonne json echoue en
        // PostgreSQL ("operator does not exist: json ~~ unknown").
        $conn = $this->getEntityManager()->getConnection();
        $rows = $conn->fetchAllAssociative(
            'SELECT id FROM utilisateur WHERE CAST(roles AS text) LIKE :role',
            ['role' => '%' . $role . '%']
        );

        $result = [];
        foreach ($rows as $row) {
            $u = $this->find((int) $row['id']);
            if ($u) {
                $result[] = $u;
            }
        }
        return $result;
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
