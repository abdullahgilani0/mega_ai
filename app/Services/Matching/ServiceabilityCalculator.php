<?php

namespace App\Services\Matching;

/**
 * Per-lender serviceability: net income after tax and shading, expenses at the higher
 * of declared and benchmark, liabilities including card limits, repayments at the
 * assessment rate (indicative rate plus buffer).
 */
class ServiceabilityCalculator
{
    /** Monthly repayment assumed per dollar of credit card limit. */
    private const CARD_LIMIT_FACTOR = 0.038;

    /**
     * @param  array<string, mixed>  $scenario
     * @return array{net_monthly_income: int, expenses_declared: int, expenses_benchmark: int, expenses_used: int, liabilities_used: int, assessment_rate: float, repayment: int, surplus: int, max_borrowing: int, headroom_ratio: float}|null
     */
    public function assess(array $scenario, float $rate, float $buffer, float $incomeShading = 1.0): ?array
    {
        foreach (['income_annual', 'expenses_monthly', 'liabilities_monthly', 'dependants'] as $required) {
            if ($scenario[$required] === null) {
                return null;
            }
        }

        $netMonthly = $this->netAnnualIncome($scenario['income_annual'] * $incomeShading) / 12;
        $benchmark = $this->expenseBenchmark((int) $scenario['dependants'], (bool) $scenario['is_joint']);
        $expenses = max($scenario['expenses_monthly'], $benchmark);
        $liabilities = $scenario['liabilities_monthly'] + ($scenario['credit_card_limits'] ?? 0) * self::CARD_LIMIT_FACTOR;
        $assessmentRate = round($rate + $buffer, 2);
        $months = $scenario['term_years'] * 12;

        $repayment = $this->monthlyRepayment($scenario['amount'], $assessmentRate, $months);
        $available = $netMonthly - $expenses - $liabilities;
        $surplus = $available - $repayment;

        return [
            'net_monthly_income' => (int) round($netMonthly),
            'expenses_declared' => (int) round($scenario['expenses_monthly']),
            'expenses_benchmark' => $benchmark,
            'expenses_used' => (int) round($expenses),
            'liabilities_used' => (int) round($liabilities),
            'assessment_rate' => $assessmentRate,
            'repayment' => (int) round($repayment),
            'surplus' => (int) round($surplus),
            'max_borrowing' => (int) max(0, round($this->presentValue($available, $assessmentRate, $months), -3)),
            'headroom_ratio' => $netMonthly > 0 ? round($surplus / $netMonthly, 4) : -1.0,
        ];
    }

    public function monthlyRepayment(float $principal, float $annualRate, int $months): float
    {
        $r = $annualRate / 100 / 12;

        return $r === 0.0 ? $principal / $months : $principal * $r / (1 - (1 + $r) ** -$months);
    }

    /**
     * Australian resident income tax (2024-25 rates) plus the 2% Medicare levy.
     */
    public function netAnnualIncome(float $gross): float
    {
        $tax = match (true) {
            $gross <= 18200 => 0,
            $gross <= 45000 => ($gross - 18200) * 0.16,
            $gross <= 135000 => 4288 + ($gross - 45000) * 0.30,
            $gross <= 190000 => 31288 + ($gross - 135000) * 0.37,
            default => 51638 + ($gross - 190000) * 0.45,
        };

        $medicare = $gross > 27222 ? $gross * 0.02 : 0;

        return $gross - $tax - $medicare;
    }

    /**
     * Illustrative household expenditure floor; replace with licensed HEM tables.
     */
    public function expenseBenchmark(int $dependants, bool $isJoint): int
    {
        return 1700 + ($isJoint ? 1000 : 0) + $dependants * 500;
    }

    private function presentValue(float $payment, float $annualRate, int $months): float
    {
        if ($payment <= 0) {
            return 0;
        }

        $r = $annualRate / 100 / 12;

        return $payment * (1 - (1 + $r) ** -$months) / $r;
    }
}
