<?php

namespace App\Mapper;

use App\Entity\AvisRecherche;
use App\Entity\Photo;

class AvisRechercheMapper
{

    public function __construct(
        private PhotoMapper $photoMapper
    ) {
    }

    public function toArray(AvisRecherche $avis): array
    {
        $data = [
            'id' => $avis->getId(),
            'nom' => $avis->getNom(),
            'prenom' => $avis->getPrenom(),
            'sexe' => $avis->getSexe()->value,
            'ageApprox' => $avis->getAgeApprox(),
            'description' => $avis->getDescription(),
            'tenueVestimentaire' => $avis->getTenueVestimentaire(),
            'signesParticuliers' => $avis->getSignesParticuliers(),
            'taille' => $avis->getTaille(),
            'poids' => $avis->getPoids(),
            'telephone' => $avis->getTelephone(),
            'dernierLieuVu' => $avis->getDernierLieuVu(),
            'dateDisparition' => $avis->getDateDisparition()->format('Y-m-d\TH:i:s'),
            'statut' => $avis->getStatut()->value,
            'type' => $avis->getType()->value,
            'actif' => $avis->isActif(),
            'circonstances' => $avis->getCirconstances(),
            'createdAt' => $avis->getCreatedAt()->format('Y-m-d\TH:i:s'),
            'updatedAt' => $avis->getUpdatedAt()->format('Y-m-d\TH:i:s'),
            'region' => [
                'id' => $avis->getRegion()->getId(),
                'nom' => $avis->getRegion()->getNom(),
            ],
            'ville' => [
                'id' => $avis->getVille()->getId(),
                'nom' => $avis->getVille()->getNom(),
            ],
            'photos' => array_map(
                fn(Photo $photo) => $this->photoMapper->toArray($photo),
                $avis->getPhotos()->toArray()
            ),
        ];

        if ($avis instanceof \App\Entity\AvisCitoyen) {
            $data['validationStatut'] = $avis->getValidationStatut()?->value;
            $data['dateValidation'] = $avis->getDateValidation()?->format('Y-m-d\TH:i:s');
            $data['motifRejet'] = $avis->getMotifRejet();
            $auteur = $avis->getAuteur();
            if ($auteur) {
                $data['auteur'] = [
                    'id' => $auteur->getId(),
                    'nom' => $auteur->getNom(),
                    'prenom' => $auteur->getPrenom(),
                    'email' => $auteur->getEmail(),
                    'roles' => $auteur->getRoles(),
                ];
            }
        }

        return $data;
    }

    public function collection(array $avisRecherches): array
    {
        $resultat = [];

        foreach ($avisRecherches as $avisRecherche) {
            $resultat[] = $this->toArray($avisRecherche);
        }

        return $resultat;
    }
}