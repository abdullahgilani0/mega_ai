<?php

namespace App\Http\Controllers\Journey;

use App\Enums\ApplicationStage;
use App\Enums\ConsentType;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Lender;
use App\Services\ApplicationTimeline;
use App\Services\AuditLogger;
use App\Support\JourneyPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConsentController extends Controller
{
    public function show(Application $application): Response
    {
        JourneyController::guard($application, ApplicationStage::Consent);

        $granted = $application->consents()->whereNull('revoked_at')->pluck('type')->map(fn (ConsentType $type) => $type->value);

        return Inertia::render('journey/consent', [
            'application' => JourneyPresenter::summary($application),
            'consents' => array_map(fn (ConsentType $type) => [
                'type' => $type->value,
                'title' => $type->title(),
                'description' => $type->description(),
                'required' => $type->isRequired(),
                'granted' => $granted->contains($type->value),
            ], ConsentType::cases()),
            'textVersion' => ConsentType::TEXT_VERSION,
            'typicalLenders' => $this->typicalLenderCount($application),
        ]);
    }

    public function store(Request $request, Application $application, ApplicationTimeline $timeline, AuditLogger $audit): RedirectResponse
    {
        JourneyController::guard($application, ApplicationStage::Consent);

        $rules = [];
        foreach (ConsentType::cases() as $type) {
            $rules['consents.'.$type->value] = $type->isRequired() ? ['accepted'] : ['boolean'];
        }

        $validated = $request->validate($rules, [
            'consents.*.accepted' => 'This consent is needed to continue.',
        ]);

        $granted = [];
        foreach (ConsentType::cases() as $type) {
            if (! filter_var($validated['consents'][$type->value] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                continue;
            }

            $application->consents()->firstOrCreate(
                ['type' => $type, 'revoked_at' => null],
                [
                    'user_id' => $request->user()->id,
                    'text_version' => ConsentType::TEXT_VERSION,
                    'granted_at' => now(),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ],
            );
            $granted[] = $type->value;
        }

        $timeline->record($application, 'consent.granted', ['types' => $granted]);
        $audit->record('consent.granted', $application, after: ['types' => $granted, 'text_version' => ConsentType::TEXT_VERSION]);

        $application->advanceTo(ApplicationStage::Identity);

        return to_route('journey.identity', $application);
    }

    /**
     * Value before the heavy steps: how many panel lenders lend for this profile.
     */
    private function typicalLenderCount(Application $application): int
    {
        return Lender::where('status', 'active')
            ->whereHas('products', fn ($query) => $query->where('loan_pack', $application->loan_pack))
            ->count();
    }
}
