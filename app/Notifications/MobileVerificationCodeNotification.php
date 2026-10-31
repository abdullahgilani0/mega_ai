<?php

namespace App\Notifications;

use App\Notifications\Channels\SmsChannel;
use Illuminate\Notifications\Notification;

class MobileVerificationCodeNotification extends Notification
{
    public function __construct(public string $code) {}

    /**
     * @return list<class-string>
     */
    public function via(object $notifiable): array
    {
        return [SmsChannel::class];
    }

    public function toSms(object $notifiable): string
    {
        return "MEGA: your verification code is {$this->code}. It expires in ".config('mega.otp.ttl_minutes').' minutes. Never share this code.';
    }
}
