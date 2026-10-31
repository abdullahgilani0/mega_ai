<?php

namespace App\Notifications;

use App\Models\Allocation;
use App\Notifications\Channels\SmsChannel;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BrokerOfferNotification extends Notification
{
    public function __construct(public Allocation $allocation) {}

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
        $application = $this->allocation->application;

        return [
            'title' => 'New application offered to you',
            'body' => "{$application->loan_pack->label()} in {$application->state} {$application->postcode}. Accept before ".$this->allocation->expires_at->format('g:i a').'.',
            'url' => route('broker.inbox'),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $application = $this->allocation->application;

        return (new MailMessage)
            ->subject('New MEGA application offered to you')
            ->line("A {$application->loan_pack->label()} application in {$application->state} {$application->postcode} matches your territory and skills.")
            ->line('The offer expires at '.$this->allocation->expires_at->format('g:i a').'.')
            ->action('Review the offer', route('broker.inbox'));
    }

    /**
     * No personal details in SMS: loan type, region and a secure link only.
     */
    public function toSms(object $notifiable): string
    {
        $application = $this->allocation->application;

        return "MEGA: new {$application->loan_pack->label()} offer in {$application->state}. Accept within ".config('mega.allocation.offer_window_minutes').' min: '.route('broker.inbox');
    }
}
