<?php

namespace App\Services\Matching;

use App\Enums\MatchOutcome;
use App\Models\GoldenScenario;
use App\Models\PolicyVersion;

/**
 * Runs labelled scenarios against a policy version's rules. A policy change may only
 * publish when every expectation for that lender still holds.
 */
class GoldenScenarioRunner
{
    public function __construct(private RuleEvaluator $rules) {}

    /**
     * @return list<array{scenario: string, expected: string, actual: string, failedRules: list<string>}>
     */
    public function failures(PolicyVersion $policy): array
    {
        $failures = [];

        $scenarios = GoldenScenario::where('loan_pack', $policy->loan_pack)->get()
            ->filter(fn (GoldenScenario $scenario) => isset($scenario->expectations[(string) $policy->lender_id]));

        foreach ($scenarios as $scenario) {
            $expected = $scenario->expectations[(string) $policy->lender_id];
            [$actual, $failedRules] = $this->outcome($policy, $scenario->scenario);

            if ($actual !== $expected) {
                $failures[] = ['scenario' => $scenario->name, 'expected' => $expected, 'actual' => $actual, 'failedRules' => $failedRules];
            }
        }

        return $failures;
    }

    /**
     * Policy-rule outcome for one scenario (serviceability is excluded: it depends on pricing).
     *
     * @param  array<string, mixed>  $scenario
     * @return array{0: string, 1: list<string>}
     */
    public function outcome(PolicyVersion $policy, array $scenario): array
    {
        $security = $scenario['property_value'] ?? $scenario['asset_price'] ?? null;
        $scenario['lvr'] = $security ? round((float) $scenario['amount'] / (float) $security * 100, 2) : null;

        $results = array_map(fn (array $rule) => $this->rules->evaluate($rule, $scenario), $policy->rules);
        $outcomes = array_column($results, 'outcome');

        $outcome = match (true) {
            in_array('fail', $outcomes, true) => MatchOutcome::Fail,
            in_array('unsure', $outcomes, true) => MatchOutcome::Unsure,
            default => MatchOutcome::Pass,
        };

        $failed = array_values(array_map(
            fn (array $result) => $result['id'],
            array_filter($results, fn (array $result) => $result['outcome'] !== 'pass'),
        ));

        return [$outcome->value, $failed];
    }
}
