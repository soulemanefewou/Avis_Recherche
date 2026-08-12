<?php

namespace App\Enum;

enum MessageType: string
{
    case SYSTEM = 'SYSTEM';
    case USER = 'USER';
}