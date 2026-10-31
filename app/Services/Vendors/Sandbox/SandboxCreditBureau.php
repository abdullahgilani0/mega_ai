<?php

namespace App\Services\Vendors\Sandbox;

use App\Models\Application;
use App\Services\Vendors\Contracts\CreditBureau;

/**
 * Deterministic test bureau: the same borrower always gets the same file.
 */
class SandboxCreditBureau implements CreditBureau
{
    public function name(): string
    {
        return 'sandbox-bureau';
    }

    public function softCheck(Application $application): array
    {
        $seed = crc32('bureau-'.$application->user_id);

        return [
            'score' => 640 + ($seed % 220),
            'summary' => [
                'enquiries_6m' => $seed % 3,
                'defaults' => 0,
                'credit_card_limits' => [0, 5000, 8000, 12000][$seed % 4],
                'flags' => [],
            ],
        ];
    }
}
