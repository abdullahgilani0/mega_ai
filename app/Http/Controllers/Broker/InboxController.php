<?php

namespace App\Http\Controllers\Broker;

use App\Enums\AllocationStatus;
use App\Enums\GapStatus;
use App\Http\Controllers\Controller;
use App\Models\Allocation;
use App\Models\Application;
use App\Services\Allocation\AllocationEngine;
use App\Support\JourneyPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InboxController extends Controller
{
    public function index(Request $request): Response
    {
        $broker = $request->user()->broker;
        abort_if($broker === null, 403, 'No broker profile is linked to this account.');

        return Inertia::render('broker/inbox', [
            'broker' => [
                'name' => $request->user()->name,
                'business' => $broker->business_name,
                'capacity' => $broker->capacity,
                'open' => $broker->openApplicationCount(),
                'status' => $broker->status,
                'territories' => $broker->territories()->pluck('name'),
            ],
            'offers' => $broker->allocations()
                ->where('status', AllocationStatus::Offered)
                ->where('expires_at', '>', now())
                ->with('application')
                ->latest('id')
                ->get()
                ->map(fn (Allocation $allocation) => [
                    'id' => $allocation->id,
                    'loanPackLabel' => $allocation->application->loan_pack->label(),
                    'amount' => $allocation->application->amount,
                    'region' => $allocation->application->state.' '.$allocation->application->postcode,
                    'expiresAt' => $allocation->expires_at->toIso8601String(),
                    'score' => $allocation->score,
                    'reasons' => $allocation->reasons,
                ]),
            'applications' => $broker->applications()
                ->with('user:id,name')
                ->withCount(['gaps as escalated_count' => fn ($query) => $query->where('status', GapStatus::Escalated)])
                ->latest('updated_at')
                ->get()
                ->map(fn (Application $application) => [
                    ...JourneyPresenter::summary($application),
                    'borrowerName' => $application->user->name,
                    'escalated' => $application->escalated_count,
                    'reviewed' => $application->broker_reviewed_at !== null,
                ]),
        ]);
    }

    public function accept(Request $request, Allocation $allocation, AllocationEngine $engine): RedirectResponse
    {
        $this->authorizeOffer($request, $allocation);
        $engine->accept($allocation);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Accepted. Please contact the borrower within one business day.']);

        return to_route('broker.applications.show', $allocation->application);
    }

    public function decline(Request $request, Allocation $allocation, AllocationEngine $engine): RedirectResponse
    {
        $this->authorizeOffer($request, $allocation);
        $reason = $request->validate(['reason' => ['nullable', 'string', 'max:255']])['reason'] ?? null;

        $engine->decline($allocation, $reason);

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Declined. The application has moved to the next broker.']);

        return to_route('broker.inbox');
    }

    private function authorizeOffer(Request $request, Allocation $allocation): void
    {
        abort_unless($allocation->broker_id === $request->user()->broker?->id, 404);
    }
}
