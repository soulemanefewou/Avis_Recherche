<?php

namespace App\Service;

use App\DTO\CreateAvisOfficielDTO;
use App\DTO\CreateAvisRechercheDTO;
use App\DTO\DeclareRetrouveDTO;
use App\DTO\SearchAvisRechercheDTO;
use App\DTO\UpdateAvisRechercheDTO;
use App\DTO\ValidateAvisCitoyenDTO;
use App\Entity\AvisCitoyen;
use App\Entity\AvisOfficiel;
use App\Entity\AvisRecherche;
use App\Entity\Commissariat;
use App\Entity\Region;
use App\Entity\Utilisateur;
use App\Entity\Ville;
use App\Enum\AvisStatut;
use App\Enum\ValidationStatut;
use App\Exception\AvisRechercheNotFoundException;
use App\Repository\AvisRechercheRepository;
use App\Repository\RegionRepository;
use App\Repository\VilleRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class AvisRechercheService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ValidatorInterface $validator,
        private readonly AvisRechercheRepository $avisRechercheRepository,
        private readonly RegionRepository $regionRepository,
        private readonly VilleRepository $villeRepository,
        private readonly NotificationService $notificationService,
    ) {
    }

    public function createAvisCitoyen(CreateAvisRechercheDTO $dto, Utilisateur $utilisateur): AvisCitoyen
    {
        $avis = new AvisCitoyen();

        $this->hydrateAvis($avis, $dto);

        $isSuperAdmin = in_array('ROLE_SUPER_ADMIN', $utilisateur->getRoles(), true);
        $avis->setStatut($isSuperAdmin ? AvisStatut::RECHERCHE : AvisStatut::EN_ATTENTE_VALIDATION);
        $avis->setValidationStatut($isSuperAdmin ? ValidationStatut::VALIDE : ValidationStatut::EN_ATTENTE);
        if ($isSuperAdmin) {
            $avis->setDateValidation(new \DateTimeImmutable());
        }
        $avis->setAuteur($utilisateur);
        $avis->setActif(true);

        $now = new \DateTimeImmutable();
        $avis->setCreatedAt($now);
        $avis->setUpdatedAt($now);

        $this->validate($avis);

        $this->entityManager->persist($avis);
        $this->entityManager->flush();

        if ($isSuperAdmin) {
            $this->notificationService->notifyNouvelAvisRegion($avis, $utilisateur);
        } else {
            $this->notificationService->notifyAvisCitoyenEnAttente($utilisateur, $avis);
            $this->notificationService->notifyAvisCitoyenAValider($utilisateur, $avis);
        }

        return $avis;
    }

    public function createAvisOfficiel(CreateAvisOfficielDTO $dto, Commissariat $commissariat): AvisOfficiel
    {
        $avis = new AvisOfficiel();

        $this->hydrateAvis($avis, $dto);

        $avis->setStatut(AvisStatut::RECHERCHE);
        $avis->setCommissariat($commissariat);
        $avis->setActif(true);

        $now = new \DateTimeImmutable();
        $avis->setCreatedAt($now);
        $avis->setUpdatedAt($now);

        $this->validate($avis);

        $this->entityManager->persist($avis);
        $this->entityManager->flush();

        $this->notificationService->notifyNouvelAvisRegion(
            $avis,
            $commissariat->getUtilisateur()
        );

        return $avis;
    }

    public function findAll(SearchAvisRechercheDTO $dto): array
    {
        return $this->avisRechercheRepository->search($dto);
    }

    public function findById(int $id): AvisRecherche
    {
        $avis = $this->avisRechercheRepository->find($id);

        if ($avis === null) {
            throw new AvisRechercheNotFoundException();
        }

        return $avis;
    }

    public function update(int $id, UpdateAvisRechercheDTO $dto, Utilisateur $utilisateur): AvisRecherche
    {
        $avis = $this->findById($id);

        if ($dto->nom !== null) {
            $avis->setNom($dto->nom);
        }
        if ($dto->prenom !== null) {
            $avis->setPrenom($dto->prenom);
        }
        if ($dto->sexe !== null) {
            $avis->setSexe($dto->sexe);
        }
        if ($dto->ageApprox !== null) {
            $avis->setAgeApprox($dto->ageApprox);
        }
        if ($dto->description !== null) {
            $avis->setDescription($dto->description);
        }
        if ($dto->dernierLieuVu !== null) {
            $avis->setDernierLieuVu($dto->dernierLieuVu);
        }
        if ($dto->tenueVestimentaire !== null) {
            $avis->setTenueVestimentaire($dto->tenueVestimentaire);
        }
        if ($dto->signesParticuliers !== null) {
            $avis->setSignesParticuliers($dto->signesParticuliers);
        }
        if ($dto->taille !== null) {
            $avis->setTaille($dto->taille);
        }
        if ($dto->poids !== null) {
            $avis->setPoids($dto->poids);
        }
        if ($dto->telephone !== null) {
            $avis->setTelephone($dto->telephone);
        }
        if ($dto->circonstances !== null) {
            $avis->setCirconstances($dto->circonstances);
        }
        if ($dto->dateDisparition !== null) {
            $avis->setDateDisparition(new \DateTimeImmutable($dto->dateDisparition));
        }
        if ($dto->region !== null) {
            $avis->setRegion($this->findRegion($dto->region));
        }
        if ($dto->ville !== null) {
            $avis->setVille($this->findVille($dto->ville));
        }

        $avis->setUpdatedAt(new \DateTimeImmutable());

        $this->entityManager->flush();

        return $avis;
    }

    public function validateAvisCitoyen(int $id, ValidateAvisCitoyenDTO $dto): AvisCitoyen
    {
        $avis = $this->findById($id);

        if (!$avis instanceof AvisCitoyen) {
            throw new \InvalidArgumentException("Cet avis n'est pas un avis citoyen.");
        }

        if ($dto->valide) {
            $avis->setValidationStatut(ValidationStatut::VALIDE);
            $avis->setDateValidation(new \DateTimeImmutable());
            $avis->setStatut(AvisStatut::RECHERCHE);

            foreach ($avis->getPiecesJustificatives() as $piece) {
                $this->entityManager->remove($piece);
            }
            $avis->getPiecesJustificatives()->clear();
        } else {
            $avis->setValidationStatut(ValidationStatut::REJETE);
            $avis->setStatut(AvisStatut::REJETE);
            $avis->setMotifRejet($dto->motifRejet);
        }

        $avis->setUpdatedAt(new \DateTimeImmutable());

        $this->entityManager->flush();

        $auteur = $avis->getAuteur();
        if ($auteur !== null) {
            if ($dto->valide) {
                $this->notificationService->notifyAvisCitoyenPublie($auteur, $avis);
                $this->notificationService->notifyNouvelAvisRegion($avis, $auteur);
            } else {
                $this->notificationService->notifyAvisCitoyenRejete($auteur, $avis, $dto->motifRejet);
            }
        }

        return $avis;
    }

    public function declareRetrouve(int $id, DeclareRetrouveDTO $dto, Utilisateur $utilisateur): AvisRecherche
    {
        $avis = $this->findById($id);

        if ($avis instanceof AvisCitoyen) {
            $avis->setStatut(AvisStatut::RETROUVE_EN_ATTENTE_CONFIRMATION);
        } else {
            $avis->setStatut($dto->statut);
        }

        if ($dto->description !== null) {
            $avis->setDescription($dto->description);
        }

        $avis->setUpdatedAt(new \DateTimeImmutable());

        $this->entityManager->flush();

        if ($avis instanceof AvisCitoyen && $avis->getAuteur() !== null) {
            $this->notificationService->notifyConfirmationRequise($avis->getAuteur(), $avis);
        }

        return $avis;
    }

    public function archive(int $id): AvisRecherche
    {
        $avis = $this->findById($id);

        $avis->setStatut(AvisStatut::RECHERCHE_CLOTUREE);
        $avis->setActif(false);
        $avis->setUpdatedAt(new \DateTimeImmutable());

        $this->entityManager->flush();

        return $avis;
    }

    public function getMyAvis(Utilisateur $utilisateur): array
    {
        $em = $this->entityManager;

        $citizenAvis = $em->createQueryBuilder()
            ->select('a')
            ->from(AvisCitoyen::class, 'a')
            ->where('a.auteur = :user')
            ->setParameter('user', $utilisateur)
            ->getQuery()
            ->getResult();

        $officialAvis = [];
        if ($utilisateur->getCommissariat() !== null) {
            $officialAvis = $em->createQueryBuilder()
                ->select('a')
                ->from(AvisOfficiel::class, 'a')
                ->where('a.commissariat = :commissariat')
                ->setParameter('commissariat', $utilisateur->getCommissariat())
                ->getQuery()
                ->getResult();
        }

        return array_merge($citizenAvis, $officialAvis);
    }

    public function findRegion(int $id): Region
    {
        $region = $this->regionRepository->find($id);

        if (!$region) {
            throw new \InvalidArgumentException('Région introuvable.');
        }

        return $region;
    }

    public function findVille(int $id): Ville
    {
        $ville = $this->villeRepository->find($id);

        if (!$ville) {
            throw new \InvalidArgumentException('Ville introuvable.');
        }

        return $ville;
    }

    public function hydrateAvis(AvisRecherche $avis, CreateAvisRechercheDTO $dto): void
    {
        $avis->setNom($dto->nom);
        $avis->setPrenom($dto->prenom);
        $avis->setSexe($dto->sexe);
        $avis->setAgeApprox($dto->ageApprox);
        $avis->setDescription($dto->description);
        $avis->setTenueVestimentaire($dto->tenueVestimentaire);
        $avis->setSignesParticuliers($dto->signesParticuliers);
        $avis->setTaille($dto->taille);
        $avis->setPoids($dto->poids);
        $avis->setDernierLieuVu($dto->dernierLieuVu);
        $avis->setTelephone($dto->telephone);
        $avis->setCirconstances($dto->circonstances);
        $avis->setDateDisparition(new \DateTimeImmutable($dto->dateDisparition));
        $avis->setRegion($this->findRegion($dto->region));
        if ($dto->ville === null) {
            throw new \InvalidArgumentException('La ville est obligatoire.');
        }
        $avis->setVille($this->findVille($dto->ville));
    }

    private function validate(AvisRecherche $avis): void
    {
        $errors = $this->validator->validate($avis);

        if (count($errors) > 0) {
            $messages = [];
            foreach ($errors as $error) {
                $messages[] = $error->getMessage();
            }
            throw new \Exception(json_encode($messages));
        }
    }
}
