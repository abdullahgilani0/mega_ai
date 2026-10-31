<?php

namespace App\Http\Controllers\Journey;

use App\Enums\ApplicationStage;
use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Services\ApplicationTimeline;
use App\Services\AuditLogger;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class JourneyController extends Controller
{
    /**
     * Authorise a journey action and make sure the borrower has reached the stage.
     */
    public static function guard(Application $application, ApplicationStage $stage): void
    {
        abort_unless($application->user_id === Auth::id(), 404);

        if (Gate::denies('continue', $application)) {
            throw new HttpResponseException(to_route('dashboard'));
        }

        if (! $application->hasReached($stage)) {
            throw new HttpResponseException(to_route($application->stage->routeName(), $application));
        }
    }

    /**
     * Resume wherever the borrower left off, on any device.
     */
    public function resume(Application $application): RedirectResponse
    {
        abort_unless($application->user_id === Auth::id(), 404);

        if ($application->stage === ApplicationStage::Submitted || $application->status !== ApplicationStatus::InProgress) {
            return to_route('dashboard');
        }

        return to_route($application->stage->routeName(), $application);
    }

    public function withdraw(Application $application, ApplicationTimeline $timeline, AuditLogger $audit): RedirectResponse
    {
        abort_unless($application->user_id === Auth::id(), 404);

        $application->update(['status' => ApplicationStatus::Withdrawn]);
        $timeline->record($application, 'application.withdrawn');
        $audit->record('application.withdrawn', $application);

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Your application has been withdrawn.']);

        return to_route('dashboard');
    }
}
