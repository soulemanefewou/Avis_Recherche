<?php

namespace App\Service;

use App\Entity\AvisRecherche;
use App\Entity\AvisCitoyen;
use App\Entity\AvisOfficiel;
use App\Entity\Commissariat;
use App\Entity\Conversation;
use App\Entity\Message;
use App\Entity\Photo;
use App\Entity\Signalement;
use App\Entity\Utilisateur;
use App\Enum\ConversationStatut;
use App\Exception\AccessDeniedException;

class AuthorizationService
{
    public function ensureCanAccessConversation(Conversation $conversation, Utilisateur $utilisateur): void
    {
        if ($conversation->getStatut() === ConversationStatut::ARCHIVEE) {
            throw new AccessDeniedException("Cette conversation est archivée.");
        }
        if ($conversation->getCreateurSignalement()->getId() !== $utilisateur->getId()
            && $conversation->getProprietaireAvis()->getId() !== $utilisateur->getId()
            && !$this->isSuperAdmin($utilisateur)) {
            throw new AccessDeniedException("Vous ne participez pas à cette conversation.");
        }
    }

    public function ensureCanSendMessage(Conversation $conversation, Utilisateur $utilisateur): void
    {
        if ($conversation->getStatut() === ConversationStatut::LECTURE_SEULE) {
            throw new AccessDeniedException("Cette conversation est en lecture seule.");
        }
        $this->ensureCanAccessConversation($conversation, $utilisateur);
    }

    public function ensureCanEditAvis(AvisRecherche $avis, Utilisateur $utilisateur): void
    {
        if ($this->isSuperAdmin($utilisateur) || $this->isFondateur($utilisateur)) {
            return;
        }
        if ($avis instanceof AvisCitoyen && $avis->getAuteur()->getId() === $utilisateur->getId()) {
            return;
        }
        if ($avis instanceof AvisOfficiel && $this->isCommissariat($utilisateur)) {
            $commissariat = $this->getUserCommissariat($utilisateur);
            if ($commissariat && $avis->getCommissariat()->getId() === $commissariat->getId()) {
                return;
            }
        }
        throw new AccessDeniedException("Vous ne pouvez pas modifier cet avis.");
    }

    public function ensureCanDeletePhoto(Photo $photo, Utilisateur $utilisateur): void
    {
        $avis = $photo->getAvisRecherche();
        $this->ensureCanEditAvis($avis, $utilisateur);
    }

    public function ensureCanValidateAvis(Utilisateur $utilisateur): void
    {
        if (!$this->isSuperAdmin($utilisateur) && !$this->isFondateur($utilisateur)) {
            throw new AccessDeniedException("Seul un super admin peut valider les avis.");
        }
    }

    public function ensureIsCommissariat(Utilisateur $utilisateur): Commissariat
    {
        $commissariat = $this->getUserCommissariat($utilisateur);
        if (!$commissariat) {
            throw new AccessDeniedException("Vous n'êtes pas associé à un commissariat.");
        }
        return $commissariat;
    }

    public function isSuperAdmin(Utilisateur $utilisateur): bool
    {
        return in_array('ROLE_SUPER_ADMIN', $utilisateur->getRoles(), true);
    }

    public function isFondateur(Utilisateur $utilisateur): bool
    {
        return in_array('ROLE_FONDATEUR', $utilisateur->getRoles(), true);
    }

    public function isCommissariat(Utilisateur $utilisateur): bool
    {
        return in_array('ROLE_COMMISSARIAT', $utilisateur->getRoles(), true);
    }

    private function getUserCommissariat(Utilisateur $utilisateur): ?Commissariat
    {
        return $utilisateur->getCommissariat();
    }

    public function canHideSignalement(Utilisateur $utilisateur): bool
    {
        return $this->isSuperAdmin($utilisateur) || $this->isFondateur($utilisateur);
    }
}
