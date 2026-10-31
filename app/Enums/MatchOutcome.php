<?php

namespace App\Enums;

enum MatchOutcome: string
{
    case Pass = 'pass';
    case Fail = 'fail';
    case Unsure = 'unsure';
}
