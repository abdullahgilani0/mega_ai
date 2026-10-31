<?php

namespace App\Models;

use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Just-in-time, time-limited staff access to one borrower's file.
 *
 * @property int $id
 * @property int $user_id
 * @property int $application_id
 * @property string $reason
 * @property bool $break_glass
 * @property Carbon $expires_at
 * @property Carbon|null $revoked_at
 * @property Carbon|null $reviewed_at
 * @property Carbon $created_at
 * @property-read User $user
 * @property-read Application $application
 */
#[Fillable(['user_id', 'application_id', 'reason', 'break_glass', 'expires_at', 'revoked_at', 'reviewed_at'])]
class AccessGrant extends Model
{
    protected function casts(): array
    {
        return [
            'break_glass' => 'boolean',
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    /**
     * @param  Builder<AccessGrant>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->whereNull('revoked_at')->where('expires_at', '>', now());
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Application, $this>
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}
