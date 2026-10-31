<?php

namespace App\Models;

use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

/**
 * Append-only timeline event. Also the source of truth for the MEGA visualisation.
 *
 * @property int $id
 * @property int $application_id
 * @property string $type
 * @property int|null $actor_id
 * @property array<string, mixed>|null $payload
 * @property Carbon $occurred_at
 */
#[Fillable(['application_id', 'type', 'actor_id', 'payload', 'occurred_at'])]
class ApplicationEvent extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Application events are append-only.'));
        static::deleting(fn () => throw new LogicException('Application events are append-only.'));
    }

    /**
     * @return BelongsTo<Application, $this>
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
