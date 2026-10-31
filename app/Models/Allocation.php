<?php

namespace App\Models;

use App\Enums\AllocationStatus;
use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $application_id
 * @property int $broker_id
 * @property AllocationStatus $status
 * @property float $score
 * @property array<string, mixed> $reasons
 * @property Carbon $offered_at
 * @property Carbon $expires_at
 * @property Carbon|null $responded_at
 * @property-read Application $application
 * @property-read Broker $broker
 */
#[Fillable(['application_id', 'broker_id', 'status', 'score', 'reasons', 'offered_at', 'expires_at', 'responded_at'])]
class Allocation extends Model
{
    protected function casts(): array
    {
        return [
            'status' => AllocationStatus::class,
            'score' => 'float',
            'reasons' => 'array',
            'offered_at' => 'datetime',
            'expires_at' => 'datetime',
            'responded_at' => 'datetime',
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
     * @return BelongsTo<Broker, $this>
     */
    public function broker(): BelongsTo
    {
        return $this->belongsTo(Broker::class);
    }
}
