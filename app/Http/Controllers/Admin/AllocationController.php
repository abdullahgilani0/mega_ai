<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AllocationStatus;
use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Allocation;
use App\Models\Application;
use App\Models\Broker;
use App\Services\Allocation\AllocationEngine;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AllocationController extends Controller
{
    public function index(AllocationEngine $engine): Response
    {
        $waiting = Application::whereIn('status', [ApplicationStatus::Unallocated, ApplicationStatus::Allocating])
            ->with('user:id,name')
            ->latest('submitted_at')
            ->get();

        return Inertia::render('admin/allocations', [
            'queue' => $waiting->map(fn (Application $application) => [
                'id' => $application->public_id,
                'borrower' => $application->user->name,
                'loanPackLabel' => $application->loan_pack->label(),
                'region' => $application->state.' '.$application->postcode,
                'status' => $application->status->value,
                'statusLabel' => $application->status->label(),
                'submittedAt' => $application->submitted_at?->toIso8601String(),
                'candidates' => $engine->rankCandidates($application)->take(5)->map(fn (array $candidate) => [
                    'brokerId' => $candidate['broker']->id,
                    'name' => $candidate['broker']->user->name,
                    'score' => $candidate['score'],
                    'reasons' => $candidate['reasons'],
                ])->values(),
            ]),
            'brokers' => Broker::with('user:id,name')->where('status', 'active')->get()->map(fn (Broker $broker) => [
                'id' => $broker->id,
                'name' => $broker->user->name,
            ]),
            'recent' => Allocation::with(['broker.user:id,name', 'application:id,public_id,loan_pack,state,postcode'])
                ->latest('id')
                ->limit(25)
                ->get()
                ->map(fn (Allocation $allocation) => [
                    'id' => $allocation->id,
                    'applicationId' => $allocation->application->public_id,
                    'loanPackLabel' => $allocation->application->loan_pack->label(),
                    'region' => $allocation->application->state.' '.$allocation->application->postcode,
                    'broker' => $allocation->broker->user->name,
                    'status' => $allocation->status->value,
                    'score' => $allocation->score,
                    'offeredAt' => $allocation->offered_at->toIso8601String(),
                    'minutesToRespond' => $allocation->responded_at && $allocation->status !== AllocationStatus::Reassigned
                        ? (int) $allocation->offered_at->diffInMinutes($allocation->responded_at)
                        : null,
                ]),
        ]);
    }

    public function reassign(Request $request, Application $application, AllocationEngine $engine): RedirectResponse
    {
        $validated = $request->validate([
            'broker_id' => ['required', 'exists:brokers,id'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $engine->reassign($application, Broker::findOrFail($request->integer('broker_id')), $validated['reason']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Application assigned.']);

        return back();
    }
}
