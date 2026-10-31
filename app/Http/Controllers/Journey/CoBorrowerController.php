<?php

namespace App\Http\Controllers\Journey;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\CoBorrower;
use App\Notifications\CoBorrowerInviteNotification;
use App\Services\ApplicationTimeline;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Joint applications: each co-borrower registers and verifies their own contacts.
 */
class CoBorrowerController extends Controller
{
    public function store(Request $request, Application $application, AuditLogger $audit): RedirectResponse
    {
        abort_unless($application->user_id === $request->user()->id && $application->is_joint, 404);

        $validated = $request->validate([
            'email' => [
                'required', 'email', 'max:255',
                Rule::notIn([$request->user()->email]),
                Rule::unique('co_borrowers', 'email')->where('application_id', $application->id),
            ],
        ], ['email.not_in' => 'Invite the other person, not yourself.', 'email.unique' => 'You have already invited this person.']);

        $invite = $application->coBorrowers()->create(['email' => strtolower($validated['email'])]);
        Notification::route('mail', $invite->email)->notify(new CoBorrowerInviteNotification($invite));
        $audit->record('co_borrower.invited', $application, after: ['email' => $invite->email]);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Invitation sent to {$invite->email}."]);

        return back();
    }

    /**
     * Opened from the emailed signed link, after the invitee signs in or registers.
     */
    public function accept(Request $request, CoBorrower $invite, ApplicationTimeline $timeline, AuditLogger $audit): RedirectResponse
    {
        $user = $request->user();

        if (strtolower($user->email) !== $invite->email) {
            Inertia::flash('toast', ['type' => 'error', 'message' => "This invitation is for {$invite->email}. Sign in with that email to accept."]);

            return to_route('dashboard');
        }

        if ($invite->accepted_at === null) {
            $invite->update(['user_id' => $user->id, 'accepted_at' => now()]);
            $timeline->record($invite->application, 'co_borrower.joined', ['label' => $user->name]);
            $audit->record('co_borrower.accepted', $invite->application);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'You have joined the application.']);

        return to_route('dashboard');
    }
}
