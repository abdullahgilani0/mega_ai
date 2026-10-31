<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\AccessGrant;
use App\Models\Application;
use App\Models\User;
use App\Notifications\BreakGlassNotification;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Just-in-time access to borrower files: staff state a reason and get time-limited
 * access, which the borrower sees in their access history. Break-glass is the
 * emergency path for super admins and always triggers an alert and a review.
 */
class AccessController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/access', [
            'grants' => AccessGrant::with(['user:id,name,role', 'application:id,public_id'])
                ->latest('id')
                ->limit(60)
                ->get()
                ->map(fn (AccessGrant $grant) => [
                    'id' => $grant->id,
                    'user' => $grant->user->name,
                    'role' => $grant->user->role->label(),
                    'applicationId' => $grant->application->public_id,
                    'reason' => $grant->reason,
                    'breakGlass' => $grant->break_glass,
                    'active' => $grant->revoked_at === null && $grant->expires_at->isFuture(),
                    'expiresAt' => $grant->expires_at->toIso8601String(),
                    'reviewedAt' => $grant->reviewed_at?->toIso8601String(),
                    'createdAt' => $grant->created_at->toIso8601String(),
                ]),
        ]);
    }

    public function store(Request $request, Application $application, AuditLogger $audit): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:8', 'max:255'],
        ]);

        $grant = AccessGrant::create([
            'user_id' => $request->user()->id,
            'application_id' => $application->id,
            'reason' => $validated['reason'],
            'expires_at' => now()->addMinutes((int) config('mega.access.grant_minutes')),
        ]);

        $audit->record('access.granted', $application, after: ['grant_id' => $grant->id, 'minutes' => config('mega.access.grant_minutes')], reason: $validated['reason']);

        return to_route('admin.applications.show', $application);
    }

    public function breakGlass(Request $request, Application $application, AuditLogger $audit): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:15', 'max:255'],
        ]);

        $grant = AccessGrant::create([
            'user_id' => $request->user()->id,
            'application_id' => $application->id,
            'reason' => $validated['reason'],
            'break_glass' => true,
            'expires_at' => now()->addMinutes((int) config('mega.access.break_glass_minutes')),
        ]);

        $audit->record('access.break_glass', $application, after: ['grant_id' => $grant->id], reason: $validated['reason']);
        Notification::send(
            User::whereIn('role', [Role::SuperAdmin, Role::Admin])->where('id', '!=', $request->user()->id)->get(),
            new BreakGlassNotification($grant->load('user')),
        );

        Inertia::flash('toast', ['type' => 'warning', 'message' => 'Emergency access granted. Admins have been alerted and a review is required.']);

        return to_route('admin.applications.show', $application);
    }

    public function revoke(AccessGrant $grant, AuditLogger $audit): RedirectResponse
    {
        $grant->update(['revoked_at' => now()]);
        $audit->record('access.revoked', $grant);

        return back();
    }

    public function review(AccessGrant $grant, AuditLogger $audit): RedirectResponse
    {
        $grant->update(['reviewed_at' => now()]);
        $audit->record('access.break_glass_reviewed', $grant);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Post-incident review recorded.']);

        return back();
    }
}
