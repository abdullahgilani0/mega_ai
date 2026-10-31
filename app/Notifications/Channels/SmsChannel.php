<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

/**
 * Sends service SMS. Locally it writes to the log; wire an Australian SMS provider
 * with an approved sender ID here for production.
 */
class SmsChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notifiable, 'routeNotificationFor') || ! method_exists($notification, 'toSms')) {
            return;
        }

        $to = $notifiable->routeNotificationFor('sms', $notification);

        if (! $to) {
            return;
        }

        Log::info('[sms] to '.$to.': '.$notification->toSms($notifiable));
    }
}
