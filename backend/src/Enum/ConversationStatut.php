<?php

namespace App\Enum;

enum ConversationStatut: string
{
    case ACTIVE = 'ACTIVE';
    case LECTURE_SEULE = 'LECTURE_SEULE';
    case ARCHIVEE = 'ARCHIVEE';
}
