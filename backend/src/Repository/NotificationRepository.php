<?php

namespace App\Repository;

use App\Entity\Notification;
use App\Entity\Utilisateur;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Notification>
 */
class NotificationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Notification::class);
    }

     /**
     * Retourne les notifications d'un utilisateur
     */
    public function findByUtilisateur(Utilisateur $utilisateur): array
    {
        return $this->createQueryBuilder('n')
            ->andWhere('n.utilisateur = :utilisateur')
            ->setParameter('utilisateur', $utilisateur)
            ->orderBy('n.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Retourne uniquement les notifications non lues
     */
    public function findUnreadByUtilisateur(Utilisateur $utilisateur): array
    {
        return $this->createQueryBuilder('n')
            ->andWhere('n.utilisateur = :utilisateur')
            ->andWhere('n.lu = false')
            ->setParameter('utilisateur', $utilisateur)
            ->orderBy('n.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Compte les notifications non lues
     */
    public function countUnread(Utilisateur $utilisateur): int
    {
        return (int) $this->createQueryBuilder('n')
            ->select('COUNT(n.id)')
            ->andWhere('n.utilisateur = :utilisateur')
            ->andWhere('n.lu = false')
            ->setParameter('utilisateur', $utilisateur)
            ->getQuery()
            ->getSingleScalarResult();
    }

    //    /**
    //     * @return Notification[] Returns an array of Notification objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('n')
    //            ->andWhere('n.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('n.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Notification
    //    {
    //        return $this->createQueryBuilder('n')
    //            ->andWhere('n.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
