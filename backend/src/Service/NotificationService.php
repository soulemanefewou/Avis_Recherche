<?php

namespace App\Service;

use App\Entity\AvisRecherche;
use App\Entity\CommissariatDemande;
use App\Entity\Message;
use App\Entity\Notification;
use App\Entity\Utilisateur;
use App\Enum\NotificationType;
use App\Exception\NotificationNotFoundException;
use App\Mapper\NotificationMapper;
use App\Repository\NotificationRepository;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

class NotificationService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly NotificationRepository $notificationRepository,
        private readonly UtilisateurRepository $utilisateurRepository,
        private readonly NotificationMapper $notificationMapper,
        private readonly FirebaseService $firebaseService,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function create(
        Utilisateur $utilisateur,
        string $titre,
        string $contenu,
        NotificationType $type,
        array $data = []
    ): array {
        $notification = $this->persistNotification($utilisateur, $titre, $contenu, $type);
        $this->entityManager->flush();

        $this->sendPushNotification($utilisateur, $titre, $contenu, $type, $data);

        return $this->notificationMapper->toArray($notification);
    }

    private function persistNotification(
        Utilisateur $utilisateur,
        string $titre,
        string $contenu,
        NotificationType $type
    ): Notification {
        $notification = new Notification();

        $notification->setUtilisateur($utilisateur);
        $notification->setTitre($titre);
        $notification->setContenu($contenu);
        $notification->setType($type);

        $this->entityManager->persist($notification);

        return $notification;
    }

    private function sendPushNotification(
        Utilisateur $utilisateur,
        string $titre,
        string $contenu,
        NotificationType $type,
        array $data = []
    ): void {
        $token = $utilisateur->getFcmToken();

        if ($token === null || $token === '' || !$this->firebaseService->isConfigured()) {
            return;
        }

        $payload = array_merge(['type' => $type->value], $data);

        try {
            $this->firebaseService->sendPushNotification(
                $token,
                $titre,
                $contenu,
                $payload
            );
        } catch (\Throwable $e) {
            $this->logger->error('Échec de l\'envoi de la notification push FCM : ' . $e->getMessage());

            if (preg_match(
                '/(registration-token-not-registered|InvalidRegistration|Unregistered|invalid-registration-token)/i',
                $e->getMessage()
            )) {
                $utilisateur->setFcmToken(null);
                $this->entityManager->flush();
            }
        }
    }

    /**
     * Crée une notification in-app pour plusieurs utilisateurs puis envoie une
     * push groupée aux tokens FCM disponibles.
     *
     * @param Utilisateur[] $utilisateurs
     */
    private function createMany(
        array $utilisateurs,
        string $titre,
        string $contenu,
        NotificationType $type,
        array $data = [],
        ?Utilisateur $excluded = null
    ): void {
        $tokens = [];

        foreach ($utilisateurs as $utilisateur) {
            if (!$utilisateur instanceof Utilisateur) {
                continue;
            }
            if ($excluded !== null && $utilisateur->getId() === $excluded->getId()) {
                continue;
            }

            $this->persistNotification($utilisateur, $titre, $contenu, $type);

            $token = $utilisateur->getFcmToken();
            if ($token !== null && $token !== '') {
                $tokens[] = $token;
            }
        }

        $this->entityManager->flush();

        if ($tokens !== [] && $this->firebaseService->isConfigured()) {
            $payload = array_merge(['type' => $type->value], $data);

            try {
                $this->firebaseService->sendBulkPushNotification($tokens, $titre, $contenu, $payload);
            } catch (\Throwable $e) {
                $this->logger->error('Échec de l\'envoi de la notification push groupée FCM : ' . $e->getMessage());
            }
        }
    }

    /**
     * @return Utilisateur[]
     */
    public function findSuperAdmins(): array
    {
        return $this->utilisateurRepository->findByRole('ROLE_SUPER_ADMIN');
    }

    /**
     * @return Utilisateur[]
     */
    public function findFondateurs(): array
    {
        return $this->utilisateurRepository->findByRole('ROLE_FONDATEUR');
    }

    // ──────────────────────────────────────────────
    // Notifications Utilisateur
    // ──────────────────────────────────────────────

    public function notifyAvisCitoyenEnAttente(Utilisateur $auteur, AvisRecherche $avis): void
    {
        $this->create(
            $auteur,
            'Avis en attente de validation',
            'Votre avis est en attente de validation.',
            NotificationType::AVIS_EN_ATTENTE,
            ['link' => '/avis/' . $avis->getId()]
        );
    }

    public function notifyAvisCitoyenPublie(Utilisateur $auteur, AvisRecherche $avis): void
    {
        $this->create(
            $auteur,
            'Avis publié',
            'Votre avis est maintenant public.',
            NotificationType::AVIS_PUBLIE,
            ['link' => '/avis/' . $avis->getId()]
        );
    }

    public function notifyAvisCitoyenRejete(Utilisateur $auteur, AvisRecherche $avis, ?string $motif): void
    {
        $contenu = 'Votre avis a été rejeté.';
        if ($motif !== null && $motif !== '') {
            $contenu .= ' Motif : ' . $motif;
        }

        $this->create(
            $auteur,
            'Avis rejeté',
            $contenu,
            NotificationType::AVIS_REJETE,
            ['link' => '/avis/' . $avis->getId()]
        );
    }

    public function notifyCompteDesactive(Utilisateur $utilisateur): void
    {
        $this->create(
            $utilisateur,
            'Compte désactivé',
            'Votre compte a été désactivé par le fondateur. Vous ne pouvez plus vous connecter jusqu\'à sa réactivation.',
            NotificationType::COMPTE_DESACTIVE
        );
    }

    public function notifyCompteReactive(Utilisateur $utilisateur): void
    {
        $this->create(
            $utilisateur,
            'Compte réactivé',
            'Votre compte a été réactivé par le fondateur. Vous pouvez de nouveau vous connecter.',
            NotificationType::COMPTE_REACTIVE
        );
    }

    /**
     * Alerte les super admins qu'un avis citoyen attend leur validation.
     */
    public function notifyAvisCitoyenAValider(Utilisateur $auteur, AvisRecherche $avis): void
    {
        $this->createMany(
            $this->findSuperAdmins(),
            'Nouvel avis citoyen',
            sprintf(
                'Un avis citoyen (%s %s) attend votre validation.',
                $avis->getPrenom(),
                $avis->getNom()
            ),
            NotificationType::AVIS_A_VALIDER,
            ['link' => '/super-admin/avis/' . $avis->getId()],
            $auteur
        );
    }

    /**
     * Alerte les utilisateurs de la région de l'avis d'une nouvelle disparition publiée.
     */
    public function notifyNouvelAvisRegion(AvisRecherche $avis, ?Utilisateur $excluded = null): void
    {
        $region = $avis->getRegion();
        if ($region === null) {
            return;
        }

        $utilisateurs = $this->utilisateurRepository->findByRegion($region);

        $this->createMany(
            $utilisateurs,
            'Nouvelle disparition signalée',
            sprintf(
                'Nouvelle disparition signalée dans la région %s.',
                $region->getNom()
            ),
            NotificationType::NOUVEL_AVIS_REGION,
            ['link' => '/avis/' . $avis->getId()],
            $excluded
        );
    }

    public function notifyNouveauSignalement(AvisRecherche $avis, bool $urgent): void
    {
        $link = ['link' => '/avis/' . $avis->getId()];

        if ($avis instanceof \App\Entity\AvisOfficiel) {
            $commissariat = $avis->getCommissariat();
            $destinataire = $commissariat?->getUtilisateur();

            if ($destinataire === null) {
                return;
            }

            if ($urgent) {
                $this->create(
                    $destinataire,
                    'Signalement urgent',
                    'Nouveau signalement urgent reçu.',
                    NotificationType::SIGNALEMENT_URGENT,
                    array_merge($link, ['priority' => 'urgent'])
                );
            } else {
                $this->create(
                    $destinataire,
                    'Nouveau signalement',
                    'Nouveau signalement reçu.',
                    NotificationType::SIGNALEMENT,
                    $link
                );
            }

            return;
        }

        if ($avis instanceof \App\Entity\AvisCitoyen) {
            $auteur = $avis->getAuteur();

            if ($auteur === null) {
                return;
            }

            if ($urgent) {
                $this->create(
                    $auteur,
                    'Signalement urgent',
                    'Signalement urgent reçu.',
                    NotificationType::SIGNALEMENT_URGENT,
                    array_merge($link, ['priority' => 'urgent'])
                );
            } else {
                $this->create(
                    $auteur,
                    'Nouveau signalement',
                    'Un nouveau témoignage a été ajouté concernant votre avis.',
                    NotificationType::SIGNALEMENT,
                    $link
                );
            }
        }
    }

    public function notifyNouveauMessage(Utilisateur $expediteur, Utilisateur $destinataire, int $conversationId): void
    {
        $this->create(
            $destinataire,
            'Nouveau message',
            sprintf(
                'Vous avez reçu un nouveau message de %s %s.',
                $expediteur->getPrenom(),
                $expediteur->getNom()
            ),
            NotificationType::MESSAGE,
            ['link' => '/conversations/' . $conversationId]
        );
    }

    public function notifyConfirmationRequise(Utilisateur $auteur, AvisRecherche $avis): void
    {
        $this->createMany(
            $this->findSuperAdmins(),
            'Confirmation requise',
            sprintf(
                'Un proche a déclaré %s %s comme retrouvé. Confirmation requise.',
                $avis->getPrenom(),
                $avis->getNom()
            ),
            NotificationType::CONFIRMATION_RETROUVE,
            ['link' => '/super-admin/avis/' . $avis->getId()],
            $auteur
        );
    }

    public function notifyRetrouveConfirme(Utilisateur $auteur, AvisRecherche $avis, string $statutLabel): void
    {
        $this->create(
            $auteur,
            'Statut de l\'avis',
            sprintf(
                'Votre demande a été traitée : %s %s est maintenant « %s ».',
                $avis->getPrenom(),
                $avis->getNom(),
                $statutLabel
            ),
            NotificationType::AVIS_STATUT,
            ['link' => '/avis/' . $avis->getId()]
        );
    }

    // ──────────────────────────────────────────────
    // Notifications Super Admin
    // ──────────────────────────────────────────────

    public function notifyDemandeCommissariatAValider(CommissariatDemande $demande): void
    {
        $this->createMany(
            $this->findSuperAdmins(),
            'Nouvelle demande de commissariat',
            'Une nouvelle demande de validation est disponible.',
            NotificationType::DEMANDE_VALIDATION,
            ['link' => '/super-admin/commissariat-demandes'],
            $demande->getUtilisateur()
        );
    }

    public function notifyMessageSignale(Message $message): void
    {
        $this->createMany(
            $this->findSuperAdmins(),
            'Message signalé',
            'Un message a été signalé.',
            NotificationType::MESSAGE_SIGNALE,
            ['link' => '/conversations/' . $message->getConversation()?->getId()]
        );
    }

    // ──────────────────────────────────────────────
    // Notifications Fondateur (système)
    // ──────────────────────────────────────────────

    public function notifySystem(string $contenu): void
    {
        $this->createMany(
            $this->findFondateurs(),
            'Notification système',
            $contenu,
            NotificationType::SYSTEM
        );
    }

    // ──────────────────────────────────────────────
    // Helpers existants
    // ──────────────────────────────────────────────

    public function findById(int $id): Notification
    {
        $notification = $this->notificationRepository->find($id);

        if (!$notification) {
            throw new NotificationNotFoundException();
        }

        return $notification;
    }

    public function getNotifications(Utilisateur $utilisateur): array
    {
        return $this->notificationMapper->toArrayCollection(
            $this->notificationRepository->findByUtilisateur($utilisateur)
        );
    }

    public function getNotification(
        int $id,
        Utilisateur $utilisateur
    ): array {
        $notification = $this->findById($id);

        $this->assertNotificationAccess(
            $notification,
            $utilisateur
        );

        return $this->notificationMapper->toArray($notification);
    }

    public function markAsRead(
        int $id,
        Utilisateur $utilisateur
    ): array {
        $notification = $this->findById($id);

        $this->assertNotificationAccess(
            $notification,
            $utilisateur
        );

        $notification->markAsRead();

        $this->entityManager->flush();

        return $this->notificationMapper->toArray($notification);
    }

    public function delete(
        int $id,
        Utilisateur $utilisateur
    ): void {
        $notification = $this->findById($id);

        $this->assertNotificationAccess(
            $notification,
            $utilisateur
        );

        $this->entityManager->remove($notification);
        $this->entityManager->flush();
    }

    public function countUnread(Utilisateur $utilisateur): int
    {
        return $this->notificationRepository->countUnread($utilisateur);
    }

    private function assertNotificationAccess(
        Notification $notification,
        Utilisateur $utilisateur
    ): void {
        if (
            $notification->getUtilisateur()->getId() !== $utilisateur->getId()
        ) {
            throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException(
                'Vous ne pouvez pas accéder à cette notification.'
            );
        }
    }

    public function notifyNewMessage(
        Utilisateur $expediteur,
        Utilisateur $destinataire
    ): void {
        $this->create(
            $destinataire,
            'Nouveau message',
            sprintf(
                '%s %s vous a envoyé un nouveau message.',
                $expediteur->getPrenom(),
                $expediteur->getNom()
            ),
            NotificationType::MESSAGE
        );
    }

    public function notifyNewSignalement(
        Utilisateur $destinataire,
        Utilisateur $auteur
    ): void {
        $this->create(
            $destinataire,
            'Nouveau signalement',
            sprintf(
                '%s %s a créé un signalement concernant votre avis de recherche.',
                $auteur->getPrenom(),
                $auteur->getNom()
            ),
            NotificationType::SIGNALEMENT
        );
    }

    public function notifyAvisArchived(
        Utilisateur $utilisateur
    ): void {
        $this->create(
            $utilisateur,
            'Avis archivé',
            'Votre avis de recherche a été archivé.',
            NotificationType::AVIS_STATUT
        );
    }

    public function notifyAvisPublie(Utilisateur $destinataire, AvisRecherche $avis): void
    {
        $this->create(
            $destinataire,
            'Avis publié',
            'Votre avis de recherche a été publié.',
            NotificationType::AVIS_PUBLIE
        );
    }

    public function notifyAvisStatut(Utilisateur $destinataire, string $message): void
    {
        $this->create(
            $destinataire,
            'Statut de l\'avis',
            $message,
            NotificationType::AVIS_STATUT
        );
    }

    public function notifyDemandeValidation(Utilisateur $destinataire, string $message): void
    {
        $this->create(
            $destinataire,
            'Demande de validation',
            $message,
            NotificationType::DEMANDE_VALIDATION
        );
    }

    public function notifySuiviQuotidien(Utilisateur $destinataire, AvisRecherche $avis): void
    {
        $this->create(
            $destinataire,
            'Suivi quotidien',
            sprintf(
                'La personne a-t-elle été retrouvée ? (%s %s)',
                $avis->getPrenom(),
                $avis->getNom()
            ),
            NotificationType::SUIVI_QUOTIDIEN,
            ['link' => '/suivi-quotidien/' . $avis->getId(), 'avisId' => (string) $avis->getId()]
        );
    }
}
