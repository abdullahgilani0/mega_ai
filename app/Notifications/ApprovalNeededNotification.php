<?php

namespace App\Notifications;

use App\Models\ApprovalRequest;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApprovalNeededNotification extends Notification
{
    public function __construct(public ApprovalRequest $request) {}

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
            ->subject('A MEGA action needs your approval')
            ->line(ApprovalRequest::ACTIONS[$this->request->action].': '.$this->request->reason)
            ->action('Review the request', route('admin.approvals.index'));
    }

    /**
     * @return array{title: string, body: string, url: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Approval needed',
            'body' => ApprovalRequest::ACTIONS[$this->request->action].' · '.$this->request->reason,
            'url' => route('admin.approvals.index'),
        ];
    }
}
