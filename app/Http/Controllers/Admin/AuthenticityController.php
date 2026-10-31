<?php

namespace App\Http\Controllers\Admin;

use App\Enums\DocumentStatus;
use App\Http\Controllers\Controller;
use App\Models\AuthenticityReport;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Human review queue for authenticity signals. A reviewer decides; the score never does.
 */
class AuthenticityController extends Controller
{
    public function index(): Response
    {
        $threshold = config('mega.authenticity.review_threshold');

        $present = fn (AuthenticityReport $report) => [
            'id' => $report->id,
            'score' => $report->score,
            'reasons' => $report->reason_codes,
            'decision' => $report->decision,
            'reviewer' => $report->reviewer?->name,
            'reviewedAt' => $report->reviewed_at?->toIso8601String(),
            'document' => [
                'name' => $report->document->original_name,
                'kind' => $report->document->kind->label(),
                'sha256' => $report->document->sha256,
            ],
            'application' => [
                'id' => $report->document->application->public_id,
                'borrower' => $report->document->application->user->name,
            ],
            'createdAt' => $report->created_at->toIso8601String(),
        ];

        $base = AuthenticityReport::with(['document.application.user:id,name', 'reviewer:id,name']);

        return Inertia::render('admin/authenticity', [
            'threshold' => $threshold,
            'queue' => (clone $base)->where('score', '>=', $threshold)->whereNull('decision')->orderByDesc('score')->get()->map($present),
            'recent' => (clone $base)->where(fn ($query) => $query->whereNotNull('decision')->orWhere('score', '<', $threshold))->latest('id')->limit(20)->get()->map($present),
        ]);
    }

    public function review(Request $request, AuthenticityReport $report, AuditLogger $audit): RedirectResponse
    {
        $validated = $request->validate([
            'decision' => ['required', Rule::in(['cleared', 'confirmed_concern'])],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $report->update(['decision' => $validated['decision'], 'reviewer_id' => $request->user()->id, 'reviewed_at' => now()]);

        $report->document->update($validated['decision'] === 'cleared'
            ? ['status' => DocumentStatus::Verified]
            : ['status' => DocumentStatus::NeedsAttention, 'attention_reason' => 'Please upload a clearer copy. Your broker may call to confirm a detail.']);

        $audit->record('authenticity.reviewed', $report, after: ['decision' => $validated['decision']], reason: $validated['reason']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Review recorded.']);

        return back();
    }
}
