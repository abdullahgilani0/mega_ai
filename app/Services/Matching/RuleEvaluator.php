<?php

namespace App\Services\Matching;

use App\Enums\MatchOutcome;
use InvalidArgumentException;

/**
 * Deterministic evaluation of one compiled policy rule. A missing borrower fact
 * is never treated as a pass: it is "unsure" and becomes a question.
 */
class RuleEvaluator
{
    /**
     * @param  array{id: string, label: string, field: string, op: string, value: mixed, clause: string}  $rule
     * @param  array<string, mixed>  $scenario
     * @return array{id: string, label: string, clause: string, field: string, outcome: string, actual: mixed, required: mixed, op: string}
     */
    public function evaluate(array $rule, array $scenario): array
    {
        $actual = $scenario[$rule['field']] ?? null;

        $outcome = $actual === null
            ? MatchOutcome::Unsure
            : ($this->passes($rule['op'], $actual, $rule['value']) ? MatchOutcome::Pass : MatchOutcome::Fail);

        return [
            'id' => $rule['id'],
            'label' => $rule['label'],
            'clause' => $rule['clause'],
            'field' => $rule['field'],
            'op' => $rule['op'],
            'outcome' => $outcome->value,
            'actual' => $actual,
            'required' => $rule['value'],
        ];
    }

    private function passes(string $op, mixed $actual, mixed $required): bool
    {
        return match ($op) {
            'lte' => $actual <= $required,
            'gte' => $actual >= $required,
            'eq' => $actual == $required,
            'in' => in_array($actual, (array) $required, true),
            'not_in' => ! in_array($actual, (array) $required, true),
            default => throw new InvalidArgumentException("Unknown rule operator [{$op}]."),
        };
    }
}
