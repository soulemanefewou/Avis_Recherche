<?php

namespace App\Enum;

enum ConversationType: string
{
    case PROCHE_TEMOIN = 'PROCHE_TEMOIN';
    case ADMIN_AUTEUR = 'ADMIN_AUTEUR';
    case COMMISSARIAT_TEMOIN = 'COMMISSARIAT_TEMOIN';
}
