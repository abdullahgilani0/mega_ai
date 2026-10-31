<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApprovalRequest;
use App\Services\ApprovalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApprovalController extends Controller
{
    public function index(Request $request): Response
    {
        $present = fn (ApprovalRequest $approval) => [
            'id' => $approval->id,
            'action' => $approval->action,
            'actionLabel' => ApprovalRequest::ACTIONS[$approval->action] ?? $approval->action,
            'subject' => $approval->subject_type ? $approval->subject_type.' #'.$approval->subject_id : null,
            'payload' => $approval->payload,
            'reason' => $approval->reason,
            'status' => $approval->status,
            'requester' => $approval->requester->name,
            'mine' => $approval->requested_by === $request->user()->id,
            'decider' => $approval->decider?->name,
            'decisionNote' => $approval->decision_note,
            'createdAt' => $approval->created_at->toIso8601String(),
            'decidedAt' => $approval->decided_at?->toIso8601String(),
        ];

        return Inertia::render('admin/approvals', [
            'pending' => ApprovalRequest::with('requester')->where('status', 'pending')->latest('id')->get()->map($present),
            'history' => ApprovalRequest::with(['requester', 'decider'])->where('status', '!=', 'pending')->latest('id')->limit(30)->get()->map($present),
        ]);
    }

    public function decide(Request $request, ApprovalRequest $approval, ApprovalService $approvals): RedirectResponse
    {
        $validated = $request->validate([
            'approve' => ['required', 'boolean'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $approvals->decide($approval, $request->user(), $request->boolean('approve'), $validated['note'] ?? null);

        Inertia::flash('toast', ['type' => 'success', 'message' => $request->boolean('approve') ? 'Approved and executed.' : 'Request rejected.']);

        return back();
    }
}
