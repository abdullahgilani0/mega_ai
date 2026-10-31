<?php

namespace App\Services;

use App\Models\MobileVerificationCode;
use App\Models\User;
use App\Notifications\MobileVerificationCodeNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Six-digit SMS one-time passwords: one active code at a time, short expiry,
 * limited attempts and a resend throttle.
 */
class MobileVerifier
{
    public function __construct(private AuditLogger $audit) {}

    /**
     * Issue a fresh code, invalidating any earlier one. Returns the plain code so
     * local development can display it; it is never stored unhashed.
     */
    public function send(User $user): string
    {
        $latest = $this->latestCode($user);

        if ($latest && $latest->created_at->diffInSeconds(now()) < config('mega.otp.resend_seconds')) {
            throw ValidationException::withMessages([
                'code' => 'Please wait a moment before requesting another code.',
            ]);
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        DB::transaction(function () use ($user, $code) {
            MobileVerificationCode::where('user_id', $user->id)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now()]);

            MobileVerificationCode::create([
                'user_id' => $user->id,
                'mobile' => $user->mobile,
                'code_hash' => Hash::make($code),
                'expires_at' => now()->addMinutes(config('mega.otp.ttl_minutes')),
            ]);
        });

        $user->notify(new MobileVerificationCodeNotification($code));
        $this->audit->record('auth.mobile_code_sent', $user);

        return $code;
    }

    public function verify(User $user, string $code): void
    {
        $this->consume($user, $code);

        $user->forceFill(['mobile_verified_at' => now()])->save();
        $this->audit->record('auth.mobile_verified', $user);
    }

    /**
     * Step-up check for a sensitive action (such as signing), using the verified mobile.
     */
    public function confirm(User $user, string $code): void
    {
        $this->consume($user, $code);
        $this->audit->record('auth.step_up_passed', $user);
    }

    private function consume(User $user, string $code): void
    {
        $active = $this->latestCode($user);

        if (! $active || ! $active->isUsable()) {
            throw ValidationException::withMessages([
                'code' => 'This code has expired. Request a new one.',
            ]);
        }

        $active->increment('attempts');

        if (! Hash::check($code, $active->code_hash)) {
            $this->audit->record('auth.mobile_code_failed', $user);

            throw ValidationException::withMessages([
                'code' => 'That code is not right. Check the SMS and try again.',
            ]);
        }

        $active->update(['consumed_at' => now()]);
    }

    private function latestCode(User $user): ?MobileVerificationCode
    {
        return MobileVerificationCode::where('user_id', $user->id)
            ->whereNull('consumed_at')
            ->latest('id')
            ->first();
    }
}
