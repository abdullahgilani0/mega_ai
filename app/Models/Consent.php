<?php

namespace App\Models;

use App\Enums\ConsentType;
use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $application_id
 * @property ConsentType $type
 * @property string $text_version
 * @property Carbon $granted_at
 * @property Carbon|null $revoked_at
 * @property string|null $ip_address
 * @property string|null $user_agent
 */
#[Fillable(['user_id', 'application_id', 'type', 'text_version', 'granted_at', 'revoked_at', 'ip_address', 'user_agent'])]
class Consent extends Model
{
    protected function casts(): array
    {
        return [
            'type' => ConsentType::class,
            'granted_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function isActive(): bool
    {
        return $this->revoked_at === null;
    }

    /**
     * @return BelongsTo<Application, $this>
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}
