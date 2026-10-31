<?php

namespace App\Enums;

enum ApplicationStatus: string
{
    case InProgress = 'in_progress';
    case Allocating = 'allocating';
    case Unallocated = 'unallocated';
    case Allocated = 'allocated';
    case SubmittedToLender = 'submitted_to_lender';
    case ConditionallyApproved = 'conditionally_approved';
    case Approved = 'approved';
    case Declined = 'declined';
    case Settled = 'settled';
    case Withdrawn = 'withdrawn';

    public function label(): string
    {
        return match ($this) {
            self::InProgress => 'In progress',
            self::Allocating => 'Finding your broker',
            self::Unallocated => 'Awaiting broker assignment',
            self::Allocated => 'With your broker',
            self::SubmittedToLender => 'Submitted to lender',
            self::ConditionallyApproved => 'Conditionally approved',
            self::Approved => 'Approved by lender',
            self::Declined => 'Declined by lender',
            self::Settled => 'Settled',
            self::Withdrawn => 'Withdrawn',
        };
    }

    /**
     * Statuses a broker may move an allocated application into.
     *
     * @return list<self>
     */
    public static function brokerUpdatable(): array
    {
        return [
            self::Allocated,
            self::SubmittedToLender,
            self::ConditionallyApproved,
            self::Approved,
            self::Declined,
            self::Settled,
        ];
    }
}
