<?php

namespace App\Command;

use App\Entity\Region;
use App\Entity\Ville;
use App\Repository\RegionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(
    name: 'app:seed-regions-villes',
    description: 'Seed regions and villes of Cameroon',
)]
class SeedRegionsVillesCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly RegionRepository $regionRepository,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        if ($this->regionRepository->count([]) > 0) {
            $output->writeln('Regions already seeded, skipping.');

            return Command::SUCCESS;
        }

        $regionsData = [
            'Adamaoua' => ['code' => 'AD', 'villes' => ['Ngaoundéré', 'Meiganga', 'Tibati', 'Banyo', 'Kontcha']],
            'Centre' => ['code' => 'CE', 'villes' => ['Yaoundé', 'Mbalmayo', 'Nanga-Eboko', 'Monatélé', 'Eseka', 'Essimbil']],
            'Est' => ['code' => 'ES', 'villes' => ['Bertoua', 'Batouri', 'Yokadouma', 'Garoua-Boulaï', 'Abong-Mbang']],
            'Extrême-Nord' => ['code' => 'EN', 'villes' => ['Maroua', 'Kousseri', 'Yagoua', 'Waza', 'Mokolo']],
            'Littoral' => ['code' => 'LT', 'villes' => ['Douala', 'Edéa', 'Nkongsamba', 'Limbé', 'Buéa', 'Tiko']],
            'Nord' => ['code' => 'NO', 'villes' => ['Garoua', 'Poli', 'Rey-Bouba', 'Guider', 'Mogode']],
            'Nord-Ouest' => ['code' => 'NW', 'villes' => ['Bamenda', 'Kumbo', 'Wum', 'Nkambe', 'Fundong']],
            'Ouest' => ['code' => 'OU', 'villes' => ['Dschang', 'Bafang', 'Mbouda', 'Bangou', 'Bandjoun']],
            'Sud' => ['code' => 'SU', 'villes' => ['Ebolowa', 'Sangmélima', 'Ambam', 'Kribi', 'Campo']],
            'Sud-Ouest' => ['code' => 'SW', 'villes' => ['Kumba', 'Mamfe', 'Tiko', 'Ekondo-Titi', 'Idabato']],
        ];

        $regionCount = 0;
        $villeCount = 0;

        foreach ($regionsData as $regionName => $data) {
            $region = new Region();
            $region->setNom($regionName);
            $region->setCode($data['code']);
            $this->entityManager->persist($region);
            $regionCount++;

            foreach ($data['villes'] as $villeName) {
                $ville = new Ville();
                $ville->setNom($villeName);
                $ville->setRegion($region);
                $this->entityManager->persist($ville);
                $villeCount++;
            }
        }

        $this->entityManager->flush();

        $output->writeln(sprintf('Created %d regions and %d villes.', $regionCount, $villeCount));

        return Command::SUCCESS;
    }
}
