<?php

namespace App\Models;

use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $lender_product_id
 * @property list<array{max_lvr: float, rate_min: float, rate_max: float}> $rows
 * @property array{establishment: int, annual: int} $fees
 * @property Carbon $effective_from
 * @property Carbon|null $expires_at
 */
#[Fillable(['lender_product_id', 'rows', 'fees', 'effective_from', 'expires_at'])]
class RateSheet extends Model
{
    protected function casts(): array
    {
        return [
            'rows' => 'array',
            'fees' => 'array',
            'effective_from' => 'date',
            'expires_at' => 'date',
        ];
    }

    /**
     * @return BelongsTo<LenderProduct, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(LenderProduct::class, 'lender_product_id');
    }

    public function isStale(): bool
    {
        return ($this->expires_at !== null && $this->expires_at->isPast())
            || $this->effective_from->diffInDays(now()) > config('mega.matching.max_rate_age_days');
    }

    /**
     * The rate band covering the given LVR; the highest band when LVR is not applicable.
     *
     * @return array{max_lvr: float, rate_min: float, rate_max: float}|null
     */
    public function bandFor(?float $lvr): ?array
    {
        $rows = collect($this->rows)->sortBy('max_lvr')->values();

        if ($lvr === null) {
            return $rows->last();
        }

        return $rows->first(fn (array $row) => $lvr <= $row['max_lvr']);
    }
}
