<?php

namespace App\Models;

use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $application_id
 * @property int|null $user_id
 * @property string $email
 * @property Carbon|null $accepted_at
 * @property-read Application $application
 * @property-read User|null $user
 */
#[Fillable(['application_id', 'user_id', 'email', 'accepted_at'])]
class CoBorrower extends Model
{
    protected function casts(): array
    {
        return [
            'accepted_at' => 'datetime',
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
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
