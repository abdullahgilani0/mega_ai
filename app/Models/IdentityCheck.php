<?php

namespace App\Models;

use App\Enums\IdentityResult;
use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $application_id
 * @property string $vendor
 * @property string $document_type
 * @property IdentityResult $result
 * @property string|null $liveness_result
 * @property int $attempts
 * @property string|null $completed_on
 * @property array<string, mixed>|null $evidence
 * @property int|null $reviewed_by
 * @property Carbon|null $completed_at
 * @property-read Application $application
 */
#[Fillable(['application_id', 'vendor', 'document_type', 'result', 'liveness_result', 'attempts', 'completed_on', 'evidence', 'reviewed_by', 'completed_at'])]
class IdentityCheck extends Model
{
    protected function casts(): array
    {
        return [
            'result' => IdentityResult::class,
            'evidence' => 'array',
            'completed_at' => 'datetime',
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
