<?php

namespace App\Services\Vendors\Sandbox;

use App\Models\Application;
use App\Services\Vendors\Contracts\OpenBankingProvider;

/**
 * Stand-in for a CDR-accredited provider, returning a fixed sandbox customer
 * profile per borrower so the full journey can be exercised locally.
 */
class SandboxOpenBanking implements OpenBankingProvider
{
    public function name(): string
    {
        return 'sandbox-cdr';
    }

    public function fetchFinancials(Application $application): array
    {
        $seed = crc32('cdr-'.$application->user_id);

        $income = 95000 + ($seed % 9) * 10000;

        return [
            'institution' => 'Sandbox Bank (test data)',
            'income_annual' => $income,
            'expenses_monthly' => 2600 + ($seed % 7) * 150,
            'liabilities_monthly' => [0, 220, 410, 650][$seed % 4],
            'savings_balance' => 25000 + ($seed % 11) * 9000,
            'months_analysed' => 6,
        ];
    }
}
