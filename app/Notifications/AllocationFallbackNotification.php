<?php

namespace App\Notifications;

use App\Models\Application;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AllocationFallbackNotification extends Notification
{
    public function __construct(public Application $application) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * @return array{title: string, body: string, url: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Allocation needs a person',
            'body' => "No broker accepted a {$this->application->loan_pack->label()} application in {$this->application->state} {$this->application->postcode}.",
            'url' => route('admin.allocations.index'),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Allocation needs a person: no broker accepted')
            ->line("A {$this->application->loan_pack->label()} application in {$this->application->state} {$this->application->postcode} could not be allocated automatically.")
            ->action('Open the allocation queue', route('admin.allocations.index'));
    }
}
