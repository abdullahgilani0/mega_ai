<?php

namespace App\Models;

use Carbon\CarbonImmutable as Carbon;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A destructive or privileged action waiting for a second super admin (four-eyes).
 *
 * @property int $id
 * @property int $requested_by
 * @property string $action
 * @property string|null $subject_type
 * @property int|null $subject_id
 * @property array<string, mixed> $payload
 * @property string $reason
 * @property string $status
 * @property int|null $decided_by
 * @property Carbon|null $decided_at
 * @property string|null $decision_note
 * @property Carbon|null $expires_at
 * @property Carbon $created_at
 * @property-read User $requester
 * @property-read User|null $decider
 */
#[Fillable(['requested_by', 'action', 'subject_type', 'subject_id', 'payload', 'reason', 'status', 'decided_by', 'decided_at', 'decision_note', 'expires_at'])]
class ApprovalRequest extends Model
{
    public const ACTIONS = [
        'role_change' => 'Change a user’s role',
        'data_deletion' => 'Delete a borrower’s personal data',
        'audit_export' => 'Bulk export of the audit log',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'decided_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function decider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }
}
