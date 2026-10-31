<?php

namespace App\Support;

use App\Enums\ApplicationStage;
use App\Models\Application;
use App\Models\ApplicationEvent;
use Illuminate\Support\Collection;

class JourneyPresenter
{
    /**
     * Timeline event types a borrower may see, with their labels.
     */
    private const BORROWER_EVENTS = [
        'application.created' => 'Application started',
        'consent.granted' => 'Consents recorded',
        'identity.verified' => 'Identity verified',
        'identity.retry' => 'Identity check needs a retake',
        'identity.manual_review' => 'Identity passed to our team to confirm',
        'bank.connected' => 'Bank connected',
        'credit.complete' => 'Credit check complete',
        'assessment.completed' => 'MEGA assessment complete',
        'match.selected' => 'Lender option chosen',
        'disclosure.signed' => 'Document signed',
        'application.submitted' => 'Application submitted',
        'allocation.offered' => 'Finding your local broker',
        'allocation.accepted' => 'Broker assigned',
        'allocation.fallback' => 'Our team is assigning your broker',
        'status.updated' => 'Status updated',
        'application.withdrawn' => 'Application withdrawn',
    ];

    /**
     * @return array<string, mixed>
     */
    public static function summary(Application $application): array
    {
        $visible = array_filter(
            ApplicationStage::cases(),
            fn (ApplicationStage $stage) => $stage !== ApplicationStage::Submitted,
        );

        return [
            'id' => $application->public_id,
            'loanPack' => $application->loan_pack->value,
            'loanPackLabel' => $application->loan_pack->label(),
            'purpose' => $application->purpose,
            'amount' => $application->amount,
            'termYears' => $application->term_years,
            'state' => $application->state,
            'postcode' => $application->postcode,
            'stage' => $application->stage->value,
            'stageLabel' => $application->stage->label(),
            'status' => $application->status->value,
            'statusLabel' => $application->status->label(),
            'createdAt' => $application->created_at->toIso8601String(),
            'stages' => array_map(fn (ApplicationStage $stage) => [
                'key' => $stage->value,
                'label' => $stage->label(),
                'reached' => $application->hasReached($stage),
                'current' => $application->stage === $stage,
            ], $visible),
        ];
    }

    /**
     * @return list<array{id: int, type: string, label: string, detail: string|null, at: string}>
     */
    public static function borrowerTimeline(Application $application): array
    {
        /** @var Collection<int, ApplicationEvent> $events */
        $events = $application->events()
            ->whereIn('type', array_keys(self::BORROWER_EVENTS))
            ->orderByDesc('id')
            ->limit(40)
            ->get();

        return array_values($events->map(fn (ApplicationEvent $event) => [
            'id' => $event->id,
            'type' => $event->type,
            'label' => self::BORROWER_EVENTS[$event->type],
            'detail' => self::eventDetail($event),
            'at' => $event->occurred_at->toIso8601String(),
        ])->all());
    }

    /**
     * The one human-readable detail a borrower event carries, if any.
     */
    private static function eventDetail(ApplicationEvent $event): ?string
    {
        foreach (['broker_name', 'title', 'label', 'institution'] as $key) {
            $value = $event->payload[$key] ?? null;

            if (is_string($value)) {
                return $value;
            }
        }

        return null;
    }

    /**
     * Human label for where a canonical value came from.
     */
    public static function sourceLabel(?string $source): string
    {
        return match (true) {
            $source === null => 'Unknown',
            $source === 'open_banking' => 'Bank data (CDR)',
            $source === 'credit_bureau' => 'Credit bureau',
            $source === 'borrower_answer' => 'Borrower answer',
            $source === 'advisor_confirmed' => 'Advisor note, confirmed',
            str_starts_with($source, 'document:') => 'Document #'.substr($source, 9),
            default => $source,
        };
    }
}
