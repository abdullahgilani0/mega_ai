<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\AuditLog;
use App\Models\Consent;
use App\Models\DataRequest;
use App\Models\Signature;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Borrower privacy centre: what we hold, consents, who looked and why, export and deletion.
 */
class PrivacyController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();
        $applicationIds = $user->applications()->pluck('id');

        return Inertia::render('borrower/privacy', [
            'consents' => Consent::where('user_id', $user->id)->latest('id')->get()->map(fn (Consent $consent) => [
                'id' => $consent->id,
                'title' => $consent->type->title(),
                'required' => $consent->type->isRequired(),
                'version' => $consent->text_version,
                'grantedAt' => $consent->granted_at->toIso8601String(),
                'revokedAt' => $consent->revoked_at?->toIso8601String(),
            ]),
            'accessHistory' => AuditLog::query()
                ->where('subject_type', 'Application')
                ->whereIn('subject_id', $applicationIds)
                ->where('actor_id', '!=', $user->id)
                ->whereNotNull('actor_id')
                ->with('actor:id,role')
                ->latest('id')
                ->limit(50)
                ->get()
                ->map(fn (AuditLog $log) => [
                    'id' => $log->id,
                    'role' => $log->actor?->role instanceof Role ? $log->actor->role->label() : 'Staff',
                    'action' => $log->action,
                    'reason' => $log->reason,
                    'at' => $log->created_at->toIso8601String(),
                ]),
            'held' => [
                'applications' => $applicationIds->count(),
                'documents' => $user->applications()->withCount('documents')->get()->sum('documents_count'),
                'signatures' => Signature::where('user_id', $user->id)->count(),
            ],
        ]);
    }

    public function export(Request $request, AuditLogger $audit): StreamedResponse
    {
        $user = $request->user();
        $audit->record('privacy.export', $user);

        $payload = [
            'exported_at' => now()->toIso8601String(),
            'profile' => $user->only(['name', 'email', 'mobile', 'created_at']),
            'consents' => Consent::where('user_id', $user->id)->get(['type', 'text_version', 'granted_at', 'revoked_at']),
            'applications' => $user->applications()->with([
                'documents:id,application_id,kind,original_name,status,created_at',
                'advisorNotes:id,application_id,fact,confirmed_at',
                'signatures:id,application_id,document_hash,signed_name,signed_at',
            ])->get()->map(fn ($application) => [
                ...$application->only(['public_id', 'loan_pack', 'purpose', 'amount', 'state', 'postcode', 'stage', 'status', 'data', 'provenance', 'created_at', 'submitted_at']),
                'documents' => $application->documents,
                'advisor_notes' => $application->advisorNotes,
                'signatures' => $application->signatures,
            ]),
        ];

        return response()->streamDownload(
            fn () => print (json_encode($payload, JSON_PRETTY_PRINT)),
            'mega-my-data.json',
            ['Content-Type' => 'application/json'],
        );
    }

    public function requestDeletion(Request $request, AuditLogger $audit): RedirectResponse
    {
        DataRequest::firstOrCreate(
            ['user_id' => $request->user()->id, 'type' => 'deletion', 'status' => 'open'],
        );
        $audit->record('privacy.deletion_requested', $request->user(), reason: 'Borrower request from privacy centre');

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Request received. Our privacy team will confirm what can be deleted within 30 days; some records must be kept by law.']);

        return back();
    }

    public function revokeConsent(Request $request, Consent $consent, AuditLogger $audit): RedirectResponse
    {
        abort_unless($consent->user_id === $request->user()->id, 404);

        if ($consent->type->isRequired()) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'This consent is needed while an application is open. Withdraw the application to stop processing.']);

            return back();
        }

        $consent->update(['revoked_at' => now()]);
        $audit->record('consent.revoked', $consent, after: ['type' => $consent->type->value]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Consent withdrawn.']);

        return back();
    }

    public function rerollAvatar(Request $request): RedirectResponse
    {
        $user = $request->user();
        $user->update(['avatar_seed' => ($user->avatarIndex() + random_int(1, 23)) % 24]);

        return back();
    }
}
