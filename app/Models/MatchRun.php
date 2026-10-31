<?php

namespace App\Models;

use App\Enums\MatchOutcome;
use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * An immutable, reproducible evaluation of one scenario against every lender policy.
 *
 * @property int $id
 * @property int $application_id
 * @property string $scenario_hash
 * @property array<string, mixed> $scenario
 * @property array<int, int> $policy_versions
 * @property int $lenders_total
 * @property int $lenders_passed
 * @property Carbon $started_at
 * @property Carbon|null $completed_at
 * @property-read Application $application
 */
#[Fillable(['application_id', 'scenario_hash', 'scenario', 'policy_versions', 'lenders_total', 'lenders_passed', 'started_at', 'completed_at'])]
class MatchRun extends Model
{
    protected function casts(): array
    {
        return [
            'scenario' => 'array',
            'policy_versions' => 'array',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Application, $this>
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    /**
     * @return HasMany<MatchResult, $this>
     */
    public function results(): HasMany
    {
        return $this->hasMany(MatchResult::class);
    }

    /**
     * @return HasMany<MatchResult, $this>
     */
    public function shortlist(): HasMany
    {
        return $this->hasMany(MatchResult::class)
            ->where('outcome', MatchOutcome::Pass)
            ->whereNotNull('rank')
            ->orderBy('rank');
    }
}
