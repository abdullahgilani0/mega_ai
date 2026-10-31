<?php

namespace App\Enums;

enum GapStatus: string
{
    case Open = 'open';
    case Resolved = 'resolved';
    case Escalated = 'escalated';
}
