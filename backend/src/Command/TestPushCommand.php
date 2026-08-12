<?php

namespace App\Command;

use App\Entity\Utilisateur;
use App\Service\FirebaseService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:test-push',
    description: 'Envoyer une notification push de test à un utilisateur par email'
)]
class TestPushCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly FirebaseService $firebaseService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('email', InputArgument::REQUIRED, 'Adresse email de l\'utilisateur')
            ->addArgument('message', InputArgument::OPTIONAL, 'Message de la notification', 'Ceci est une notification de test.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $email = $input->getArgument('email');
        $message = $input->getArgument('message');

        if (!$this->firebaseService->isConfigured()) {
            $output->writeln('<error>Firebase n\'est pas configuré (FIREBASE_CREDENTIALS manquant).</error>');
            return Command::FAILURE;
        }

        $utilisateur = $this->entityManager->getRepository(Utilisateur::class)->findOneBy(['email' => $email]);
        if (!$utilisateur) {
            $output->writeln(sprintf('<error>Utilisateur %s introuvable.</error>', $email));
            return Command::FAILURE;
        }

        $token = $utilisateur->getFcmToken();
        if (!$token) {
            $output->writeln(sprintf('<error>L\'utilisateur %s n\'a pas de token FCM enregistré.</error>', $email));
            return Command::FAILURE;
        }

        try {
            $this->firebaseService->sendPushNotification(
                $token,
                'Test push',
                $message,
                ['type' => 'test']
            );
            $output->writeln('<info>Notification push envoyée avec succès.</info>');
        } catch (\Throwable $e) {
            $output->writeln(sprintf('<error>Échec de l\'envoi : %s</error>', $e->getMessage()));
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
