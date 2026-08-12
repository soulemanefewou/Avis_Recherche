<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class SecurityController
{
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(): Response
    {
        throw new \LogicException(
            'Cette méthode ne devrait jamais être exécutée. Le firewall json_login doit intercepter cette requête.'
        );
    }
}