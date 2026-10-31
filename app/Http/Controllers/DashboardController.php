<?php

namespace App\Http\Controllers;

use App\Enums\Permission;
use App\Models\Application;
use App\Models\CoBorrower;
use App\Support\JourneyPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Send each role to its home: borrowers to their status dashboard, brokers to the
     * inbox, staff to the console.
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->hasPermission(Permission::WorkAllocatedApplications)) {
            return to_route('broker.inbox');
        }

        if ($user->hasPermission(Permission::AccessConsole)) {
            return to_route('admin.overview');
        }

        $jointIds = CoBorrower::where('user_id', $user->id)->whereNotNull('accepted_at')->pluck('application_id');
        $applications = Application::query()
            ->where(fn ($query) => $query->where('user_id', $user->id)->orWhereIn('id', $jointIds))
            ->with(['broker.user', 'selectedMatch.lender', 'signatures.template', 'coBorrowers.user', 'user'])
            ->latest('id')
            ->get();
        $active = $applications->first();
        $isOwner = $active?->user_id === $user->id;

        return Inertia::render('borrower/dashboard', [
            'applications' => $applications->map(fn (Application $application) => JourneyPresenter::summary($application)),
            'active' => $active ? [
                'summary' => JourneyPresenter::summary($active),
                'timeline' => JourneyPresenter::borrowerTimeline($active),
                'broker' => $active->broker ? [
                    'name' => $active->broker->user->name,
                    'business' => $active->broker->business_name,
                    'email' => $active->broker->user->email,
                    'languages' => $active->broker->languages,
                ] : null,
                'selectedLender' => $active->selectedMatch?->lender->name,
                'signatures' => $active->signatures->map(fn ($signature) => [
                    'id' => $signature->id,
                    'title' => $signature->template->title,
                    'signedAt' => $signature->signed_at->toIso8601String(),
                    'hash' => $signature->document_hash,
                ]),
                'isOwner' => $isOwner,
                'owner' => $active->user->name,
                'isJoint' => $active->is_joint,
                'coBorrowers' => $active->coBorrowers->map(fn (CoBorrower $coBorrower) => [
                    'email' => $coBorrower->email,
                    'name' => $coBorrower->user?->name,
                    'accepted' => $coBorrower->accepted_at !== null,
                ]),
                'messages' => MessageController::thread($active, $user->id),
            ] : null,
        ]);
    }
}
