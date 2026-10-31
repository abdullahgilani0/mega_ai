<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMobileIsVerified
{
    /**
     * Borrowers must verify both email and mobile before the account becomes active.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->mobile && ! $user->hasVerifiedMobile()) {
            return redirect()->route('mobile.verify');
        }

        return $next($request);
    }
}
