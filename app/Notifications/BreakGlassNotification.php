<?php

namespace App\Notifications;

use App\Models\AccessGrant;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BreakGlassNotification extends Notification
{
    public function __construct(public AccessGrant $grant) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Break-glass access used')
            ->line("{$this->grant->user->name} used emergency access to application #{$this->grant->application_id}: {$this->grant->reason}")
            ->line('A post-incident review is required.')
            ->action('Review access', route('admin.access.index'));
    }

    /**
     * @return array{title: string, body: string, url: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Break-glass access used',
            'body' => "{$this->grant->user->name}: {$this->grant->reason}",
            'url' => route('admin.access.index'),
        ];
    }
}
