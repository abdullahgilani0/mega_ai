<?php

namespace App\Services;

use App\Enums\ApplicationStage;
use App\Enums\DocumentKind;
use App\Enums\DocumentStatus;
use App\Enums\IdentityResult;
use App\Models\Application;
use App\Models\IdentityCheck;
use App\Services\Documents\DocumentIntake;
use App\Services\Vendors\Contracts\IdentityVerifier;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\URL;

class IdentityVerification
{
    public function __construct(
        private IdentityVerifier $verifier,
        private DocumentIntake $intake,
        private CreditCheckService $creditCheck,
        private ApplicationTimeline $timeline,
        private AuditLogger $audit,
    ) {}

    /**
     * Capture the ID document and open a pending check awaiting the face scan.
     */
    public function start(Application $application, DocumentKind $kind, UploadedFile $idImage): IdentityCheck
    {
        $document = $this->intake->store($application, $idImage, $kind);
        $attempt = $application->identityChecks()->count() + 1;

        $check = $application->identityChecks()->create([
            'vendor' => $this->verifier->name(),
            'document_type' => $kind->value,
            'result' => IdentityResult::Pending,
            'attempts' => $attempt,
            'evidence' => [
                'document_id' => $document->id,
                'capture_quality' => $document->status === DocumentStatus::NeedsAttention ? 'poor' : 'good',
            ],
        ]);

        $this->audit->record('identity.capture', $check, after: ['document_type' => $kind->value, 'attempt' => $attempt]);

        return $check;
    }

    /**
     * Run liveness and face match, on this device or via the phone hand-off.
     */
    public function complete(IdentityCheck $check, string $completedOn): IdentityCheck
    {
        if ($check->result !== IdentityResult::Pending) {
            return $check;
        }

        $outcome = $this->verifier->verify($check);
        $result = $outcome['result'];

        if ($result === IdentityResult::Retry && $check->attempts >= config('mega.identity.max_attempts')) {
            $result = IdentityResult::ManualReview;
        }

        $check->update([
            'result' => $result,
            'liveness_result' => $outcome['liveness'],
            'completed_on' => $completedOn,
            'completed_at' => now(),
            'evidence' => [...$check->evidence, 'advice' => $outcome['advice']],
        ]);

        $application = $check->application;
        $this->timeline->record($application, 'identity.'.$result->value, ['completed_on' => $completedOn], $application->user_id);
        $this->audit->record('identity.'.$result->value, $check, after: ['liveness' => $outcome['liveness'], 'completed_on' => $completedOn]);

        if ($result === IdentityResult::Verified || $result === IdentityResult::ManualReview) {
            $application->advanceTo(ApplicationStage::Documents);
            $this->creditCheck->runIfReady($application);
        }

        return $check;
    }

    public function handoffUrl(IdentityCheck $check): string
    {
        return URL::temporarySignedRoute(
            'identity.handoff',
            now()->addMinutes(config('mega.identity.handoff_minutes')),
            ['check' => $check->id],
        );
    }
}
