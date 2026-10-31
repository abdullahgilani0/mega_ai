<?php

namespace App\Models;

use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A borrower's privacy request (deletion) and how staff handled it.
 *
 * @property int $id
 * @property int $user_id
 * @property string $type
 * @property string $status
 * @property int|null $handled_by
 * @property Carbon|null $handled_at
 * @property string|null $notes
 * @property Carbon $created_at
 * @property-read User $user
 */
#[Fillable(['user_id', 'type', 'status', 'handled_by', 'handled_at', 'notes'])]
class DataRequest extends Model
{
    protected function casts(): array
    {
        return [
            'handled_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
