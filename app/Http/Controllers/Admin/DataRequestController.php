<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DataRequest;
use App\Services\ApprovalService;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DataRequestController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/data-requests', [
            'requests' => DataRequest::with('user:id,name,email')->latest('id')->limit(60)->get()->map(fn (DataRequest $request) => [
                'id' => $request->id,
                'user' => $request->user->name,
                'email' => $request->user->email,
                'type' => $request->type,
                'status' => $request->status,
                'notes' => $request->notes,
                'createdAt' => $request->created_at->toIso8601String(),
                'handledAt' => $request->handled_at?->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Deletion is destructive, so approving it raises a four-eyes request.
     */
    public function update(Request $request, DataRequest $dataRequest, ApprovalService $approvals, AuditLogger $audit): RedirectResponse
    {
        $validated = $request->validate([
            'decision' => ['required', Rule::in(['approve', 'reject'])],
            'notes' => ['required', 'string', 'max:255'],
        ]);

        abort_unless($dataRequest->status === 'open', 409);

        if ($validated['decision'] === 'approve') {
            $approvals->request($request->user(), 'data_deletion', $dataRequest->user, ['data_request_id' => $dataRequest->id], $validated['notes']);
            $dataRequest->update(['status' => 'pending_approval', 'handled_by' => $request->user()->id, 'notes' => $validated['notes']]);
            Inertia::flash('toast', ['type' => 'info', 'message' => 'Sent to a second super admin for approval.']);
        } else {
            $dataRequest->update(['status' => 'rejected', 'handled_by' => $request->user()->id, 'handled_at' => now(), 'notes' => $validated['notes']]);
            $audit->record('privacy.request_rejected', $dataRequest, reason: $validated['notes']);
        }

        return back();
    }
}
