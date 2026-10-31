<?php

namespace App\Models;

use App\Enums\GapStatus;
use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One missing fact, unreadable document or conflict that MEGA needs resolved.
 *
 * @property int $id
 * @property int $application_id
 * @property int|null $match_run_id
 * @property string $kind
 * @property string|null $field
 * @property string $prompt
 * @property GapStatus $status
 * @property int $priority
 * @property Carbon|null $resolved_at
 * @property-read Application $application
 */
#[Fillable(['application_id', 'match_run_id', 'kind', 'field', 'prompt', 'status', 'priority', 'resolved_at'])]
class ApplicationGap extends Model
{
    protected function casts(): array
    {
        return [
            'status' => GapStatus::class,
            'resolved_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Application, $this>
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}
