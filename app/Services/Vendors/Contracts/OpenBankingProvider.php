<?php

namespace App\Services\Vendors\Contracts;

use App\Models\Application;

interface OpenBankingProvider
{
    public function name(): string;

    /**
     * Derived figures from consented Consumer Data Right account data.
     *
     * @return array{institution: string, income_annual: int, expenses_monthly: int, liabilities_monthly: int, savings_balance: int, months_analysed: int}
     */
    public function fetchFinancials(Application $application): array;
}
