<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $application_id
 * @property string $bureau
 * @property int $score
 * @property array<string, mixed> $summary
 * @property int|null $consent_id
 */
#[Fillable(['application_id', 'bureau', 'score', 'summary', 'consent_id'])]
class CreditReport extends Model
{
    protected function casts(): array
    {
        return [
            'summary' => 'array',
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
