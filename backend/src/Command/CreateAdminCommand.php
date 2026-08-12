<?php

namespace App\Command;

use App\Entity\Utilisateur;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:create-admin',
    description: 'Créer un compte avec un rôle administrateur (FONDATEUR, SUPER_ADMIN, ou COMMISSARIAT)'
)]
class CreateAdminCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('role', InputArgument::REQUIRED, 'Rôle: FONDATEUR, SUPER_ADMIN ou COMMISSARIAT')
            ->addArgument('email', InputArgument::REQUIRED, 'Adresse email')
            ->addArgument('nom', InputArgument::REQUIRED, 'Nom')
            ->addArgument('prenom', InputArgument::REQUIRED, 'Prénom')
            ->addArgument('telephone', InputArgument::REQUIRED, 'Téléphone')
            ->addArgument('password', InputArgument::REQUIRED, 'Mot de passe (min 8 caractères)');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $role = strtoupper($input->getArgument('role'));
        $email = $input->getArgument('email');
        $nom = $input->getArgument('nom');
        $prenom = $input->getArgument('prenom');
        $telephone = $input->getArgument('telephone');
        $password = $input->getArgument('password');

        $validRoles = ['FONDATEUR', 'SUPER_ADMIN', 'COMMISSARIAT'];
        if (!in_array($role, $validRoles, true)) {
            $output->writeln('<error>Rôle invalide. Utilisez: FONDATEUR, SUPER_ADMIN ou COMMISSARIAT</error>');
            return Command::FAILURE;
        }

        if (strlen($password) < 8) {
            $output->writeln('<error>Le mot de passe doit contenir au moins 8 caractères.</error>');
            return Command::FAILURE;
        }

        $existing = $this->entityManager->getRepository(Utilisateur::class)->findOneBy(['email' => $email]);
        if ($existing) {
            $output->writeln('<error>Un compte avec cet email existe déjà.</error>');
            return Command::FAILURE;
        }

        $utilisateur = new Utilisateur();
        $utilisateur->setNom($nom);
        $utilisateur->setPrenom($prenom);
        $utilisateur->setEmail($email);
        $utilisateur->setTelephone($telephone);
        $utilisateur->setRoles(['ROLE_' . $role]);
        $utilisateur->setActif(true);

        $hashedPassword = $this->passwordHasher->hashPassword($utilisateur, $password);
        $utilisateur->setPassword($hashedPassword);

        $this->entityManager->persist($utilisateur);
        $this->entityManager->flush();

        $output->writeln(sprintf(
            '<info>Compte %s créé avec succès!</info>',
            $role
        ));
        $output->writeln(sprintf(
            '  Email: %s%s  Nom: %s %s%s  Téléphone: %s%s  Rôle: ROLE_%s',
            $email, PHP_EOL,
            $prenom, $nom, PHP_EOL,
            $telephone, PHP_EOL,
            $role
        ));

        return Command::SUCCESS;
    }
}
