<?php

namespace App\Enums;

enum AllocationStatus: string
{
    case Offered = 'offered';
    case Accepted = 'accepted';
    case Declined = 'declined';
    case Expired = 'expired';
    case Reassigned = 'reassigned';
}
