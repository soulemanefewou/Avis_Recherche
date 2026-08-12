<?php

namespace App\Command;

use App\Entity\AvisCitoyen;
use App\Enum\AvisStatut;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:suivi-quotidien',
    description: 'Envoie la notification quotidienne « La personne a-t-elle été retrouvée ? » pour chaque avis citoyen actif'
)]
class SuiviQuotidienCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly NotificationService $notificationService,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $avisList = $this->entityManager->createQueryBuilder()
            ->select('a')
            ->from(AvisCitoyen::class, 'a')
            ->where('a.suiviActif = true')
            ->andWhere('a.statut = :statut')
            ->setParameter('statut', AvisStatut::RECHERCHE)
            ->getQuery()
            ->getResult();

        $count = 0;

        foreach ($avisList as $avis) {
            $auteur = $avis->getAuteur();
            if ($auteur === null) {
                continue;
            }

            $this->notificationService->notifySuiviQuotidien($auteur, $avis);
            $count++;
        }

        $output->writeln(sprintf('<info>%d notification(s) de suivi quotidien envoyée(s).</info>', $count));

        return Command::SUCCESS;
    }
}
