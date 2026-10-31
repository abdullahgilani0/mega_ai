<?php

namespace App\Services\Matching;

use App\Enums\DocumentKind;
use App\Enums\DocumentStatus;
use App\Enums\GapStatus;
use App\Enums\LoanPack;
use App\Models\Application;
use App\Models\ApplicationGap;
use App\Models\MatchRun;

/**
 * Decides what to ask or re-request, and in what order. Drops any question the
 * data can already answer.
 */
class GapGenerator
{
    public const FIELD_PROMPTS = [
        'income_annual' => 'What is your total income before tax each year?',
        'expenses_monthly' => 'Roughly what do you spend each month on living costs?',
        'liabilities_monthly' => 'What do you repay each month on other debts? Enter 0 if none.',
        'dependants' => 'Confirm your number of dependants.',
        'employment_months' => 'How many months have you been in your current job?',
        'property_value' => 'What is the estimated value of the property?',
        'asset_price' => 'What is the purchase price of the vehicle or asset?',
        'asset_age_years' => 'How old is the vehicle or asset, in years?',
        'time_in_business_months' => 'How many months has your business been trading?',
        'annual_turnover' => 'What was your business turnover over the last 12 months?',
    ];

    /**
     * Replace the open gap list with a fresh one for this run.
     *
     * @return int The number of open gaps.
     */
    public function generate(Application $application, MatchRun $run): int
    {
        $application->gaps()->where('status', GapStatus::Open)->delete();

        $escalated = $application->gaps()->where('status', GapStatus::Escalated)->pluck('field')->all();
        $gaps = [];
        $priority = 10;

        foreach ($application->loan_pack->requiredFields() as $field) {
            if ($application->fact($field) === null && ! in_array($field, $escalated, true)) {
                $gaps[] = ['kind' => 'missing_fact', 'field' => $field, 'prompt' => self::FIELD_PROMPTS[$field], 'priority' => $priority++];
            }
        }

        $documents = $application->documents()->get();

        foreach ($documents->where('status', DocumentStatus::NeedsAttention) as $document) {
            $gaps[] = ['kind' => 'unreadable_document', 'field' => $document->kind->value, 'prompt' => $document->attention_reason ?? 'Please upload a clearer copy.', 'priority' => 5];
        }

        $hasUsable = fn (DocumentKind $kind) => $documents->contains(
            fn ($document) => $document->kind === $kind && $document->status !== DocumentStatus::NeedsAttention
        );

        $bankConnected = ($application->provenance['bank_institution'] ?? null) === 'open_banking';

        if (! $bankConnected && ! $hasUsable(DocumentKind::BankStatement)) {
            $gaps[] = ['kind' => 'missing_document', 'field' => DocumentKind::BankStatement->value, 'prompt' => 'Connect your bank, or upload your last 3 months of bank statements.', 'priority' => 60];
        }

        if (! $bankConnected && $application->employment_type === 'payg' && ! $hasUsable(DocumentKind::Payslip)) {
            $gaps[] = ['kind' => 'missing_document', 'field' => DocumentKind::Payslip->value, 'prompt' => 'Upload your most recent payslip.', 'priority' => 61];
        }

        if ($application->loan_pack === LoanPack::Business && ! $hasUsable(DocumentKind::Bas)) {
            $gaps[] = ['kind' => 'missing_document', 'field' => DocumentKind::Bas->value, 'prompt' => 'Upload your latest business activity statement (BAS).', 'priority' => 62];
        }

        $gaps = array_filter($gaps, fn (array $gap) => ! in_array($gap['field'], $escalated, true));

        foreach ($gaps as $gap) {
            ApplicationGap::create([...$gap, 'application_id' => $application->id, 'match_run_id' => $run->id, 'status' => GapStatus::Open]);
        }

        return count($gaps);
    }
}
