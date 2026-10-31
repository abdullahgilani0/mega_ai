<?php

namespace App\Notifications;

use App\Models\Message;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class MessageReceivedNotification extends Notification
{
    public function __construct(public Message $message, public string $url) {}

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
            ->subject('New message from '.$this->message->sender->name)
            ->line('You have a new message about your MEGA application.')
            ->action('Read it', $this->url);
    }

    /**
     * Message text stays in the app; notifications carry only a short preview.
     *
     * @return array{title: string, body: string, url: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Message from '.$this->message->sender->name,
            'body' => Str::limit($this->message->body, 80),
            'url' => $this->url,
        ];
    }
}
