<?php

namespace App\Models;

use App\Enums\MatchOutcome;
use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $match_run_id
 * @property int $lender_id
 * @property int|null $lender_product_id
 * @property int|null $policy_version_id
 * @property MatchOutcome $outcome
 * @property list<array{id: string, label: string, clause: string, field: string, op: string, outcome: string, actual: mixed, required: mixed}> $rule_results
 * @property array<string, mixed>|null $serviceability
 * @property float|null $approval_confidence
 * @property float|null $score
 * @property int|null $rank
 * @property string|null $intent
 * @property float|null $rate_min
 * @property float|null $rate_max
 * @property Carbon|null $rate_effective_from
 * @property array{establishment: int, annual: int}|null $fees
 * @property string|null $explanation
 * @property-read MatchRun $run
 * @property-read Lender $lender
 * @property-read LenderProduct|null $product
 * @property-read PolicyVersion|null $policyVersion
 */
#[Fillable(['match_run_id', 'lender_id', 'lender_product_id', 'policy_version_id', 'outcome', 'rule_results', 'serviceability', 'approval_confidence', 'score', 'rank', 'intent', 'rate_min', 'rate_max', 'rate_effective_from', 'fees', 'explanation'])]
class MatchResult extends Model
{
    protected function casts(): array
    {
        return [
            'outcome' => MatchOutcome::class,
            'rule_results' => 'array',
            'serviceability' => 'array',
            'approval_confidence' => 'float',
            'score' => 'float',
            'rate_min' => 'float',
            'rate_max' => 'float',
            'rate_effective_from' => 'date',
            'fees' => 'array',
        ];
    }

    /**
     * @return BelongsTo<MatchRun, $this>
     */
    public function run(): BelongsTo
    {
        return $this->belongsTo(MatchRun::class, 'match_run_id');
    }

    /**
     * @return BelongsTo<Lender, $this>
     */
    public function lender(): BelongsTo
    {
        return $this->belongsTo(Lender::class);
    }

    /**
     * @return BelongsTo<LenderProduct, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(LenderProduct::class, 'lender_product_id');
    }

    /**
     * @return BelongsTo<PolicyVersion, $this>
     */
    public function policyVersion(): BelongsTo
    {
        return $this->belongsTo(PolicyVersion::class);
    }
}
