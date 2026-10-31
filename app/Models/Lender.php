<?php

namespace App\Models;

use App\Enums\LenderCoverage;
use App\Enums\LoanPack;
use Carbon\CarbonImmutable as Carbon;
use Database\Factories\LenderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property string $category
 * @property string|null $abn
 * @property string|null $licence_ref
 * @property string $brand_color
 * @property bool $logo_usage_approved
 * @property string $status
 * @property int $turnaround_days
 * @property LenderCoverage $coverage
 * @property Carbon|null $last_reviewed_at
 * @property-read int|null $draft_count
 */
#[Fillable(['name', 'slug', 'category', 'abn', 'licence_ref', 'brand_color', 'logo_usage_approved', 'status', 'turnaround_days', 'coverage', 'last_reviewed_at'])]
class Lender extends Model
{
    /** @use HasFactory<LenderFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'logo_usage_approved' => 'boolean',
            'coverage' => LenderCoverage::class,
            'last_reviewed_at' => 'datetime',
        ];
    }

    /**
     * @return HasMany<LenderProduct, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(LenderProduct::class);
    }

    /**
     * @return HasMany<PolicyVersion, $this>
     */
    public function policyVersions(): HasMany
    {
        return $this->hasMany(PolicyVersion::class);
    }

    /**
     * @return HasMany<LenderDocument, $this>
     */
    public function documents(): HasMany
    {
        return $this->hasMany(LenderDocument::class);
    }

    public function publishedPolicyFor(LoanPack $pack): ?PolicyVersion
    {
        return $this->policyVersions
            ->where('loan_pack', $pack)
            ->where('status', 'published')
            ->sortByDesc('version')
            ->first();
    }
}
