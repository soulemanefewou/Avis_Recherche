<?php

namespace App\Entity;

use App\Repository\AvisOfficielRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AvisOfficielRepository::class)]
class AvisOfficiel extends AvisRecherche
{
    #[ORM\ManyToOne(inversedBy: 'avisOfficiels')]
    private ?Commissariat $commissariat = null;

    public function getCommissariat(): ?Commissariat
    {
        return $this->commissariat;
    }

    public function setCommissariat(?Commissariat $commissariat): static
    {
        $this->commissariat = $commissariat;
        return $this;
    }
}
