<?php

namespace App\Http\Controllers;

use App\Models\MobileVerificationCode;
use App\Services\MobileVerifier;
use App\Support\AustralianMobile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MobileVerificationController extends Controller
{
    public function __construct(private MobileVerifier $verifier) {}

    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user->mobile || $user->hasVerifiedMobile()) {
            return to_route('dashboard');
        }

        $hasActiveCode = MobileVerificationCode::where('user_id', $user->id)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->exists();

        $code = $hasActiveCode ? null : $this->verifier->send($user);

        return Inertia::render('auth/verify-mobile', [
            'mobile' => AustralianMobile::mask($user->mobile),
            'resendSeconds' => config('mega.otp.resend_seconds'),
            'devCode' => app()->isLocal() ? $code : null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate(['code' => ['required', 'digits:6']]);

        $this->verifier->verify($request->user(), $validated['code']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Mobile verified.']);

        return to_route('dashboard');
    }

    public function resend(Request $request): RedirectResponse
    {
        $this->flashDevelopmentCode($this->verifier->send($request->user()));

        Inertia::flash('toast', ['type' => 'info', 'message' => 'A new code is on its way.']);

        return back();
    }

    /**
     * There is no SMS provider locally, so show the code on screen in local development only.
     */
    private function flashDevelopmentCode(string $code): void
    {
        if (app()->isLocal()) {
            Inertia::flash('devCode', $code);
        }
    }
}
