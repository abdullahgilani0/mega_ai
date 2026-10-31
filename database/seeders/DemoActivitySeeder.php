<?php

namespace Database\Seeders;

use App\Enums\ApplicationStage;
use App\Enums\DocumentKind;
use App\Enums\DocumentStatus;
use App\Enums\IdentityResult;
use App\Enums\LoanPack;
use App\Models\Application;
use App\Models\DataRequest;
use App\Models\DisclosureTemplate;
use App\Models\GoldenScenario;
use App\Models\Lender;
use App\Models\User;
use App\Services\Allocation\AllocationEngine;
use App\Services\Matching\GoldenScenarioRunner;
use App\Services\Matching\MatchingEngine;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * Realistic demo activity so every console screen has something to work with.
 * All people and data are fictional.
 */
class DemoActivitySeeder extends Seeder
{
    public function run(MatchingEngine $engine, AllocationEngine $allocation, GoldenScenarioRunner $golden): void
    {
        $this->allocatedApplication($engine, $allocation);
        $this->applicationWithQuestions($engine);
        $this->unallocatedApplication($engine, $allocation);
        $this->goldenScenarios($golden);
        $this->creditGuide();
    }

    private function allocatedApplication(MatchingEngine $engine, AllocationEngine $allocation): void
    {
        $sam = User::factory()->create(['name' => 'Sam Taylor', 'email' => 'sam@mega.test']);
        $application = Application::factory()->withCompleteFinancials()->atStage(ApplicationStage::Assessment)->create([
            'user_id' => $sam->id,
            'postcode' => '2150',
            'amount' => 620000,
        ]);
        $application->identityChecks()->create(['vendor' => 'sandbox', 'document_type' => 'driver_licence', 'result' => IdentityResult::Verified, 'attempts' => 1, 'completed_on' => 'this_device', 'completed_at' => now()]);
        $application->advisorNotes()->create(['fact' => 'Has 0 dependants', 'field' => 'dependants', 'value' => '0', 'confirmed_at' => now()]);

        $flagged = $application->documents()->create([
            'kind' => DocumentKind::Payslip,
            'original_name' => 'payslip_september.pdf',
            'storage_path' => '',
            'sha256' => hash('sha256', 'demo-payslip-sam'),
            'mime_type' => 'application/pdf',
            'size_bytes' => 48211,
            'status' => DocumentStatus::InReview,
        ]);
        $flagged->authenticityReport()->create([
            'score' => 70,
            'reason_codes' => [
                ['code' => 'metadata.editing_tool', 'detail' => 'File metadata names an editing tool (photoshop).', 'weight' => 35],
                ['code' => 'structure.incremental_updates', 'detail' => 'PDF was saved 2 times (incremental updates after creation).', 'weight' => 20],
                ['code' => 'metadata.modified_after_creation', 'detail' => 'Modified on 20261012, after creation on 20260930.', 'weight' => 15],
            ],
        ]);

        $run = $engine->run($application);
        $application->refresh();
        $choice = $run->shortlist()->first();
        $application->update(['selected_match_result_id' => $choice?->id]);

        foreach (DisclosureTemplate::current()->get() as $template) {
            $body = $template->render([
                'borrower_name' => $sam->name,
                'borrower_email' => $sam->email,
                'loan_type' => LoanPack::Home->label(),
                'loan_amount' => '$620,000',
                'lender_name' => $choice?->lender->name ?? 'the lender your broker recommends',
                'licensee_name' => (string) config('mega.licensee.name'),
                'licence_number' => (string) config('mega.licensee.licence_number'),
                'date' => now()->format('j F Y'),
            ]);
            $application->signatures()->create([
                'disclosure_template_id' => $template->id,
                'user_id' => $sam->id,
                'rendered_body' => $body,
                'document_hash' => hash('sha256', $body),
                'signed_name' => $sam->name,
                'seconds_on_page' => 95,
                'acknowledged_at' => now(),
                'signed_at' => now(),
                'ip_address' => '203.0.113.24',
            ]);
        }

        $application->update(['stage' => ApplicationStage::Submitted, 'submitted_at' => now()]);
        $offer = $allocation->offerNext($application);

        if ($offer) {
            $allocation->accept($offer);
            $brokerUser = $offer->broker->user;
            $application->messages()->create(['sender_id' => $brokerUser->id, 'body' => "Hi Sam, I'm {$brokerUser->name}. I've reviewed your matches and they look strong. Are you free for a quick call tomorrow?", 'read_at' => now()]);
            $application->messages()->create(['sender_id' => $sam->id, 'body' => 'Hi! Yes, any time after 3pm works for me.']);
        }
    }

    private function applicationWithQuestions(MatchingEngine $engine): void
    {
        $jordan = User::factory()->create(['name' => 'Jordan Lee', 'email' => 'jordan@mega.test']);
        $application = Application::factory()->withCompleteFinancials()->atStage(ApplicationStage::Assessment)->create([
            'user_id' => $jordan->id,
            'postcode' => '3000',
            'state' => 'VIC',
        ]);
        $application->data = collect($application->data)->except(['property_value', 'employment_months'])->all();
        $application->save();
        $application->identityChecks()->create(['vendor' => 'sandbox', 'document_type' => 'passport', 'result' => IdentityResult::ManualReview, 'attempts' => 3, 'evidence' => ['capture_quality' => 'poor']]);

        $engine->run($application);
    }

    private function unallocatedApplication(MatchingEngine $engine, AllocationEngine $allocation): void
    {
        $chris = User::factory()->create(['name' => 'Chris Wong', 'email' => 'chris@mega.test']);
        $application = Application::factory()->withCompleteFinancials()->atStage(ApplicationStage::Assessment)->create([
            'user_id' => $chris->id,
            'loan_pack' => LoanPack::Personal,
            'purpose' => 'renovation',
            'amount' => 30000,
            'term_years' => 5,
            'state' => 'WA',
            'postcode' => '6230',
        ]);

        $engine->run($application);
        $application->update(['stage' => ApplicationStage::Submitted, 'submitted_at' => now()]);
        $allocation->offerNext($application);

        DataRequest::create(['user_id' => $chris->id, 'type' => 'deletion', 'status' => 'open']);
    }

    private function goldenScenarios(GoldenScenarioRunner $golden): void
    {
        $lenders = Lender::with('policyVersions')->whereIn('category', ['major_bank', 'second_tier'])->orderBy('name')->limit(3)->get();
        $scenarios = [
            'First home buyer, 80% LVR, strong credit' => ['amount' => 640000, 'property_value' => 800000, 'credit_score' => 760, 'employment_type' => 'payg', 'employment_months' => 30, 'income_annual' => 150000],
            'Casual worker, 95% LVR' => ['amount' => 760000, 'property_value' => 800000, 'credit_score' => 640, 'employment_type' => 'casual', 'employment_months' => 4, 'income_annual' => 82000],
        ];

        foreach ($scenarios as $name => $scenario) {
            $expectations = [];

            foreach ($lenders as $lender) {
                $policy = $lender->publishedPolicyFor(LoanPack::Home);

                if ($policy) {
                    [$outcome] = $golden->outcome($policy, $scenario);
                    $expectations[(string) $lender->id] = $outcome;
                }
            }

            GoldenScenario::create(['name' => $name, 'loan_pack' => LoanPack::Home, 'scenario' => $scenario, 'expectations' => $expectations]);
        }
    }

    private function creditGuide(): void
    {
        $lender = Lender::where('name', 'Jarrah Bank')->first();

        if (! $lender) {
            return;
        }

        $content = "Jarrah Bank credit guide (DEMO)\n\nThis is a placeholder credit guide for demonstration only.";
        $path = 'lenders/'.$lender->slug.'/credit-guide-demo.txt';
        Storage::disk('local')->put($path, $content);

        $lender->documents()->create([
            'kind' => 'credit_guide',
            'title' => 'Jarrah Bank credit guide',
            'storage_path' => $path,
            'mime_type' => 'text/plain',
            'size_bytes' => strlen($content),
            'sha256' => hash('sha256', $content),
            'version' => 1,
            'effective_from' => now()->subMonth()->toDateString(),
        ]);
    }
}
