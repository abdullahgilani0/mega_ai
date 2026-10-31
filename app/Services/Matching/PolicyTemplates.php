<?php

namespace App\Services\Matching;

use App\Enums\LoanPack;

/**
 * Conservative starting rules for a new lender's draft policy. An analyst edits the
 * values and citations from the lender's documents before anyone approves it.
 */
class PolicyTemplates
{
    /**
     * @return list<array{id: string, label: string, field: string, op: string, value: mixed, clause: string}>
     */
    public static function for(LoanPack $pack): array
    {
        $rule = fn (string $id, string $label, string $field, string $op, mixed $value) => [
            'id' => $id,
            'label' => $label,
            'field' => $field,
            'op' => $op,
            'value' => $value,
            'clause' => 'Cite the clause from the lender’s policy document',
        ];

        return match ($pack) {
            LoanPack::Home => [
                $rule('LVR-1', 'Maximum LVR', 'lvr', 'lte', 80),
                $rule('CRD-1', 'Minimum credit score', 'credit_score', 'gte', 650),
                $rule('EMP-1', 'Accepted employment', 'employment_type', 'in', ['payg', 'self_employed']),
                $rule('EMP-2', 'Time in current role', 'employment_months', 'gte', 6),
                $rule('LOAN-1', 'Maximum loan size', 'amount', 'lte', 2000000),
            ],
            LoanPack::Asset => [
                $rule('LVR-1', 'Maximum loan-to-value', 'lvr', 'lte', 100),
                $rule('AST-1', 'Maximum asset age', 'asset_age_years', 'lte', 10),
                $rule('CRD-1', 'Minimum credit score', 'credit_score', 'gte', 600),
                $rule('LOAN-1', 'Maximum loan size', 'amount', 'lte', 150000),
            ],
            LoanPack::Personal => [
                $rule('CRD-1', 'Minimum credit score', 'credit_score', 'gte', 650),
                $rule('INC-1', 'Minimum income', 'income_annual', 'gte', 35000),
                $rule('LOAN-1', 'Maximum loan size', 'amount', 'lte', 50000),
            ],
            LoanPack::Business => [
                $rule('BUS-1', 'Time trading', 'time_in_business_months', 'gte', 24),
                $rule('BUS-2', 'Minimum turnover', 'annual_turnover', 'gte', 250000),
                $rule('CRD-1', 'Minimum credit score', 'credit_score', 'gte', 600),
                $rule('LOAN-1', 'Maximum loan size', 'amount', 'lte', 500000),
            ],
        };
    }
}
