<?php

namespace App\Repository;

use App\Entity\AvisRecherche;
use App\Entity\Conversation;
use App\Entity\Utilisateur;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Conversation>
 */
class ConversationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Conversation::class);
    }

    /**
     * Retourne toutes les conversations d'un utilisateur,
     * triées du plus récent au plus ancien.
     */
    public function findByUtilisateur(Utilisateur $utilisateur): array
    {
        return $this->createQueryBuilder('c')
            ->leftJoin('c.createurSignalement', 'cs')
            ->leftJoin('c.proprietaireAvis', 'pa')
            ->where('cs = :utilisateur')
            ->orWhere('pa = :utilisateur')
            ->setParameter('utilisateur', $utilisateur)
            ->orderBy('c.lastMessageAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Recherche une conversation entre deux utilisateurs
     * pour un avis de recherche donné.
     */
    public function findExistingConversation(
        AvisRecherche $avisRecherche,
        Utilisateur $createurSignalement,
        Utilisateur $proprietaireAvis
    ): ?Conversation {
        return $this->createQueryBuilder('c')
            ->where('c.avisRecherche = :avis')
            ->andWhere('c.createurSignalement = :createur')
            ->andWhere('c.proprietaireAvis = :proprietaire')
            ->setParameter('avis', $avisRecherche)
            ->setParameter('createur', $createurSignalement)
            ->setParameter('proprietaire', $proprietaireAvis)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Retourne une conversation avec tous ses messages.
     */
    public function findWithMessages(int $id): ?Conversation
    {
        return $this->createQueryBuilder('c')
            ->leftJoin('c.messages', 'm')
            ->addSelect('m')
            ->where('c.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();
    }
}