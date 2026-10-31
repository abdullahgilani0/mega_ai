<?php

namespace App\Services;

use App\Enums\ConsentType;
use App\Enums\IdentityResult;
use App\Models\Application;
use App\Models\CreditReport;
use App\Services\Vendors\Contracts\CreditBureau;

/**
 * Background soft credit check: runs once identity is verified and consent exists.
 * The borrower only ever sees "credit check complete".
 */
class CreditCheckService
{
    public function __construct(
        private CreditBureau $bureau,
        private ApplicationTimeline $timeline,
        private AuditLogger $audit,
    ) {}

    public function runIfReady(Application $application): ?CreditReport
    {
        if ($application->creditReport()->exists()) {
            return $application->creditReport;
        }

        $consent = $application->consents()
            ->where('type', ConsentType::CreditCheck)
            ->whereNull('revoked_at')
            ->latest('id')
            ->first();

        $identityVerified = $application->identityChecks()->where('result', IdentityResult::Verified)->exists();

        if (! $consent || ! $identityVerified) {
            return null;
        }

        $result = $this->bureau->softCheck($application);

        $report = $application->creditReport()->create([
            'bureau' => $this->bureau->name(),
            'score' => $result['score'],
            'summary' => $result['summary'],
            'consent_id' => $consent->id,
        ]);

        $application->setFact('credit_score', $result['score'], 'credit_bureau');
        $application->setFact('credit_card_limits', $result['summary']['credit_card_limits'], 'credit_bureau');
        $application->save();

        $this->timeline->record($application, 'credit.complete');
        $this->audit->record('credit.soft_check', $application, after: ['bureau' => $this->bureau->name(), 'permitted_purpose' => 'credit_assistance']);

        return $report;
    }
}
