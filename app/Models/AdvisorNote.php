<?php

namespace App\Models;

use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A structured fact the advisor heard, held until the borrower confirms it.
 *
 * @property int $id
 * @property int $application_id
 * @property int|null $advisor_message_id
 * @property string|null $field
 * @property string|null $value
 * @property string $fact
 * @property Carbon|null $confirmed_at
 * @property Carbon|null $dismissed_at
 * @property-read AdvisorMessage|null $message
 */
#[Fillable(['application_id', 'advisor_message_id', 'field', 'value', 'fact', 'confirmed_at', 'dismissed_at'])]
class AdvisorNote extends Model
{
    protected function casts(): array
    {
        return [
            'confirmed_at' => 'datetime',
            'dismissed_at' => 'datetime',
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
     * @return BelongsTo<AdvisorMessage, $this>
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(AdvisorMessage::class, 'advisor_message_id');
    }
}
