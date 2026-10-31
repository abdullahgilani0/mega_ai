<?php

namespace App\Enums;

enum LenderCoverage: string
{
    case Full = 'full';
    case Partial = 'partial';
    case Unmapped = 'unmapped';
}
