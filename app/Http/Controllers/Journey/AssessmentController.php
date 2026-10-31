<?php

namespace App\Http\Controllers\Journey;

use App\Enums\ApplicationStage;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\ApplicationEvent;
use App\Models\MatchRun;
use App\Services\Matching\MatchingEngine;
use App\Support\JourneyPresenter;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AssessmentController extends Controller
{
    public function show(Application $application): Response
    {
        JourneyController::guard($application, ApplicationStage::Assessment);

        $run = $application->latestMatchRun;

        return Inertia::render('journey/assessment', [
            'application' => JourneyPresenter::summary($application),
            'run' => $run ? ['id' => $run->id, 'total' => $run->lenders_total, 'passed' => $run->lenders_passed] : null,
            'events' => $run ? $this->eventsFor($application, $run) : [],
            'avatar' => $application->user->avatarIndex(),
            'next' => match ($application->stage) {
                ApplicationStage::Questions => 'questions',
                ApplicationStage::Assessment => null,
                default => 'reveal',
            },
        ]);
    }

    public function store(Application $application, MatchingEngine $engine): RedirectResponse
    {
        JourneyController::guard($application, ApplicationStage::Assessment);

        $engine->run($application);

        return to_route('journey.assessment', [$application, 'play' => 1]);
    }

    /**
     * The real events emitted by the most recent emission of this run, in order.
     *
     * @return list<array{id: int, type: string, payload: array<string, mixed>|null}>
     */
    private function eventsFor(Application $application, MatchRun $run): array
    {
        $startedId = $application->events()
            ->where('type', 'assessment.started')
            ->where('payload->run_id', $run->id)
            ->max('id');

        if ($startedId === null) {
            return [];
        }

        return array_values($application->events()
            ->where('id', '>=', $startedId)
            ->where('payload->run_id', $run->id)
            ->orderBy('id')
            ->get(['id', 'type', 'payload'])
            ->map(fn (ApplicationEvent $event) => ['id' => $event->id, 'type' => $event->type, 'payload' => $event->payload])
            ->all());
    }
}
