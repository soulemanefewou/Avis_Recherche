<?php

namespace App\Enum;

enum SignalementStatut: string
{
    case EN_ATTENTE = 'EN_ATTENTE';
    case PUBLIE = 'PUBLIE';
    case MASQUE = 'MASQUE';
}
