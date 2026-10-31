<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Notifications\SecurityAlertNotification;
use App\Services\AuditLogger;
use App\Support\AustralianMobile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Signed-in devices with remote sign-out, and changing the verified mobile number.
 */
class DevicesController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('settings/devices', [
            'sessions' => $request->user()->sessions()->orderByDesc('last_activity')->get()->map(fn (Session $session) => [
                'id' => substr(hash('sha256', $session->id), 0, 12),
                'ip' => $session->ip_address,
                'agent' => $session->user_agent,
                'current' => $session->id === $request->session()->getId(),
                'lastActive' => date(DATE_ATOM, $session->last_activity),
            ]),
            'mobile' => $request->user()->mobile ? AustralianMobile::mask($request->user()->mobile) : null,
        ]);
    }

    public function destroyOthers(Request $request, AuditLogger $audit): RedirectResponse
    {
        $count = $request->user()->sessions()->where('id', '!=', $request->session()->getId())->delete();
        $audit->record('auth.sessions_revoked', $request->user(), after: ['count' => $count]);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Signed out {$count} other device".($count === 1 ? '' : 's').'.']);

        return back();
    }

    /**
     * Requires a recent password confirmation; the new number must then be verified by SMS.
     */
    public function updateMobile(Request $request, AuditLogger $audit): RedirectResponse
    {
        $request->merge(['mobile' => AustralianMobile::normalise((string) $request->input('mobile'))]);
        $validated = $request->validate([
            'mobile' => ['required', 'regex:'.AustralianMobile::PATTERN, Rule::unique('users', 'mobile')->ignore($request->user()->id)],
        ], ['mobile.regex' => 'Enter an Australian mobile number, for example 0412 345 678.']);

        $user = $request->user();
        $old = $user->mobile;
        $user->notify(new SecurityAlertNotification('Your mobile number is being changed', $request->ip()));
        $user->forceFill(['mobile' => $validated['mobile'], 'mobile_verified_at' => null])->save();
        $audit->record('auth.mobile_changed', $user, ['mobile' => $old ? AustralianMobile::mask($old) : null], ['mobile' => AustralianMobile::mask($validated['mobile'])]);

        return to_route('mobile.verify');
    }
}
