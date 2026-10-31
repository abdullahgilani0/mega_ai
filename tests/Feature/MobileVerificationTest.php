<?php

use App\Models\User;
use App\Notifications\MobileVerificationCodeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();
    $this->user = User::factory()->mobileUnverified()->create();
});

function sentCode(User $user): string
{
    $code = null;
    Notification::assertSentTo($user, MobileVerificationCodeNotification::class, function ($notification) use (&$code) {
        $code = $notification->code;

        return true;
    });

    return $code;
}

it('sends users with an unverified mobile to the verification screen', function () {
    $this->actingAs($this->user)->get(route('dashboard'))->assertRedirect(route('mobile.verify'));
});

it('verifies the mobile with the code sent by SMS', function () {
    $this->actingAs($this->user)->get(route('mobile.verify'));

    $this->post(route('mobile.verify.store'), ['code' => sentCode($this->user)])
        ->assertRedirect(route('dashboard'));

    expect($this->user->fresh()->hasVerifiedMobile())->toBeTrue();
});

it('rejects a wrong code', function () {
    $this->actingAs($this->user)->get(route('mobile.verify'));
    $wrong = sentCode($this->user) === '000000' ? '111111' : '000000';

    $this->post(route('mobile.verify.store'), ['code' => $wrong])
        ->assertSessionHasErrors(['code' => 'That code is not right. Check the SMS and try again.']);

    expect($this->user->fresh()->hasVerifiedMobile())->toBeFalse();
});

it('rejects the correct code once it has expired', function () {
    $this->actingAs($this->user)->get(route('mobile.verify'));
    $code = sentCode($this->user);

    $this->travel(config('mega.otp.ttl_minutes') + 1)->minutes();

    $this->post(route('mobile.verify.store'), ['code' => $code])
        ->assertSessionHasErrors(['code' => 'This code has expired. Request a new one.']);
});

it('locks the code after too many wrong attempts', function () {
    $this->actingAs($this->user)->get(route('mobile.verify'));
    $code = sentCode($this->user);
    $wrong = $code === '000000' ? '111111' : '000000';

    foreach (range(1, config('mega.otp.max_attempts')) as $attempt) {
        $this->post(route('mobile.verify.store'), ['code' => $wrong]);
    }

    $this->post(route('mobile.verify.store'), ['code' => $code])
        ->assertSessionHasErrors(['code' => 'This code has expired. Request a new one.']);
});

it('throttles requests for a new code', function () {
    $this->actingAs($this->user)->get(route('mobile.verify'));

    $this->post(route('mobile.verify.resend'))
        ->assertSessionHasErrors(['code' => 'Please wait a moment before requesting another code.']);
});
