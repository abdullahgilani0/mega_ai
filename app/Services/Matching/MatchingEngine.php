<?php

namespace App\Services\Matching;

use App\Enums\ApplicationStage;
use App\Enums\GapStatus;
use App\Enums\LenderCoverage;
use App\Enums\LoanPack;
use App\Enums\MatchOutcome;
use App\Models\Application;
use App\Models\Lender;
use App\Models\MatchResult;
use App\Models\MatchRun;
use App\Services\ApplicationTimeline;
use App\Services\AuditLogger;
use App\Services\CreditCheckService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Evaluates every active lender for the application's loan pack, entirely in code:
 * knockouts, serviceability, pricing, scoring, then a top three with distinct intent.
 * Language models never decide pass or fail.
 */
class MatchingEngine
{
    private const PREFERRED_FEATURES = [
        'home' => ['offset', 'redraw', 'extra_repayments', 'family_guarantee'],
        'asset' => ['no_early_exit_fee', 'balloon', 'extra_repayments'],
        'personal' => ['no_early_exit_fee', 'extra_repayments', 'redraw'],
        'business' => ['revolving', 'extra_repayments', 'low_doc'],
    ];

    private const COST_HORIZON_YEARS = 5;

    public function __construct(
        private ScenarioBuilder $scenarios,
        private RuleEvaluator $rules,
        private ServiceabilityCalculator $serviceability,
        private ExplanationWriter $explanations,
        private GapGenerator $gaps,
        private CreditCheckService $creditCheck,
        private ApplicationTimeline $timeline,
        private AuditLogger $audit,
    ) {}

    public function run(Application $application): MatchRun
    {
        $this->creditCheck->runIfReady($application);
        $application->refresh();

        $pack = $application->loan_pack;
        $scenario = $this->scenarios->build($application);
        $hash = $this->scenarios->hash($scenario);
        $lenders = $this->lendersFor($pack);
        $policyVersions = $lenders->mapWithKeys(fn (Lender $lender) => [$lender->id => $lender->publishedPolicyFor($pack)?->id])->all();

        $cached = $application->matchRuns()->where('scenario_hash', $hash)->latest('id')->first();

        if ($cached && $cached->policy_versions == $policyVersions) {
            $openGaps = $application->gaps()->where('status', GapStatus::Open)->count();
            $this->emitEvents($application, $cached, $openGaps, cached: true);
            $this->moveStage($application, $openGaps);

            return $cached;
        }

        $run = DB::transaction(function () use ($application, $scenario, $hash, $lenders, $policyVersions, $pack) {
            $run = $application->matchRuns()->create([
                'scenario_hash' => $hash,
                'scenario' => $scenario,
                'policy_versions' => $policyVersions,
                'lenders_total' => $lenders->count(),
                'started_at' => now(),
            ]);

            $results = $lenders->map(fn (Lender $lender) => $run->results()->create([
                'lender_id' => $lender->id,
                ...$this->evaluateLender($lender, $scenario, $pack),
            ])->setRelation('lender', $lender));

            $this->rank($results, $scenario, $pack);

            $run->update([
                'lenders_passed' => $results->where('outcome', MatchOutcome::Pass)->count(),
                'completed_at' => now(),
            ]);

            return $run;
        });

        $openGaps = $this->gaps->generate($application, $run);
        $this->emitEvents($application, $run, $openGaps, cached: false);
        $this->moveStage($application, $openGaps);

        $this->audit->record('assessment.completed', $application, after: [
            'match_run_id' => $run->id,
            'scenario_hash' => $hash,
            'passed' => $run->lenders_passed,
            'open_gaps' => $openGaps,
        ]);

        return $run;
    }

    /**
     * @return Collection<int, Lender>
     */
    private function lendersFor(LoanPack $pack): Collection
    {
        return Lender::query()
            ->where('status', 'active')
            ->whereHas('products', fn ($query) => $query->where('loan_pack', $pack))
            ->with([
                'products' => fn ($query) => $query->where('loan_pack', $pack)->with('rateSheets'),
                'policyVersions' => fn ($query) => $query->where('loan_pack', $pack)->where('status', 'published'),
            ])
            ->orderBy('name')
            ->get();
    }

    /**
     * @param  array<string, mixed>  $scenario
     * @return array<string, mixed>
     */
    private function evaluateLender(Lender $lender, array $scenario, LoanPack $pack): array
    {
        $product = $lender->products->first();
        $policy = $lender->publishedPolicyFor($pack);

        if ($policy === null || $lender->coverage === LenderCoverage::Unmapped) {
            return [
                'lender_product_id' => $product?->id,
                'outcome' => MatchOutcome::Unsure,
                'rule_results' => [$this->synthetic('POLICY', 'Lender policy', 'Manual check needed: this lender\'s policy is not mapped yet.', 'unsure')],
            ];
        }

        $ruleResults = array_map(fn (array $rule) => $this->rules->evaluate($rule, $scenario), $policy->rules);

        $sheet = $product?->currentRateSheet();
        $band = null;

        if ($sheet === null || $sheet->isStale()) {
            $ruleResults[] = $this->synthetic('RATE', 'Current pricing', 'Rate sheet is older than '.config('mega.matching.max_rate_age_days').' days. Confirm pricing with the lender.', 'unsure');
        } else {
            $band = $sheet->bandFor($scenario['lvr']);
            if ($band === null) {
                $ruleResults[] = $this->synthetic('RATE-LVR', 'Priced LVR band', 'LVR is above the highest band on the current rate sheet.', 'fail', $scenario['lvr']);
            }
        }

        $service = null;
        if ($band !== null) {
            $shading = $scenario['employment_type'] === 'self_employed' ? 0.9 : 1.0;
            $service = $this->serviceability->assess($scenario, $band['rate_max'], $pack->serviceabilityBuffer(), $shading);

            $ruleResults[] = $service === null
                ? $this->synthetic('SERV', 'Serviceability', 'Needs your income, living costs, other debts and dependants.', 'unsure')
                : $this->synthetic('SERV', 'Serviceability', 'Repayments tested at '.number_format($service['assessment_rate'], 2).'% (indicative rate plus a '.number_format($pack->serviceabilityBuffer(), 2).'% buffer).', $service['surplus'] >= 0 ? 'pass' : 'fail', $service['surplus'], 0);
        }

        $outcomes = array_column($ruleResults, 'outcome');
        $outcome = match (true) {
            in_array('fail', $outcomes, true) => MatchOutcome::Fail,
            in_array('unsure', $outcomes, true) => MatchOutcome::Unsure,
            default => MatchOutcome::Pass,
        };

        return [
            'lender_product_id' => $product?->id,
            'policy_version_id' => $policy->id,
            'outcome' => $outcome,
            'rule_results' => $ruleResults,
            'serviceability' => $service,
            'approval_confidence' => $outcome === MatchOutcome::Pass ? $this->confidence($lender, $ruleResults, $service) : null,
            'rate_min' => $band['rate_min'] ?? null,
            'rate_max' => $band['rate_max'] ?? null,
            'rate_effective_from' => $band ? $sheet?->effective_from : null,
            'fees' => $band ? $sheet?->fees : null,
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $ruleResults
     * @param  array<string, mixed>|null  $service
     */
    private function confidence(Lender $lender, array $ruleResults, ?array $service): float
    {
        $confidence = 55 + min(25, max(0, ($service['headroom_ratio'] ?? 0) * 100));

        $credit = collect($ruleResults)->firstWhere('field', 'credit_score');
        if ($credit && is_numeric($credit['actual']) && is_numeric($credit['required'])) {
            $confidence += min(15, max(0, ($credit['actual'] - $credit['required']) / 5));
        }

        if ($lender->coverage === LenderCoverage::Partial) {
            $confidence -= 15;
        }

        return round(max(1, min(99, $confidence)), 2);
    }

    /**
     * Score every pass, then pick three meaningfully different options.
     *
     * @param  Collection<int, MatchResult>  $results
     * @param  array<string, mixed>  $scenario
     */
    private function rank(Collection $results, array $scenario, LoanPack $pack): void
    {
        $passes = $results->where('outcome', MatchOutcome::Pass)->values();

        if ($passes->isEmpty()) {
            return;
        }

        $effective = $passes->mapWithKeys(fn (MatchResult $result) => [$result->id => $this->effectiveRate($result, (float) $scenario['amount'])]);
        [$cheapest, $dearest] = [$effective->min(), $effective->max()];
        $weights = config('mega.matching.weights');
        $preferred = self::PREFERRED_FEATURES[$pack->value];

        foreach ($passes as $result) {
            $cost = $dearest > $cheapest ? ($dearest - $effective[$result->id]) / ($dearest - $cheapest) : 1.0;
            $speed = max(0, 1 - ($result->lender->turnaround_days - 1) / 14);
            $features = $result->lender_product_id === null ? [] : $result->product->features;
            $fit = count(array_intersect($features, $preferred)) / count($preferred);

            $result->score = round(100 * (
                $weights['approval_confidence'] * $result->approval_confidence / 100
                + $weights['cost'] * $cost
                + $weights['speed'] * $speed
                + $weights['feature_fit'] * $fit
            ), 2);
        }

        $remaining = $passes->keyBy('id');
        $picks = [];

        $pick = function (string $intent, callable $selector) use (&$remaining, &$picks) {
            if ($remaining->isEmpty()) {
                return;
            }
            $chosen = $selector($remaining);
            $picks[] = [$chosen, $intent];
            $remaining->forget($chosen->id);
        };

        $pick('best_overall', fn (Collection $pool) => $pool->sortByDesc('score')->first());
        $pick('lowest_cost', fn (Collection $pool) => $pool->sortBy(fn (MatchResult $result) => $effective[$result->id])->first());
        $pick('highest_confidence', fn (Collection $pool) => $pool->sortByDesc('approval_confidence')->first());

        foreach ($passes as $result) {
            $result->save();
        }

        foreach ($picks as $index => [$result, $intent]) {
            $result->rank = $index + 1;
            $result->intent = $intent;
            $result->explanation = $this->explanations->write($result);
            $result->save();
        }
    }

    /**
     * Indicative rate plus fees spread over a standard horizon, as a yearly percentage.
     */
    private function effectiveRate(MatchResult $result, float $amount): float
    {
        $fees = ($result->fees['establishment'] ?? 0) + ($result->fees['annual'] ?? 0) * self::COST_HORIZON_YEARS;

        return $result->rate_min + ($fees / max(1, $amount) * 100) / self::COST_HORIZON_YEARS;
    }

    /**
     * @return array{id: string, label: string, clause: string, field: string, op: string, outcome: string, actual: mixed, required: mixed}
     */
    private function synthetic(string $id, string $label, string $clause, string $outcome, mixed $actual = null, mixed $required = null): array
    {
        return [
            'id' => $id,
            'label' => $label,
            'clause' => $clause,
            'field' => strtolower($id),
            'op' => 'gte',
            'outcome' => $outcome,
            'actual' => $actual,
            'required' => $required,
        ];
    }

    /**
     * Every visual state of the MEGA scene maps to one of these real events.
     */
    private function emitEvents(Application $application, MatchRun $run, int $openGaps, bool $cached): void
    {
        $results = $run->results()->with('lender:id,name,brand_color,logo_usage_approved')->orderBy('id')->get();

        $events = [[
            'type' => 'assessment.started',
            'payload' => [
                'run_id' => $run->id,
                'cached' => $cached,
                'lenders_total' => $run->lenders_total,
                'lenders' => $results->map(fn (MatchResult $result) => [
                    'id' => $result->lender_id,
                    'name' => $result->lender->name,
                    'color' => $result->lender->brand_color,
                ])->values()->all(),
            ],
        ], [
            'type' => 'assessment.ingesting',
            'payload' => [
                'run_id' => $run->id,
                'documents' => $application->documents()->count(),
                'facts' => count(array_filter($run->scenario, fn ($value) => $value !== null && $value !== [])),
            ],
        ]];

        foreach ($results as $result) {
            $events[] = ['type' => 'lender.evaluating', 'payload' => ['run_id' => $run->id, 'lender_id' => $result->lender_id]];
            $events[] = ['type' => 'lender.result', 'payload' => ['run_id' => $run->id, 'lender_id' => $result->lender_id, 'outcome' => $result->outcome->value]];
        }

        if ($openGaps > 0) {
            $events[] = ['type' => 'gaps.created', 'payload' => ['run_id' => $run->id, 'count' => $openGaps]];
        }

        $events[] = ['type' => 'ranking.ready', 'payload' => [
            'run_id' => $run->id,
            'passed' => $run->lenders_passed,
            'shortlist' => $results->whereNotNull('rank')->sortBy('rank')->pluck('lender_id')->values()->all(),
        ]];

        $events[] = ['type' => 'assessment.completed', 'payload' => ['run_id' => $run->id, 'next' => $openGaps > 0 ? 'questions' : 'reveal']];

        $this->timeline->recordMany($application, $events);
    }

    private function moveStage(Application $application, int $openGaps): void
    {
        if ($application->stage->isAfter(ApplicationStage::Reveal)) {
            return;
        }

        $application->update(['stage' => $openGaps > 0 ? ApplicationStage::Questions : ApplicationStage::Reveal]);
    }
}
