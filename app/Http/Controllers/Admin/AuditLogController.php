<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApprovalRequest;
use App\Models\AuditLog;
use App\Services\ApprovalService;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'action' => ['nullable', 'string', 'max:64'],
        ]);

        return Inertia::render('admin/audit', [
            'logs' => AuditLog::with('actor:id,name,role')
                ->when($filters['action'] ?? null, fn ($query, $action) => $query->where('action', 'like', $action.'%'))
                ->latest('id')
                ->paginate(40)
                ->withQueryString()
                ->through(fn (AuditLog $log) => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'actor' => $log->actor_id === null ? 'System' : $log->actor->name,
                    'actorRole' => $log->actor_id === null ? null : $log->actor->role->label(),
                    'subject' => $log->subject_type ? $log->subject_type.' #'.$log->subject_id : null,
                    'before' => $log->before,
                    'after' => $log->after,
                    'reason' => $log->reason,
                    'ip' => $log->ip_address,
                    'at' => $log->created_at->toIso8601String(),
                ]),
            'filters' => $filters,
            'exports' => ApprovalRequest::where('action', 'audit_export')
                ->where('requested_by', $request->user()->id)
                ->latest('id')
                ->limit(5)
                ->get()
                ->map(fn (ApprovalRequest $export) => [
                    'id' => $export->id,
                    'status' => $export->status,
                    'downloadable' => $export->status === 'approved' && $export->expires_at?->isFuture(),
                    'createdAt' => $export->created_at->toIso8601String(),
                ]),
        ]);
    }

    /**
     * Bulk export is a data-exfiltration risk, so it needs a second super admin.
     */
    public function requestExport(Request $request, ApprovalService $approvals): RedirectResponse
    {
        $validated = $request->validate(['reason' => ['required', 'string', 'max:255']]);

        $approvals->request($request->user(), 'audit_export', null, ['format' => 'csv'], $validated['reason']);

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Export requested. A second super admin must approve it.']);

        return back();
    }

    public function download(Request $request, ApprovalRequest $export, AuditLogger $audit): StreamedResponse
    {
        abort_unless(
            $export->action === 'audit_export'
                && $export->requested_by === $request->user()->id
                && $export->status === 'approved'
                && $export->expires_at?->isFuture(),
            404,
        );

        $audit->record('audit.exported', $export);

        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');

            if ($out === false) {
                return;
            }

            fputcsv($out, ['id', 'created_at', 'actor_id', 'action', 'subject_type', 'subject_id', 'reason', 'ip_address']);
            AuditLog::query()->orderBy('id')->chunk(500, function ($logs) use ($out) {
                foreach ($logs as $log) {
                    fputcsv($out, [$log->id, $log->created_at->toIso8601String(), $log->actor_id, $log->action, $log->subject_type, $log->subject_id, $log->reason, $log->ip_address]);
                }
            });
            fclose($out);
        }, 'mega-audit-log.csv', ['Content-Type' => 'text/csv']);
    }
}
