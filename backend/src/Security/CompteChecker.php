<?php

namespace App\Security;

use App\Entity\Utilisateur;
use App\Security\Exception\CompteDesactiveException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

final class CompteChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
        if ($user instanceof Utilisateur && !$user->isActif()) {
            throw new CompteDesactiveException();
        }
    }

    public function checkPostAuth(UserInterface $user): void
    {
    }
}
