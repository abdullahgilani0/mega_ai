<?php

namespace App\Services;

use App\Enums\Permission;
use App\Enums\Role;
use App\Models\ApprovalRequest;
use App\Models\DataRequest;
use App\Models\User;
use App\Notifications\ApprovalNeededNotification;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

/**
 * Four-eyes control: destructive or privileged actions are requested by one super
 * admin (or admin) and only executed when a different super admin approves.
 */
class ApprovalService
{
    public function __construct(
        private AuditLogger $audit,
        private PrivacyEraser $eraser,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function request(User $requester, string $action, ?Model $subject, array $payload, string $reason): ApprovalRequest
    {
        $request = ApprovalRequest::create([
            'requested_by' => $requester->id,
            'action' => $action,
            'subject_type' => $subject ? class_basename($subject) : null,
            'subject_id' => $subject?->getKey(),
            'payload' => $payload,
            'reason' => $reason,
        ]);

        $this->audit->record('approval.requested', $request, after: ['action' => $action, ...$payload], reason: $reason);

        Notification::send(
            User::where('role', Role::SuperAdmin)->where('id', '!=', $requester->id)->get(),
            new ApprovalNeededNotification($request),
        );

        return $request;
    }

    public function decide(ApprovalRequest $request, User $approver, bool $approve, ?string $note): void
    {
        if ($request->status !== 'pending') {
            throw ValidationException::withMessages(['approval' => 'This request has already been decided.']);
        }

        if ($request->requested_by === $approver->id) {
            throw ValidationException::withMessages(['approval' => 'A different super admin must approve this request.']);
        }

        if (! $approver->hasPermission(Permission::ReviewApprovals)) {
            throw ValidationException::withMessages(['approval' => 'Only super admins can approve.']);
        }

        $request->update([
            'status' => $approve ? 'approved' : 'rejected',
            'decided_by' => $approver->id,
            'decided_at' => now(),
            'decision_note' => $note,
            'expires_at' => $approve && $request->action === 'audit_export' ? now()->addDay() : null,
        ]);

        $this->audit->record($approve ? 'approval.approved' : 'approval.rejected', $request, reason: $note);

        if ($approve) {
            $this->execute($request);
        }
    }

    private function execute(ApprovalRequest $request): void
    {
        match ($request->action) {
            'role_change' => $this->changeRole($request),
            'data_deletion' => $this->erase($request),
            default => null,
        };
    }

    private function changeRole(ApprovalRequest $request): void
    {
        $user = User::findOrFail($request->subject_id);
        $before = ['role' => $user->role->value];
        $user->forceFill(['role' => Role::from((string) $request->payload['role'])])->save();
        $this->audit->record('user.role_changed', $user, $before, ['role' => $user->role->value], $request->reason);
        $request->update(['status' => 'executed']);
    }

    private function erase(ApprovalRequest $request): void
    {
        $user = User::findOrFail($request->subject_id);
        $this->eraser->erase($user);
        DataRequest::where('user_id', $user->id)->where('type', 'deletion')->where('status', 'pending_approval')
            ->update(['status' => 'completed', 'handled_at' => now()]);
        $request->update(['status' => 'executed']);
    }
}
