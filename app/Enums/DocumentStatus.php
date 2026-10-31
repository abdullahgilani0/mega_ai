<?php

namespace App\Enums;

enum DocumentStatus: string
{
    case Queued = 'queued';
    case Reading = 'reading';
    case Verified = 'verified';
    case InReview = 'in_review';
    case NeedsAttention = 'needs_attention';
}
