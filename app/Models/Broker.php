<?php

namespace App\Models;

use App\Enums\AllocationStatus;
use App\Enums\ApplicationStatus;
use Carbon\CarbonImmutable as Carbon;
use Database\Factories\BrokerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $user_id
 * @property string $licence_ref
 * @property string|null $business_name
 * @property list<string> $loan_packs
 * @property list<string> $skills
 * @property list<string> $languages
 * @property int $capacity
 * @property string $status
 * @property float $acceptance_rate
 * @property int $avg_first_contact_minutes
 * @property float $conversion_rate
 * @property Carbon|null $last_allocated_at
 * @property-read User $user
 */
#[Fillable(['user_id', 'licence_ref', 'business_name', 'loan_packs', 'skills', 'languages', 'capacity', 'status', 'acceptance_rate', 'avg_first_contact_minutes', 'conversion_rate', 'last_allocated_at'])]
class Broker extends Model
{
    /** @use HasFactory<BrokerFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'loan_packs' => 'array',
            'skills' => 'array',
            'languages' => 'array',
            'acceptance_rate' => 'float',
            'conversion_rate' => 'float',
            'last_allocated_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsToMany<Territory, $this, BrokerTerritory>
     */
    public function territories(): BelongsToMany
    {
        return $this->belongsToMany(Territory::class)->using(BrokerTerritory::class)->withPivot('coverage');
    }

    /**
     * @return HasMany<Application, $this>
     */
    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    /**
     * @return HasMany<Allocation, $this>
     */
    public function allocations(): HasMany
    {
        return $this->hasMany(Allocation::class);
    }

    public function openApplicationCount(): int
    {
        return $this->applications()
            ->whereNotIn('status', [ApplicationStatus::Settled, ApplicationStatus::Declined, ApplicationStatus::Withdrawn])
            ->count()
            + $this->allocations()->where('status', AllocationStatus::Offered)->count();
    }
}
