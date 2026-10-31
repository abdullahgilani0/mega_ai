<?php

namespace App\Http\Controllers\Broker;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Services\ApplicationTimeline;
use App\Services\AuditLogger;
use App\Support\ApplicationDossier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    public function show(Application $application, AuditLogger $audit): Response
    {
        abort_unless(Gate::allows('work', $application), 404);
        $audit->record('application.viewed', $application, reason: 'Allocated broker');

        return Inertia::render('broker/application', [
            'dossier' => ApplicationDossier::build($application, staffView: false),
            'statuses' => array_map(fn (ApplicationStatus $status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ], ApplicationStatus::brokerUpdatable()),
        ]);
    }

    /**
     * The broker reviews the AI shortlist (taking responsibility for the recommendation)
     * and records lender progress.
     */
    public function update(Request $request, Application $application, ApplicationTimeline $timeline, AuditLogger $audit): RedirectResponse
    {
        abort_unless(Gate::allows('work', $application), 404);

        $validated = $request->validate([
            'status' => ['sometimes', Rule::enum(ApplicationStatus::class)->only(ApplicationStatus::brokerUpdatable())],
            'reviewed' => ['sometimes', 'accepted'],
        ]);

        $before = ['status' => $application->status->value, 'broker_reviewed_at' => $application->broker_reviewed_at];

        if (isset($validated['reviewed'])) {
            $application->broker_reviewed_at = now();
            $timeline->record($application, 'broker.reviewed');
        }

        if (isset($validated['status'])) {
            $application->status = ApplicationStatus::from($validated['status']);
            $timeline->record($application, 'status.updated', ['label' => $application->status->label()]);
        }

        $application->save();
        $audit->record('application.broker_updated', $application, $before, ['status' => $application->status->value, 'broker_reviewed_at' => $application->broker_reviewed_at]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Application updated.']);

        return back();
    }
}
