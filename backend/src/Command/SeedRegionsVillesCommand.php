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
            'Adamaoua' => ['code' => 'AD', 'villes' => ['Ngaoundéré', 'Meiganga', 'Tibati', 'Banyo', 'Kontcha', 'Martap', 'Djohong', 'Ngaoundal', 'Tignère', 'Belel']],
            'Centre' => ['code' => 'CE', 'villes' => ['Yaoundé', 'Mbalmayo', 'Nanga-Eboko', 'Monatélé', 'Eseka', 'Obala', 'Bafia', 'Ntui', 'Sa\'a', 'Mbandjock', 'Nkoteng', 'Mfou', 'Akono', 'Ngomedzap']],
            'Est' => ['code' => 'ES', 'villes' => ['Bertoua', 'Batouri', 'Yokadouma', 'Garoua-Boulaï', 'Abong-Mbang', 'Bétaré-Oya', 'Ndelele', 'Dimako', 'Ngoura', 'Mbang', 'Moloundou']],
            'Extrême-Nord' => ['code' => 'EN', 'villes' => ['Maroua', 'Kousseri', 'Yagoua', 'Mokolo', 'Mora', 'Kaele', 'Bogo', 'Pouss', 'Guidiguis', 'Magui', 'Tokombéré', 'Moutourwa']],
            'Littoral' => ['code' => 'LT', 'villes' => ['Douala', 'Edéa', 'Nkongsamba', 'Limbé', 'Buéa', 'Tiko', 'Bonabéri', 'Diang', 'Loum', 'Penja', 'Manjo', 'Yabassi']],
            'Nord' => ['code' => 'NO', 'villes' => ['Garoua', 'Poli', 'Rey-Bouba', 'Guider', 'Pitoa', 'Lagos', 'Gashiga', 'Bibemi', 'Figuil', 'Tcholliré']],
            'Nord-Ouest' => ['code' => 'NW', 'villes' => ['Bamenda', 'Kumbo', 'Wum', 'Nkambe', 'Fundong', 'Mbengwi', 'Bali', 'Ndop', 'Jakiri', 'Oku', 'Belo', 'Santa']],
            'Ouest' => ['code' => 'OU', 'villes' => ['Bafoussam', 'Dschang', 'Bafang', 'Mbouda', 'Foumban', 'Foumbot', 'Bandjoun', 'Bamendjou', 'Bangangté', 'Baham', 'Kékem', 'Melong']],
            'Sud' => ['code' => 'SU', 'villes' => ['Ebolowa', 'Sangmélima', 'Ambam', 'Kribi', 'Campo', 'Mvomeka\'a', 'Zoétélé', 'Oveng', 'Djoum', 'Lobo']],
            'Sud-Ouest' => ['code' => 'SW', 'villes' => ['Buea', 'Limbe', 'Kumba', 'Mamfe', 'Tiko', 'Ekondo-Titi', 'Mundemba', 'Muyuka', 'Mutengene', 'Idenau', 'Eyumojock', 'Nguti']],
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
