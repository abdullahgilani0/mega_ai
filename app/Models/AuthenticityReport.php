<?php

namespace App\Models;

use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A probabilistic signal that routes a document to human review. It never declines a borrower.
 *
 * @property int $id
 * @property int $document_id
 * @property int $score
 * @property list<array{code: string, detail: string, weight: int}> $reason_codes
 * @property int|null $reviewer_id
 * @property string|null $decision
 * @property Carbon|null $reviewed_at
 * @property Carbon $created_at
 * @property-read Document $document
 * @property-read User|null $reviewer
 */
#[Fillable(['document_id', 'score', 'reason_codes', 'reviewer_id', 'decision', 'reviewed_at'])]
class AuthenticityReport extends Model
{
    protected function casts(): array
    {
        return [
            'reason_codes' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    public function isFlagged(): bool
    {
        return $this->score >= config('mega.authenticity.review_threshold');
    }

    /**
     * @return BelongsTo<Document, $this>
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
