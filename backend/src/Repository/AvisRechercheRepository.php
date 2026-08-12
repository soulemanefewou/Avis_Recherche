<?php

namespace App\Repository;

use App\Entity\AvisRecherche;
use App\Entity\AvisCitoyen;
use App\Entity\AvisOfficiel;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use App\DTO\SearchAvisRechercheDTO;
use App\Enum\AvisStatut;

/**
 * @extends ServiceEntityRepository<AvisRecherche>
 */
class AvisRechercheRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AvisRecherche::class);
    }

    public function search(SearchAvisRechercheDTO $dto): array
    {
        $qb = $this->createQueryBuilder('a');

        if ($dto->statut !== null) {
            $qb->andWhere('a.statut = :statut')
                ->setParameter('statut', $dto->statut);
        } else {
            $qb->andWhere('a.statut IN (:statuts_visibles)')
                ->setParameter('statuts_visibles', [
                    AvisStatut::RECHERCHE,
                    AvisStatut::RETROUVE_VIVANT,
                    AvisStatut::RETROUVE_DECEDE,
                ]);
        }

        if (!empty($dto->search)) {
            $qb->andWhere('a.nom LIKE :search OR a.prenom LIKE :search')
                ->setParameter('search', '%' . $dto->search . '%');
        }

        if ($dto->sexe !== null) {
            $qb->andWhere('a.sexe = :sexe')
                ->setParameter('sexe', $dto->sexe);
        }

        if ($dto->region !== null) {
            $qb->andWhere('a.region = :region')
                ->setParameter('region', $dto->region);
        }

        if ($dto->ville !== null) {
            $qb->andWhere('a.ville = :ville')
                ->setParameter('ville', $dto->ville);
        }

        if ($dto->type !== null) {
            if ($dto->type === 'OFFICIEL') {
                $qb->andWhere('a INSTANCE OF :type')
                    ->setParameter('type', AvisOfficiel::class);
            } elseif ($dto->type === 'CITOYEN') {
                $qb->andWhere('a INSTANCE OF :type')
                    ->setParameter('type', AvisCitoyen::class);
            }
        }

        $totalQb = clone $qb;
        $total = (int) $totalQb->select('COUNT(a.id)')->getQuery()->getSingleScalarResult();

        $qb->orderBy('a.createdAt', 'DESC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit);
        $qb->setMaxResults($dto->limit);

        $data = $qb->getQuery()->getResult();

        return [
            'data' => $data,
            'total' => $total,
        ];
    }
}
