<?php

namespace App\Enums;

enum IdentityResult: string
{
    case Pending = 'pending';
    case Verified = 'verified';
    case Retry = 'retry';
    case ManualReview = 'manual_review';
}
