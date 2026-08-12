<?php

namespace App\Enum;

enum ValidationStatut: string
{
    case EN_ATTENTE = 'EN_ATTENTE';
    case VALIDE = 'VALIDE';
    case REJETE = 'REJETE';
}
