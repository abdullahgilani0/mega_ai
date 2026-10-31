<?php

namespace App\Http\Controllers\Journey;

use App\Enums\ApplicationStage;
use App\Enums\ApplicationStatus;
use App\Enums\LoanPack;
use App\Http\Controllers\Controller;
use App\Http\Requests\Journey\PrequalRequest;
use App\Services\ApplicationTimeline;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PrequalController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('journey/start', [
            'loanPacks' => array_map(fn (LoanPack $pack) => [
                'value' => $pack->value,
                'label' => $pack->label(),
                'purposes' => PrequalRequest::PURPOSES[$pack->value],
            ], LoanPack::cases()),
            'states' => PrequalRequest::STATES,
            'employmentTypes' => PrequalRequest::EMPLOYMENT_TYPES,
        ]);
    }

    public function store(PrequalRequest $request, ApplicationTimeline $timeline, AuditLogger $audit): RedirectResponse
    {
        $pack = LoanPack::from($request->validated('loan_pack'));

        $application = $request->user()->applications()->create([
            ...$request->safe()->only(['purpose', 'amount', 'state', 'postcode', 'employment_type']),
            'loan_pack' => $pack,
            'is_joint' => $request->boolean('is_joint'),
            'term_years' => $pack->defaultTermYears(),
            'stage' => ApplicationStage::Consent,
            'status' => ApplicationStatus::InProgress,
        ]);

        $timeline->record($application, 'application.created', ['loan_pack' => $pack->value]);
        $audit->record('application.created', $application);

        return to_route('journey.consent', $application);
    }
}
