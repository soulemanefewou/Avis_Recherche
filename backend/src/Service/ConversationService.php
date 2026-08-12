<?php

namespace App\Service;

use App\Entity\AvisRecherche;
use App\Entity\AvisCitoyen;
use App\Entity\AvisOfficiel;
use App\Entity\Commissariat;
use App\Entity\Conversation;
use App\Entity\Message;
use App\Entity\Utilisateur;
use App\Enum\ConversationStatut;
use App\Enum\ConversationType;
use App\Enum\MessageType;
use App\Exception\ConversationNotFoundException;
use App\Mapper\ConversationMapper;
use App\Repository\ConversationRepository;
use Doctrine\ORM\EntityManagerInterface;

class ConversationService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ConversationRepository $conversationRepository,
        private readonly ConversationMapper $conversationMapper,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function create(AvisRecherche $avisRecherche, Utilisateur $createur, string $contenu, ?ConversationType $type = null): Conversation
    {
        $proprietaireAvis = $this->getProprietaireAvis($avisRecherche);

        $existing = $this->conversationRepository->findExistingConversation(
            $avisRecherche, $createur, $proprietaireAvis
        );
        if ($existing) {
            return $existing;
        }

        $conversation = new Conversation();
        $conversation->setAvisRecherche($avisRecherche);
        $conversation->setCreateurSignalement($createur);
        $conversation->setProprietaireAvis($proprietaireAvis);
        $conversation->setStatut(ConversationStatut::ACTIVE);
        $conversation->setType($type ?? ConversationType::PROCHE_TEMOIN);

        $this->entityManager->persist($conversation);

        if ($contenu !== '') {
            $message = new Message();
            $message->setContenu($contenu);
            $message->setType(MessageType::USER);
            $message->setAuteur($createur);
            $conversation->addMessage($message);
            $this->entityManager->persist($message);
        }

        $this->entityManager->flush();

        if ($proprietaireAvis->getId() !== $createur->getId()) {
            $this->notificationService->create(
                $proprietaireAvis,
                'Nouvelle conversation',
                sprintf('%s %s a ouvert une conversation concernant un avis de recherche.', $createur->getPrenom(), $createur->getNom()),
                \App\Enum\NotificationType::MESSAGE
            );
        }

        return $conversation;
    }

    public function findById(int $id): Conversation
    {
        $conversation = $this->conversationRepository->find($id);
        if (!$conversation) {
            throw new ConversationNotFoundException();
        }
        return $conversation;
    }

    public function findByUtilisateur(Utilisateur $utilisateur): array
    {
        $conversations = $this->conversationRepository->findByUtilisateur($utilisateur);
        return $this->conversationMapper->toArrayCollection($conversations);
    }

    public function getConversation(int $id, Utilisateur $utilisateur): array
    {
        $conversation = $this->findById($id);
        return $this->conversationMapper->toArray($conversation);
    }

    public function setReadOnly(Conversation $conversation): void
    {
        $conversation->setStatut(ConversationStatut::LECTURE_SEULE);
        $this->entityManager->flush();
    }

    public function archive(Conversation $conversation): void
    {
        $conversation->setStatut(ConversationStatut::ARCHIVEE);
        $this->entityManager->flush();
    }

    private function getProprietaireAvis(AvisRecherche $avisRecherche): Utilisateur
    {
        if ($avisRecherche instanceof AvisCitoyen) {
            return $avisRecherche->getAuteur();
        }
        if ($avisRecherche instanceof AvisOfficiel) {
            $commissariat = $avisRecherche->getCommissariat();
            if ($commissariat && $commissariat->getUtilisateur()) {
                return $commissariat->getUtilisateur();
            }
        }
        throw new \RuntimeException('Impossible de déterminer le propriétaire de l\'avis.');
    }
}
