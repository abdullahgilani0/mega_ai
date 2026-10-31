<?php

namespace App\Services;

use App\Models\Application;
use App\Models\ApplicationEvent;
use Illuminate\Support\Facades\Auth;

class ApplicationTimeline
{
    /**
     * Append an event to the application's timeline.
     *
     * @param  array<string, mixed>  $payload
     */
    public function record(Application $application, string $type, array $payload = [], ?int $actorId = null): ApplicationEvent
    {
        return $application->events()->create([
            'type' => $type,
            'actor_id' => $actorId ?? Auth::id(),
            'payload' => $payload,
            'occurred_at' => now(),
        ]);
    }

    /**
     * Append many events in one insert, keeping their order.
     *
     * @param  list<array{type: string, payload: array<string, mixed>}>  $events
     */
    public function recordMany(Application $application, array $events, ?int $actorId = null): void
    {
        $now = now();

        ApplicationEvent::insert(array_map(fn (array $event) => [
            'application_id' => $application->id,
            'type' => $event['type'],
            'actor_id' => $actorId ?? Auth::id(),
            'payload' => json_encode($event['payload']),
            'occurred_at' => $now,
        ], $events));
    }
}
