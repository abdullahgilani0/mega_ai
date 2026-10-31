<?php

namespace App\Http\Controllers\Admin;

use App\Enums\LoanPack;
use App\Enums\MatchOutcome;
use App\Http\Controllers\Controller;
use App\Models\GoldenScenario;
use App\Models\Lender;
use App\Services\AuditLogger;
use App\Services\Matching\GoldenScenarioRunner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GoldenScenarioController extends Controller
{
    /**
     * Scenario fields an analyst can set, by loan pack.
     */
    public const FIELDS = [
        'amount', 'property_value', 'asset_price', 'asset_age_years', 'income_annual', 'credit_score',
        'employment_type', 'employment_months', 'time_in_business_months', 'annual_turnover', 'purpose',
    ];

    public function index(GoldenScenarioRunner $runner): Response
    {
        $lenders = Lender::with(['policyVersions' => fn ($query) => $query->where('status', 'published')])->orderBy('name')->get();

        return Inertia::render('admin/golden-scenarios', [
            'scenarios' => GoldenScenario::orderBy('loan_pack')->orderBy('name')->get()->map(function (GoldenScenario $scenario) use ($lenders, $runner) {
                return [
                    'id' => $scenario->id,
                    'name' => $scenario->name,
                    'loanPack' => $scenario->loan_pack->value,
                    'scenario' => $scenario->scenario,
                    'results' => collect($scenario->expectations)->map(function (string $expected, int|string $lenderId) use ($lenders, $scenario, $runner) {
                        $lender = $lenders->firstWhere('id', (int) $lenderId);
                        $policy = $lender?->publishedPolicyFor($scenario->loan_pack);
                        [$actual] = $policy ? $runner->outcome($policy, $scenario->scenario) : ['no policy'];

                        return [
                            'lender' => $lender->name ?? 'Deleted lender',
                            'expected' => $expected,
                            'actual' => $actual,
                            'ok' => $actual === $expected,
                        ];
                    })->values(),
                ];
            }),
            'lenders' => $lenders->map(fn (Lender $lender) => ['id' => $lender->id, 'name' => $lender->name]),
            'fields' => self::FIELDS,
            'packs' => array_map(fn (LoanPack $pack) => ['value' => $pack->value, 'label' => $pack->label()], LoanPack::cases()),
        ]);
    }

    public function store(Request $request, AuditLogger $audit): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'loan_pack' => ['required', Rule::enum(LoanPack::class)],
            'scenario' => ['required', 'array'],
            'scenario.amount' => ['required', 'numeric', 'min:1'],
            'scenario.*' => ['nullable'],
            'expectations' => ['required', 'array', 'min:1'],
            'expectations.*.lender_id' => ['required', 'exists:lenders,id'],
            'expectations.*.outcome' => ['required', Rule::enum(MatchOutcome::class)],
        ]);

        $scenario = [];

        foreach (Arr::only($validated['scenario'], self::FIELDS) as $key => $value) {
            if ($value !== null && $value !== '') {
                $scenario[$key] = in_array($key, ['employment_type', 'purpose'], true) ? (string) $value : (float) $value;
            }
        }

        $expectations = [];

        foreach ($validated['expectations'] as $row) {
            $expectations[(string) $row['lender_id']] = (string) $row['outcome'];
        }

        $golden = GoldenScenario::create([
            'name' => $validated['name'],
            'loan_pack' => $validated['loan_pack'],
            'scenario' => $scenario,
            'expectations' => $expectations,
            'created_by' => $request->user()->id,
        ]);

        $audit->record('golden.created', $golden);

        return back();
    }

    public function destroy(GoldenScenario $goldenScenario, AuditLogger $audit): RedirectResponse
    {
        $audit->record('golden.deleted', $goldenScenario, before: ['name' => $goldenScenario->name]);
        $goldenScenario->delete();

        return back();
    }
}
