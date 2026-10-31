<?php

namespace App\Models;

use App\Enums\LoanPack;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $lender_id
 * @property LoanPack $loan_pack
 * @property string $name
 * @property list<string> $features
 * @property-read Lender $lender
 */
#[Fillable(['lender_id', 'loan_pack', 'name', 'features'])]
class LenderProduct extends Model
{
    protected function casts(): array
    {
        return [
            'loan_pack' => LoanPack::class,
            'features' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Lender, $this>
     */
    public function lender(): BelongsTo
    {
        return $this->belongsTo(Lender::class);
    }

    /**
     * @return HasMany<RateSheet, $this>
     */
    public function rateSheets(): HasMany
    {
        return $this->hasMany(RateSheet::class);
    }

    public function currentRateSheet(): ?RateSheet
    {
        return $this->rateSheets->sortByDesc('effective_from')->first();
    }
}
