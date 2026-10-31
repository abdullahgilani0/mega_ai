<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureStaffMfa
{
    /**
     * When enabled in platform settings, staff and brokers must have two-factor
     * authentication or a passkey before they can reach borrower data.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! config('mega.security.require_staff_mfa') || $user === null) {
            return $next($request);
        }

        $hasSecondFactor = $user->two_factor_confirmed_at !== null || $user->passkeys()->exists();

        if (! $hasSecondFactor) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Set up two-factor authentication or a passkey to continue.']);

            return redirect()->route('security.edit');
        }

        return $next($request);
    }
}
