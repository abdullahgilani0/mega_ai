<?php

namespace App\Http\Controllers\Broker;

use App\Http\Controllers\Controller;
use App\Models\Territory;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The broker's own profile and availability. Licence, territories and capacity are
 * managed by admins; the broker controls availability and languages.
 */
class ProfileController extends Controller
{
    public function show(Request $request): Response
    {
        $broker = $request->user()->broker;
        abort_if($broker === null, 403);

        return Inertia::render('broker/profile', [
            'profile' => [
                'name' => $request->user()->name,
                'business' => $broker->business_name,
                'licenceRef' => $broker->licence_ref,
                'status' => $broker->status,
                'languages' => $broker->languages,
                'skills' => $broker->skills,
                'loanPacks' => $broker->loan_packs,
                'capacity' => $broker->capacity,
                'open' => $broker->openApplicationCount(),
                'acceptanceRate' => $broker->acceptance_rate,
                'avgFirstContactMinutes' => $broker->avg_first_contact_minutes,
                'territories' => $broker->territories->map(fn (Territory $territory) => [
                    'name' => $territory->name,
                    'coverage' => $territory->pivot->coverage,
                ]),
            ],
        ]);
    }

    public function update(Request $request, AuditLogger $audit): RedirectResponse
    {
        $broker = $request->user()->broker;
        abort_if($broker === null, 403);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'leave'])],
            'languages' => ['required', 'array', 'min:1'],
            'languages.*' => ['string', 'max:40'],
        ]);

        $before = $broker->only(['status', 'languages']);
        $broker->update(['status' => $validated['status'], 'languages' => array_values(array_filter(array_map('trim', $validated['languages'])))]);
        $audit->record('broker.self_updated', $broker, $before, $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => $validated['status'] === 'leave' ? 'You are on leave: no new offers until you return.' : 'You are available for new offers.']);

        return back();
    }
}
