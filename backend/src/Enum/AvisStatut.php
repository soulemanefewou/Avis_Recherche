<?php

namespace App\Enum;

enum AvisStatut: string
{
    case BROUILLON = 'BROUILLON';
    case RECHERCHE = 'RECHERCHE';
    case RETROUVE_VIVANT = 'RETROUVE_VIVANT';
    case RETROUVE_DECEDE = 'RETROUVE_DECEDE';
    case RECHERCHE_CLOTUREE = 'RECHERCHE_CLOTUREE';
    case EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION';
    case RETROUVE_EN_ATTENTE_CONFIRMATION = 'RETROUVE_EN_ATTENTE_CONFIRMATION';
    case REJETE = 'REJETE';

    public function label(): string
    {
        return match ($this) {
            self::BROUILLON => 'Brouillon',
            self::RECHERCHE => 'Recherché',
            self::RETROUVE_VIVANT => 'Retrouvé vivant',
            self::RETROUVE_DECEDE => 'Retrouvé décédé',
            self::RECHERCHE_CLOTUREE => 'Recherche clôturée',
            self::EN_ATTENTE_VALIDATION => 'En attente de validation',
            self::RETROUVE_EN_ATTENTE_CONFIRMATION => 'Retrouvé — en attente de confirmation',
            self::REJETE => 'Rejeté',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::BROUILLON => 'slate',
            self::RECHERCHE => 'red',
            self::RETROUVE_VIVANT => 'green',
            self::RETROUVE_DECEDE => 'gray',
            self::RECHERCHE_CLOTUREE => 'slate',
            self::EN_ATTENTE_VALIDATION => 'yellow',
            self::RETROUVE_EN_ATTENTE_CONFIRMATION => 'orange',
            self::REJETE => 'red',
        };
    }
}
