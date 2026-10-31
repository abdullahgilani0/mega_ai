<?php

use App\Enums\ApplicationStage;
use App\Enums\GapStatus;
use App\Enums\LenderCoverage;
use App\Enums\LoanPack;
use App\Enums\MatchOutcome;
use App\Models\Application;
use App\Models\Lender;
use App\Models\RateSheet;
use App\Services\Matching\MatchingEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function assessedApplication(array $overrides = []): Application
{
    return Application::factory()
        ->withCompleteFinancials()
        ->atStage(ApplicationStage::Assessment)
        ->create($overrides);
}

it('passes lenders whose rules fit and fails those that do not, citing the clause', function () {
    $fits = Lender::factory()->withPolicy(LoanPack::Home, homeLoanRules(maxLvr: 90))->create(['name' => 'Fits Bank']);
    $tooStrict = Lender::factory()->withPolicy(LoanPack::Home, homeLoanRules(maxLvr: 70))->create(['name' => 'Strict Bank']);

    $run = app(MatchingEngine::class)->run(assessedApplication());

    $results = $run->results->keyBy('lender_id');
    expect($results[$fits->id]->outcome)->toBe(MatchOutcome::Pass)
        ->and($results[$tooStrict->id]->outcome)->toBe(MatchOutcome::Fail);

    $failedRule = collect($results[$tooStrict->id]->rule_results)->firstWhere('id', 'LVR-1');
    expect($failedRule['outcome'])->toBe('fail')
        ->and($failedRule['actual'])->toEqual(75)
        ->and($failedRule['clause'])->toBe('Credit policy §3.1 Maximum LVR 70%');
});

it('marks unmapped lenders and stale rate sheets as manual check instead of guessing', function () {
    $unmapped = Lender::factory()->withPolicy(LoanPack::Home, homeLoanRules())->create(['coverage' => LenderCoverage::Unmapped]);
    $stale = Lender::factory()->withPolicy(LoanPack::Home, homeLoanRules())->create();
    RateSheet::query()->whereRelation('product', 'lender_id', $stale->id)->update(['effective_from' => now()->subDays(400)]);

    $run = app(MatchingEngine::class)->run(assessedApplication());

    expect($run->results->pluck('outcome', 'lender_id')->all())->toEqual([
        $unmapped->id => MatchOutcome::Unsure,
        $stale->id => MatchOutcome::Unsure,
    ]);
});

it('fails serviceability when repayments at the assessment rate exceed income', function () {
    $lender = Lender::factory()->withPolicy(LoanPack::Home, homeLoanRules())->create();
    $application = assessedApplication();
    $application->setFact('income_annual', 45000, 'borrower_answer');
    $application->save();

    $result = app(MatchingEngine::class)->run($application)->results->firstWhere('lender_id', $lender->id);

    $serviceability = collect($result->rule_results)->firstWhere('id', 'SERV');
    expect($result->outcome)->toBe(MatchOutcome::Fail)
        ->and($serviceability['outcome'])->toBe('fail')
        ->and($result->serviceability['assessment_rate'])->toBe(9.2)
        ->and($result->serviceability['surplus'])->toBeLessThan(0);
});

it('ranks up to three distinct options with intent and cited explanations', function () {
    Lender::factory()->count(4)->withPolicy(LoanPack::Home, homeLoanRules())->create();

    $run = app(MatchingEngine::class)->run(assessedApplication());
    $shortlist = $run->shortlist()->get();

    expect($shortlist->pluck('rank')->all())->toBe([1, 2, 3])
        ->and($shortlist->pluck('intent')->all())->toBe(['best_overall', 'lowest_cost', 'highest_confidence'])
        ->and($shortlist->pluck('lender_id')->unique())->toHaveCount(3)
        ->and($shortlist->first()->explanation)->toContain('Credit policy §3.1');
});

it('asks for missing facts and routes the borrower to questions', function () {
    Lender::factory()->withPolicy(LoanPack::Home, homeLoanRules())->create();
    $application = assessedApplication();
    $application->data = collect($application->data)->except('property_value')->all();
    $application->save();

    $run = app(MatchingEngine::class)->run($application);

    expect($run->results->first()->outcome)->toBe(MatchOutcome::Unsure)
        ->and($application->fresh()->stage)->toBe(ApplicationStage::Questions)
        ->and($application->gaps()->where('status', GapStatus::Open)->pluck('field')->all())->toBe(['property_value']);
});

it('moves straight to the reveal when nothing is missing', function () {
    Lender::factory()->withPolicy(LoanPack::Home, homeLoanRules())->create();
    $application = assessedApplication();

    app(MatchingEngine::class)->run($application);

    expect($application->fresh()->stage)->toBe(ApplicationStage::Reveal)
        ->and($application->gaps()->count())->toBe(0);
});

it('reuses the stored run when the scenario and policy versions are unchanged', function () {
    Lender::factory()->withPolicy(LoanPack::Home, homeLoanRules())->create();
    $application = assessedApplication();
    $engine = app(MatchingEngine::class);

    $first = $engine->run($application);
    $second = $engine->run($application);

    expect($second->id)->toBe($first->id)
        ->and($application->matchRuns()->count())->toBe(1)
        ->and($application->events()->where('type', 'assessment.started')->count())->toBe(2);
});

it('emits one evaluating and one result event per lender, in order, for the visualisation', function () {
    $lenders = Lender::factory()->count(2)->withPolicy(LoanPack::Home, homeLoanRules())->create();
    $application = assessedApplication();

    app(MatchingEngine::class)->run($application);

    $types = $application->events()->orderBy('id')->pluck('type')->all();
    expect($types)->toBe([
        'assessment.started',
        'assessment.ingesting',
        'lender.evaluating', 'lender.result',
        'lender.evaluating', 'lender.result',
        'ranking.ready',
        'assessment.completed',
    ])
        ->and($application->events()->where('type', 'lender.result')->get()->pluck('payload.lender_id')->sort()->values()->all())
        ->toBe($lenders->pluck('id')->sort()->values()->all());
});
