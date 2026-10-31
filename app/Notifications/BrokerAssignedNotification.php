<?php

namespace App\Notifications;

use App\Models\Application;
use App\Models\Broker;
use App\Notifications\Channels\SmsChannel;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BrokerAssignedNotification extends Notification
{
    public function __construct(public Application $application, public Broker $broker) {}

    /**
     * @return list<string|class-string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', SmsChannel::class, 'database'];
    }

    /**
     * @return array{title: string, body: string, url: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Meet your broker',
            'body' => "{$this->broker->user->name} will contact you within one business day.",
            'url' => route('dashboard'),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Meet your MEGA broker')
            ->line("{$this->broker->user->name} ({$this->broker->business_name}) is your licensed broker.")
            ->line('They will contact you within one business day to review your matches.')
            ->action('View your application', route('dashboard'));
    }

    public function toSms(object $notifiable): string
    {
        return "MEGA: {$this->broker->user->name} is your broker and will be in touch within one business day.";
    }
}
