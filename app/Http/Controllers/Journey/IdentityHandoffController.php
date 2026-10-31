<?php

namespace App\Http\Controllers\Journey;

use App\Enums\IdentityResult;
use App\Http\Controllers\Controller;
use App\Models\IdentityCheck;
use App\Services\IdentityVerification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Mobile page opened from the desktop QR code. Access is by a short-lived signed
 * link; once the check has completed the link can do nothing further.
 */
class IdentityHandoffController extends Controller
{
    public function show(IdentityCheck $check): Response
    {
        return Inertia::render('journey/identity-handoff', [
            'check' => IdentityController::present($check),
            'submitUrl' => $check->result === IdentityResult::Pending
                ? URL::temporarySignedRoute('identity.handoff.store', now()->addMinutes(config('mega.identity.handoff_minutes')), ['check' => $check->id])
                : null,
        ]);
    }

    public function store(IdentityCheck $check, IdentityVerification $identity): RedirectResponse
    {
        $identity->complete($check, 'phone_handoff');

        return redirect(URL::temporarySignedRoute('identity.handoff', now()->addMinutes(2), ['check' => $check->id]));
    }
}
