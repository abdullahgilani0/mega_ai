<?php

namespace App\Notifications;

use App\Notifications\Channels\SmsChannel;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SecurityAlertNotification extends Notification
{
    public function __construct(public string $event, public ?string $ip) {}

    /**
     * @return list<string|class-string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', SmsChannel::class, 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('MEGA security alert: '.$this->event)
            ->line($this->event.' from IP '.($this->ip ?? 'unknown').' at '.now()->format('j M Y, g:i a').'.')
            ->line('If this was not you, change your password and sign out other devices now.')
            ->action('Review your devices', route('devices.index'));
    }

    public function toSms(object $notifiable): string
    {
        return 'MEGA: '.$this->event.'. Not you? Change your password now.';
    }

    /**
     * @return array{title: string, body: string, url: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Security alert',
            'body' => $this->event.' from '.($this->ip ?? 'an unknown address'),
            'url' => route('devices.index'),
        ];
    }
}
