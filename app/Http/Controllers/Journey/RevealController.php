<?php

namespace App\Http\Controllers\Journey;

use App\Enums\ApplicationStage;
use App\Enums\MatchOutcome;
use App\Http\Controllers\Controller;
use App\Http\Resources\MatchResultResource;
use App\Models\Application;
use App\Models\MatchResult;
use App\Services\ApplicationTimeline;
use App\Services\AuditLogger;
use App\Support\JourneyPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RevealController extends Controller
{
    public function show(Application $application, ApplicationTimeline $timeline): Response
    {
        JourneyController::guard($application, ApplicationStage::Reveal);

        $run = $application->latestMatchRun;
        abort_if($run === null, 404);

        $alreadyRevealed = $application->events()->where('type', 'reveal.start')->where('payload->run_id', $run->id)->exists();
        if (! $alreadyRevealed) {
            $timeline->record($application, 'reveal.start', ['run_id' => $run->id]);
        }

        $shortlist = $run->shortlist()->with(['lender', 'product', 'policyVersion'])->get();

        return Inertia::render('journey/reveal', [
            'application' => JourneyPresenter::summary($application),
            'matches' => MatchResultResource::collection($shortlist)->resolve(),
            'counts' => [
                'total' => $run->lenders_total,
                'passed' => $run->lenders_passed,
                'manualCheck' => $run->results()->where('outcome', MatchOutcome::Unsure)->count(),
            ],
            'selectedId' => $application->selected_match_result_id,
            'playReveal' => ! $alreadyRevealed,
        ]);
    }

    public function select(Request $request, Application $application, ApplicationTimeline $timeline, AuditLogger $audit): RedirectResponse
    {
        JourneyController::guard($application, ApplicationStage::Reveal);

        $validated = $request->validate(['match_result_id' => ['nullable', 'integer']]);
        $result = null;

        if ($validated['match_result_id'] ?? null) {
            $result = MatchResult::query()
                ->whereKey($validated['match_result_id'])
                ->where('match_run_id', $application->latestMatchRun?->id)
                ->whereNotNull('rank')
                ->firstOrFail();
        }

        $application->update(['selected_match_result_id' => $result?->id]);
        $timeline->record($application, 'match.selected', ['label' => $result?->lender->name ?? 'Broker to recommend']);
        $audit->record('match.selected', $application, after: ['match_result_id' => $result?->id]);

        $application->advanceTo(ApplicationStage::Sign);

        return to_route('journey.sign', $application);
    }
}
