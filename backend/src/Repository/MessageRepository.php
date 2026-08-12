<?php

namespace App\Repository;

use App\Entity\Conversation;
use App\Entity\Message;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Message>
 */
class MessageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Message::class);
    }

    /**
     * Retourne tous les messages d'une conversation,
     * du plus ancien au plus récent.
     */
    public function findByConversation(Conversation $conversation): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.conversation = :conversation')
            ->setParameter('conversation', $conversation)
            ->orderBy('m.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Retourne les messages non lus d'une conversation.
     */
    public function findUnreadMessages(Conversation $conversation): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.conversation = :conversation')
            ->andWhere('m.lu = false')
            ->setParameter('conversation', $conversation)
            ->orderBy('m.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Compte les messages non lus d'une conversation.
     */
    public function countUnreadMessages(Conversation $conversation): int
    {
        return (int) $this->createQueryBuilder('m')
            ->select('COUNT(m.id)')
            ->where('m.conversation = :conversation')
            ->andWhere('m.lu = false')
            ->setParameter('conversation', $conversation)
            ->getQuery()
            ->getSingleScalarResult();
    }
}