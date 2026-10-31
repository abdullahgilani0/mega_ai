<?php

namespace App\Notifications;

use App\Models\Application;
use App\Notifications\Channels\SmsChannel;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class JourneyReminderNotification extends Notification
{
    public function __construct(public Application $application) {}

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
            ->subject('Your MEGA matches are waiting')
            ->line("You're up to: {$this->application->stage->label()}. Pick up exactly where you left off, on any device.")
            ->action('Continue', route('journey.resume', $this->application))
            ->line('Not interested any more? You can withdraw from your dashboard.');
    }

    public function toSms(object $notifiable): string
    {
        return 'MEGA: your application is saved. Continue when you are ready: '.route('journey.resume', $this->application);
    }

    /**
     * @return array{title: string, body: string, url: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Pick up where you left off',
            'body' => 'Next step: '.$this->application->stage->label(),
            'url' => route('journey.resume', $this->application),
        ];
    }
}
