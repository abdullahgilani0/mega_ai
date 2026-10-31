<?php

namespace App\Notifications;

use App\Models\CoBorrower;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class CoBorrowerInviteNotification extends Notification
{
    public function __construct(public CoBorrower $invite) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $inviter = $this->invite->application->user->name;

        return (new MailMessage)
            ->subject("{$inviter} invited you to a joint MEGA application")
            ->line("{$inviter} added you as a co-borrower. You'll create your own account and verify your own mobile and email.")
            ->action('Join the application', URL::temporarySignedRoute('co-borrower.accept', now()->addDays(7), ['invite' => $this->invite->id]))
            ->line('The link expires in 7 days.');
    }
}
