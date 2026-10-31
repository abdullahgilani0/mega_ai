<?php

namespace App\Http\Controllers\Admin;

use App\Enums\DocumentStatus;
use App\Enums\GapStatus;
use App\Enums\IdentityResult;
use App\Http\Controllers\Controller;
use App\Models\ApplicationGap;
use App\Models\Document;
use App\Models\IdentityCheck;
use App\Services\ApplicationTimeline;
use App\Services\AuditLogger;
use App\Services\CreditCheckService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Back-office queue: identity checks routed to a person, documents that need a look,
 * and questions borrowers handed to their broker.
 */
class WorkQueueController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/work-queue', [
            'identity' => IdentityCheck::with('application.user:id,name')
                ->where('result', IdentityResult::ManualReview)
                ->latest('id')
                ->get()
                ->map(fn (IdentityCheck $check) => [
                    'id' => $check->id,
                    'applicationId' => $check->application->public_id,
                    'borrower' => $check->application->user->name,
                    'documentType' => $check->document_type,
                    'documentId' => $check->evidence['document_id'] ?? null,
                    'attempts' => $check->attempts,
                    'createdAt' => $check->created_at->toIso8601String(),
                ]),
            'documents' => Document::with('application.user:id,name')
                ->whereIn('status', [DocumentStatus::NeedsAttention, DocumentStatus::InReview])
                ->latest('id')
                ->limit(50)
                ->get()
                ->map(fn (Document $document) => [
                    'id' => $document->id,
                    'applicationId' => $document->application->public_id,
                    'borrower' => $document->application->user->name,
                    'kind' => $document->kind->label(),
                    'status' => $document->status->value,
                    'reason' => $document->attention_reason,
                    'createdAt' => $document->created_at->toIso8601String(),
                ]),
            'gaps' => ApplicationGap::with('application.user:id,name')
                ->where('status', GapStatus::Escalated)
                ->latest('id')
                ->limit(50)
                ->get()
                ->map(fn (ApplicationGap $gap) => [
                    'id' => $gap->id,
                    'applicationId' => $gap->application->public_id,
                    'borrower' => $gap->application->user->name,
                    'prompt' => $gap->prompt,
                    'createdAt' => $gap->created_at->toIso8601String(),
                ]),
        ]);
    }

    public function decideIdentity(Request $request, IdentityCheck $check, ApplicationTimeline $timeline, AuditLogger $audit, CreditCheckService $credit): RedirectResponse
    {
        abort_unless($check->result === IdentityResult::ManualReview, 409);

        $validated = $request->validate([
            'decision' => ['required', Rule::in(['verified', 'retry'])],
            'note' => ['required', 'string', 'max:255'],
        ]);

        $result = IdentityResult::from($validated['decision']);
        $check->update([
            'result' => $result,
            'reviewed_by' => $request->user()->id,
            'evidence' => [...($check->evidence ?? []), 'advice' => $result === IdentityResult::Retry ? 'Our team could not confirm your ID. Please retake the photo in good light.' : null],
        ]);

        $timeline->record($check->application, 'identity.'.$result->value);
        $audit->record('identity.manual_decision', $check, after: ['result' => $result->value], reason: $validated['note']);

        if ($result === IdentityResult::Verified) {
            $credit->runIfReady($check->application);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Identity decision recorded.']);

        return back();
    }

    public function resolveGap(Request $request, ApplicationGap $gap, AuditLogger $audit): RedirectResponse
    {
        abort_unless($gap->status === GapStatus::Escalated, 409);

        $validated = $request->validate(['note' => ['required', 'string', 'max:255']]);

        $gap->update(['status' => GapStatus::Resolved, 'resolved_at' => now()]);
        $audit->record('gap.resolved_by_staff', $gap, reason: $validated['note']);

        return back();
    }
}
