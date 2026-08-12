<?php

namespace App\Service;

use App\DTO\CreateMessageDTO;
use App\Entity\Message;
use App\Entity\Utilisateur;
use App\Exception\MessageNotFoundException;
use App\Mapper\MessageMapper;
use App\Repository\MessageRepository;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\Conversation;
use App\Enum\MessageType;

class MessageService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly MessageRepository $messageRepository,
        private readonly MessageMapper $messageMapper,
        private readonly ConversationService $conversationService,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function create(int $conversationId, Utilisateur $utilisateur, CreateMessageDTO $dto): array
    {
        $conversation = $this->conversationService->findById($conversationId);

        $message = new Message();
        $message->setContenu($dto->contenu);
        $message->setType(MessageType::USER);
        $message->setAuteur($utilisateur);

        $conversation->addMessage($message);
        $this->entityManager->persist($message);
        $this->entityManager->flush();

        $destinataire = $conversation->getCreateurSignalement()->getId() === $utilisateur->getId()
            ? $conversation->getProprietaireAvis()
            : $conversation->getCreateurSignalement();

        if ($destinataire->getId() !== $utilisateur->getId()) {
            $this->notificationService->notifyNouveauMessage(
                $utilisateur,
                $destinataire,
                $conversation->getId()
            );
        }

        return $this->messageMapper->toArray($message);
    }

    public function findById(int $id): Message
    {
        $message = $this->messageRepository->find($id);
        if (!$message) {
            throw new MessageNotFoundException();
        }
        return $message;
    }

    public function getMessage(int $id, Utilisateur $utilisateur): array
    {
        $message = $this->findById($id);
        return $this->messageMapper->toArray($message);
    }

    public function getConversationMessages(int $conversationId, Utilisateur $utilisateur): array
    {
        $conversation = $this->conversationService->findById($conversationId);
        $messages = $this->messageRepository->findByConversation($conversation);
        return $this->messageMapper->toArrayCollection($messages);
    }

    public function markAsRead(int $id, Utilisateur $utilisateur): array
    {
        $message = $this->findById($id);
        $message->markAsRead();
        $this->entityManager->flush();
        return $this->messageMapper->toArray($message);
    }

    public function report(int $id, Utilisateur $utilisateur): array
    {
        $message = $this->findById($id);
        $message->setSignalePar($utilisateur);
        $this->entityManager->flush();

        $this->notificationService->notifyMessageSignale($message);

        return $this->messageMapper->toArray($message);
    }

    public function delete(int $id, Utilisateur $utilisateur): void
    {
        $message = $this->findById($id);
        $this->entityManager->remove($message);
        $this->entityManager->flush();
    }
}
