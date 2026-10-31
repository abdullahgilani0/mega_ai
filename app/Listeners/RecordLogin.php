<?php

namespace App\Listeners;

use App\Models\User;
use App\Notifications\SecurityAlertNotification;
use App\Services\AuditLogger;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\Request;

/**
 * Records every sign-in and alerts the user when it comes from a new device or network.
 */
class RecordLogin
{
    public function __construct(private Request $request, private AuditLogger $audit) {}

    public function handleLogin(Login $event): void
    {
        $user = $event->user;

        if (! $user instanceof User) {
            return;
        }

        $ip = $this->request->ip();
        $agent = (string) $this->request->userAgent();
        $isNewDevice = $user->last_login_at !== null
            && ($user->last_login_ip !== $ip || $user->last_login_user_agent !== $agent);

        $user->forceFill(['last_login_ip' => $ip, 'last_login_user_agent' => $agent, 'last_login_at' => now()])->save();
        $this->audit->record('auth.login', $user, after: ['new_device' => $isNewDevice]);

        if ($isNewDevice) {
            $user->notify(new SecurityAlertNotification('New sign-in to your account', $ip));
        }
    }

    public function handleFailed(Failed $event): void
    {
        if ($event->user instanceof User) {
            $this->audit->record('auth.login_failed', $event->user);
        }
    }
}
