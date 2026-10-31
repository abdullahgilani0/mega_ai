<?php

namespace App\Enums;

enum LoanPack: string
{
    case Home = 'home';
    case Asset = 'asset';
    case Personal = 'personal';
    case Business = 'business';

    public function label(): string
    {
        return match ($this) {
            self::Home => 'Home loan',
            self::Asset => 'Car & asset finance',
            self::Personal => 'Personal loan',
            self::Business => 'Business loan',
        };
    }

    /**
     * Canonical fields the matching engine needs before it can assess this pack.
     *
     * @return list<string>
     */
    public function requiredFields(): array
    {
        $common = ['income_annual', 'expenses_monthly', 'liabilities_monthly', 'dependants', 'employment_months'];

        return match ($this) {
            self::Home => [...$common, 'property_value'],
            self::Asset => [...$common, 'asset_price', 'asset_age_years'],
            self::Personal => $common,
            self::Business => [...$common, 'time_in_business_months', 'annual_turnover'],
        };
    }

    public function defaultTermYears(): int
    {
        return match ($this) {
            self::Home => 30,
            self::Asset, self::Personal => 5,
            self::Business => 7,
        };
    }

    /**
     * Assessment-rate buffer added to the indicative rate, in percentage points.
     */
    public function serviceabilityBuffer(): float
    {
        return $this === self::Home ? 3.0 : 2.0;
    }
}
