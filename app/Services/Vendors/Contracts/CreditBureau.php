<?php

namespace App\Services\Vendors\Contracts;

use App\Models\Application;

interface CreditBureau
{
    public function name(): string;

    /**
     * Soft enquiry. Returns the score and a summary of listed liabilities and file flags.
     *
     * @return array{score: int, summary: array{enquiries_6m: int, defaults: int, credit_card_limits: int, flags: list<string>}}
     */
    public function softCheck(Application $application): array;
}
