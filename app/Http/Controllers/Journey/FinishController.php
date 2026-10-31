<?php

namespace App\Http\Controllers\Journey;

use App\Enums\ApplicationStage;
use App\Http\Controllers\Controller;
use App\Http\Resources\MatchResultResource;
use App\Models\Application;
use App\Models\DisclosureTemplate;
use App\Services\Allocation\AllocationEngine;
use App\Services\ApplicationTimeline;
use App\Services\AuditLogger;
use App\Support\JourneyPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class FinishController extends Controller
{
    public function show(Application $application): Response
    {
        JourneyController::guard($application, ApplicationStage::Finish);

        $selected = $application->selectedMatch?->load(['lender', 'product', 'policyVersion']);

        return Inertia::render('journey/finish', [
            'application' => JourneyPresenter::summary($application),
            'selected' => $selected ? (new MatchResultResource($selected))->resolve() : null,
            'documentCount' => $application->documents()->count(),
            'signatures' => $application->signatures()->with('template:id,title')->get()->map(fn ($signature) => [
                'title' => $signature->template->title,
                'signedAt' => $signature->signed_at->toIso8601String(),
            ]),
            'openQuestions' => $application->gaps()->where('status', 'escalated')->count(),
        ]);
    }

    public function store(Application $application, AllocationEngine $allocation, ApplicationTimeline $timeline, AuditLogger $audit): RedirectResponse
    {
        JourneyController::guard($application, ApplicationStage::Finish);

        $unsigned = DisclosureTemplate::current()->whereNotIn('id', $application->signatures()->pluck('disclosure_template_id'))->exists();

        if ($unsigned) {
            throw ValidationException::withMessages(['signatures' => 'Please sign every document first.']);
        }

        $application->update(['submitted_at' => now(), 'stage' => ApplicationStage::Submitted]);
        $timeline->record($application, 'application.submitted');
        $audit->record('application.submitted', $application);

        $allocation->offerNext($application);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Submitted. We are matching you with a local broker now.']);

        return to_route('dashboard');
    }
}
