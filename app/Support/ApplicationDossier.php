<?php

namespace App\Support;

use App\Enums\ConsentType;
use App\Enums\GapStatus;
use App\Http\Controllers\MessageController;
use App\Http\Resources\AdminDocumentResource;
use App\Http\Resources\DocumentResource;
use App\Http\Resources\MatchResultResource;
use App\Models\AdvisorNote;
use App\Models\Application;
use App\Models\ApplicationEvent;
use App\Models\CoBorrower;

/**
 * Everything a broker or staff member needs to work an application, shaped once.
 * Authenticity data appears only through the admin resource, and only for roles allowed it.
 */
class ApplicationDossier
{
    /**
     * @return array<string, mixed>
     */
    public static function build(Application $application, bool $staffView): array
    {
        $application->load(['user', 'broker.user', 'creditReport', 'latestMatchRun', 'latestIdentityCheck']);
        $run = $application->latestMatchRun;
        $recordingConsented = $application->consents()->where('type', ConsentType::Recording)->whereNull('revoked_at')->exists();
        $documents = $application->documents()->with('authenticityReport')->latest('id')->get();

        return [
            'summary' => JourneyPresenter::summary($application),
            'borrower' => [
                'name' => $application->user->name,
                'email' => $application->user->email,
                'mobile' => $application->user->mobile,
                'avatar' => $application->user->avatarIndex(),
            ],
            'employmentType' => $application->employment_type,
            'isJoint' => $application->is_joint,
            'facts' => collect($application->data)->map(fn ($value, string $field) => [
                'field' => $field,
                'value' => $value,
                'source' => JourneyPresenter::sourceLabel($application->provenance[$field] ?? null),
            ])->values(),
            'identity' => $application->latestIdentityCheck ? [
                'result' => $application->latestIdentityCheck->result->value,
                'vendor' => $application->latestIdentityCheck->vendor,
                'completedOn' => $application->latestIdentityCheck->completed_on,
            ] : null,
            'credit' => $application->creditReport ? [
                'bureau' => $application->creditReport->bureau,
                'score' => $application->creditReport->score,
                'summary' => $application->creditReport->summary,
            ] : null,
            'documents' => $staffView
                ? AdminDocumentResource::collection($documents)->resolve()
                : DocumentResource::collection($documents)->resolve(),
            'run' => $run ? [
                'id' => $run->id,
                'total' => $run->lenders_total,
                'passed' => $run->lenders_passed,
                'scenarioHash' => $run->scenario_hash,
                'completedAt' => $run->completed_at?->toIso8601String(),
            ] : null,
            'shortlist' => $run ? MatchResultResource::collection($run->shortlist()->with(['lender', 'product', 'policyVersion'])->get())->resolve() : [],
            'selectedMatchId' => $application->selected_match_result_id,
            'notes' => $application->advisorNotes()->whereNotNull('confirmed_at')->get()->map(fn (AdvisorNote $note) => [
                'id' => $note->id,
                'fact' => $note->fact,
            ]),
            'transcript' => $recordingConsented
                ? $application->advisorMessages()->orderBy('id')->get(['role', 'body'])
                : null,
            'escalatedGaps' => $application->gaps()->where('status', GapStatus::Escalated)->get(['id', 'prompt']),
            'messages' => $staffView ? null : MessageController::thread($application, (int) auth()->id()),
            'coBorrowers' => $application->coBorrowers()->with('user:id,name')->get()->map(fn (CoBorrower $coBorrower) => [
                'email' => $coBorrower->email,
                'name' => $coBorrower->user?->name,
                'accepted' => $coBorrower->accepted_at !== null,
            ]),
            'signatures' => $application->signatures()->with('template:id,title,version')->get()->map(fn ($signature) => [
                'id' => $signature->id,
                'title' => $signature->template->title,
                'version' => $signature->template->version,
                'hash' => $signature->document_hash,
                'signedAt' => $signature->signed_at->toIso8601String(),
            ]),
            'broker' => $application->broker ? [
                'id' => $application->broker->id,
                'name' => $application->broker->user->name,
            ] : null,
            'brokerReviewedAt' => $application->broker_reviewed_at?->toIso8601String(),
            'timeline' => $application->events()
                ->where('type', 'not like', 'lender.%')
                ->with('actor:id,name')
                ->latest('id')
                ->limit(60)
                ->get()
                ->map(fn (ApplicationEvent $event) => [
                    'id' => $event->id,
                    'type' => $event->type,
                    'actor' => $event->actor?->name,
                    'at' => $event->occurred_at->toIso8601String(),
                ]),
        ];
    }
}
