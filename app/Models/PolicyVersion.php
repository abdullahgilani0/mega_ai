<?php

namespace App\Models;

use App\Enums\LoanPack;
use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A versioned, structured lender policy. Rules are the source of truth for pass or fail.
 *
 * @property int $id
 * @property int $lender_id
 * @property LoanPack $loan_pack
 * @property int $version
 * @property list<array{id: string, label: string, field: string, op: string, value: mixed, clause: string}> $rules
 * @property string $status
 * @property string|null $source_document
 * @property int|null $created_by
 * @property int|null $approved_by
 * @property Carbon|null $published_at
 * @property-read Lender $lender
 */
#[Fillable(['lender_id', 'loan_pack', 'version', 'rules', 'status', 'source_document', 'created_by', 'approved_by', 'published_at'])]
class PolicyVersion extends Model
{
    protected function casts(): array
    {
        return [
            'loan_pack' => LoanPack::class,
            'rules' => 'array',
            'published_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Lender, $this>
     */
    public function lender(): BelongsTo
    {
        return $this->belongsTo(Lender::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }
}
