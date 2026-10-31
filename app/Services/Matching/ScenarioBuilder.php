<?php

namespace App\Services\Matching;

use App\Models\Application;

/**
 * Normalises an application into the immutable scenario every lender is evaluated against.
 */
class ScenarioBuilder
{
    private const NUMERIC_FACTS = [
        'income_annual', 'expenses_monthly', 'liabilities_monthly', 'dependants', 'employment_months',
        'credit_score', 'credit_card_limits', 'property_value', 'asset_price', 'asset_age_years',
        'time_in_business_months', 'annual_turnover',
    ];

    /**
     * @return array<string, mixed>
     */
    public function build(Application $application): array
    {
        $scenario = [
            'loan_pack' => $application->loan_pack->value,
            'amount' => $application->amount,
            'term_years' => $application->term_years,
            'purpose' => $application->purpose,
            'state' => $application->state,
            'postcode' => $application->postcode,
            'employment_type' => $application->employment_type,
            'is_joint' => $application->is_joint,
        ];

        foreach (self::NUMERIC_FACTS as $field) {
            $value = $application->fact($field);
            $scenario[$field] = $value === null ? null : (float) $value;
        }

        $security = $scenario['property_value'] ?? $scenario['asset_price'];
        $scenario['lvr'] = $security ? round($application->amount / $security * 100, 2) : null;

        $scenario['advisor_flags'] = $application->advisorNotes()
            ->whereNotNull('confirmed_at')
            ->whereNull('field')
            ->orderBy('id')
            ->pluck('fact')
            ->all();

        ksort($scenario);

        return $scenario;
    }

    /**
     * @param  array<string, mixed>  $scenario
     */
    public function hash(array $scenario): string
    {
        return hash('sha256', json_encode($scenario, JSON_THROW_ON_ERROR));
    }
}
