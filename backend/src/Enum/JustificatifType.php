<?php

namespace App\Enum;

enum JustificatifType: string
{
    case CARTE_IDENTITE = 'CARTE_IDENTITE';
    case PHOTO_AVEC_DISPARU = 'PHOTO_AVEC_DISPARU';
    case ACTE_NAISSANCE = 'ACTE_NAISSANCE';
    case DOCUMENT_COMMISSARIAT = 'DOCUMENT_COMMISSARIAT';
}
