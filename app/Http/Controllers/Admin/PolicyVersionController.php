<?php

namespace App\Http\Controllers\Admin;

use App\Enums\LoanPack;
use App\Http\Controllers\Controller;
use App\Models\Lender;
use App\Models\PolicyVersion;
use App\Services\AuditLogger;
use App\Services\Matching\GoldenScenarioRunner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Versioned structured policy. Published versions are immutable; changes go through a
 * draft that a second person approves (four-eyes) before it goes live.
 */
class PolicyVersionController extends Controller
{
    public function store(Request $request, Lender $lender, AuditLogger $audit): RedirectResponse
    {
        $validated = $request->validate(['loan_pack' => ['required', Rule::enum(LoanPack::class)]]);
        $pack = LoanPack::from($validated['loan_pack']);

        $latest = $lender->policyVersions()->where('loan_pack', $pack)->orderByDesc('version')->first();
        abort_if($latest === null, 404);

        if ($latest->status === 'draft') {
            throw ValidationException::withMessages(['loan_pack' => 'A draft already exists for this loan pack.']);
        }

        $draft = $lender->policyVersions()->create([
            'loan_pack' => $pack,
            'version' => $latest->version + 1,
            'rules' => $latest->rules,
            'status' => 'draft',
            'source_document' => $latest->source_document,
            'created_by' => $request->user()->id,
        ]);

        $audit->record('policy.draft_created', $draft, after: ['from_version' => $latest->version]);

        return back();
    }

    public function update(Request $request, PolicyVersion $policyVersion, AuditLogger $audit): RedirectResponse
    {
        abort_unless($policyVersion->status === 'draft', 409, 'Published policy versions are immutable.');

        $validated = $request->validate([
            'rules' => ['required', 'array', 'size:'.count($policyVersion->rules)],
            'rules.*.value' => ['required'],
            'rules.*.clause' => ['required', 'string', 'max:255'],
        ]);

        $rules = collect($policyVersion->rules)->map(function (array $rule, int $index) use ($validated) {
            $value = $validated['rules'][$index]['value'];

            return [
                ...$rule,
                'value' => in_array($rule['op'], ['in', 'not_in'], true) ? array_values(array_filter((array) $value)) : (float) $value,
                'clause' => $validated['rules'][$index]['clause'],
            ];
        })->all();

        $audit->record('policy.draft_edited', $policyVersion, ['rules' => $policyVersion->rules], ['rules' => $rules]);
        $policyVersion->update(['rules' => $rules]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Draft saved.']);

        return back();
    }

    public function publish(Request $request, PolicyVersion $policyVersion, AuditLogger $audit, GoldenScenarioRunner $golden): RedirectResponse
    {
        abort_unless($policyVersion->status === 'draft', 409);

        if ($policyVersion->created_by === $request->user()->id) {
            throw ValidationException::withMessages(['publish' => 'A second credit analyst must approve this draft before it goes live.']);
        }

        $failures = $golden->failures($policyVersion);

        if ($failures !== []) {
            throw ValidationException::withMessages([
                'publish' => 'Golden scenarios failed: '.collect($failures)
                    ->map(fn (array $failure) => "{$failure['scenario']} expected {$failure['expected']}, got {$failure['actual']}")
                    ->implode('; ').'.',
            ]);
        }

        DB::transaction(function () use ($policyVersion, $request) {
            PolicyVersion::where('lender_id', $policyVersion->lender_id)
                ->where('loan_pack', $policyVersion->loan_pack)
                ->where('status', 'published')
                ->update(['status' => 'retired']);

            $policyVersion->update([
                'status' => 'published',
                'approved_by' => $request->user()->id,
                'published_at' => now(),
            ]);

            $policyVersion->lender->update(['last_reviewed_at' => now()]);
        });

        $audit->record('policy.published', $policyVersion, after: ['version' => $policyVersion->version]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Version '.$policyVersion->version.' is live. New assessments use it immediately.']);

        return back();
    }
}
