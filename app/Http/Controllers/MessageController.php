<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Message;
use App\Notifications\MessageReceivedNotification;
use App\Services\ApplicationTimeline;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Secure in-app messaging between a borrower (and co-borrowers) and their broker.
 */
class MessageController extends Controller
{
    public function store(Request $request, Application $application, ApplicationTimeline $timeline): RedirectResponse
    {
        $user = $request->user();
        $isBroker = $user->broker !== null && $application->broker_id === $user->broker->id;
        $isBorrower = $application->user_id === $user->id || $application->hasCoBorrower($user);

        abort_unless($isBroker || $isBorrower, 404);
        abort_if($application->broker_id === null, 409, 'Messaging opens once a broker is assigned.');

        $validated = $request->validate(['body' => ['required', 'string', 'max:2000']]);

        $message = $application->messages()->create(['sender_id' => $user->id, 'body' => $validated['body']]);
        $timeline->record($application, 'message.sent', ['from' => $isBroker ? 'broker' : 'borrower']);

        $recipient = $isBroker ? $application->user : $application->broker?->user;
        $url = $isBroker ? route('dashboard') : route('broker.applications.show', $application);

        $recipient?->notify(new MessageReceivedNotification($message->load('sender'), $url));

        return back();
    }

    /**
     * @return list<array{id: int, body: string, sender: string, mine: bool, at: string}>
     */
    public static function thread(Application $application, int $viewerId): array
    {
        $application->messages()->where('sender_id', '!=', $viewerId)->whereNull('read_at')->update(['read_at' => now()]);

        return array_values($application->messages()->with('sender:id,name')->orderBy('id')->get()->map(fn (Message $message) => [
            'id' => $message->id,
            'body' => $message->body,
            'sender' => $message->sender->name,
            'mine' => $message->sender_id === $viewerId,
            'at' => $message->created_at->toIso8601String(),
        ])->all());
    }
}
