<?php

namespace App\Services\Allocation;

use App\Enums\AllocationStatus;
use App\Enums\ApplicationStatus;
use App\Enums\LoanPack;
use App\Enums\Role;
use App\Models\Allocation;
use App\Models\Application;
use App\Models\Broker;
use App\Models\Territory;
use App\Models\User;
use App\Notifications\AllocationFallbackNotification;
use App\Notifications\BrokerAssignedNotification;
use App\Notifications\BrokerOfferNotification;
use App\Services\ApplicationTimeline;
use App\Services\AuditLogger;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

/**
 * Picks the best-fit local, licensed, available broker: hard filters first, then a
 * weighted score with a fairness rotation so opportunities are shared.
 */
class AllocationEngine
{
    public function __construct(
        private ApplicationTimeline $timeline,
        private AuditLogger $audit,
    ) {}

    /**
     * Offer the application to the next best broker, or fall back to the admin queue.
     */
    public function offerNext(Application $application): ?Allocation
    {
        $alreadyOffered = $application->allocations()->get()->map(fn (Allocation $allocation) => $allocation->broker_id)->all();
        $candidate = $this->rankCandidates($application, $alreadyOffered)->first();

        if ($candidate === null) {
            $application->update(['status' => ApplicationStatus::Unallocated]);
            $this->timeline->record($application, 'allocation.fallback');
            $this->audit->record('allocation.fallback', $application, reason: 'No eligible broker accepted or was available.');
            Notification::send(
                User::whereIn('role', [Role::Admin, Role::SuperAdmin])->get(),
                new AllocationFallbackNotification($application),
            );

            return null;
        }

        $allocation = $application->allocations()->create([
            'broker_id' => $candidate['broker']->id,
            'status' => AllocationStatus::Offered,
            'score' => $candidate['score'],
            'reasons' => $candidate['reasons'],
            'offered_at' => now(),
            'expires_at' => now()->addMinutes(config('mega.allocation.offer_window_minutes')),
        ]);

        $application->update(['status' => ApplicationStatus::Allocating]);
        $candidate['broker']->user->notify(new BrokerOfferNotification($allocation));
        $this->timeline->record($application, 'allocation.offered');
        $this->audit->record('allocation.offered', $allocation, after: ['broker_id' => $candidate['broker']->id, 'score' => $candidate['score']]);

        return $allocation;
    }

    public function accept(Allocation $allocation): void
    {
        if ($allocation->status !== AllocationStatus::Offered || $allocation->expires_at->isPast()) {
            throw ValidationException::withMessages(['allocation' => 'This offer is no longer available.']);
        }

        DB::transaction(function () use ($allocation) {
            $allocation->update(['status' => AllocationStatus::Accepted, 'responded_at' => now()]);
            $allocation->broker->update(['last_allocated_at' => now()]);
            $allocation->application->update([
                'broker_id' => $allocation->broker_id,
                'status' => ApplicationStatus::Allocated,
            ]);
        });

        $application = $allocation->application;
        $application->user->notify(new BrokerAssignedNotification($application, $allocation->broker));
        $this->timeline->record($application, 'allocation.accepted', ['broker_name' => $allocation->broker->user->name]);
        $this->audit->record('allocation.accepted', $allocation, after: ['minutes_to_accept' => (int) $allocation->offered_at->diffInMinutes(now())]);
    }

    public function decline(Allocation $allocation, ?string $reason = null): void
    {
        if ($allocation->status !== AllocationStatus::Offered) {
            throw ValidationException::withMessages(['allocation' => 'This offer is no longer available.']);
        }

        $allocation->update(['status' => AllocationStatus::Declined, 'responded_at' => now()]);
        $this->audit->record('allocation.declined', $allocation, reason: $reason);

        $this->offerNext($allocation->application);
    }

    /**
     * Expire offers whose accept window has passed and move each to the next broker.
     */
    public function expireStaleOffers(): int
    {
        $stale = Allocation::where('status', AllocationStatus::Offered)
            ->where('expires_at', '<', now())
            ->with('application')
            ->get();

        foreach ($stale as $allocation) {
            $allocation->update(['status' => AllocationStatus::Expired]);
            $this->audit->record('allocation.expired', $allocation);
            $this->offerNext($allocation->application);
        }

        return $stale->count();
    }

    public function reassign(Application $application, Broker $broker, string $reason): Allocation
    {
        $allocation = DB::transaction(function () use ($application, $broker, $reason) {
            $application->allocations()
                ->whereIn('status', [AllocationStatus::Offered, AllocationStatus::Accepted])
                ->update(['status' => AllocationStatus::Reassigned]);

            $allocation = $application->allocations()->create([
                'broker_id' => $broker->id,
                'status' => AllocationStatus::Accepted,
                'score' => 0,
                'reasons' => ['manual' => true, 'reason' => $reason],
                'offered_at' => now(),
                'expires_at' => now(),
                'responded_at' => now(),
            ]);

            $application->update(['broker_id' => $broker->id, 'status' => ApplicationStatus::Allocated]);
            $broker->update(['last_allocated_at' => now()]);

            return $allocation;
        });

        $application->user->notify(new BrokerAssignedNotification($application, $broker));
        $this->timeline->record($application, 'allocation.accepted', ['broker_name' => $broker->user->name]);
        $this->audit->record('allocation.reassigned', $application, after: ['broker_id' => $broker->id], reason: $reason);

        return $allocation;
    }

    /**
     * Eligible brokers, best first.
     *
     * @param  array<int, int>  $excludeBrokerIds
     * @return Collection<int, array{broker: Broker, score: float, reasons: array{territory: string, territory_tier: string, skill_fit: float, capacity_headroom: float, responsiveness: float, fairness: float}}>
     */
    public function rankCandidates(Application $application, array $excludeBrokerIds = []): Collection
    {
        $territories = Territory::all();
        $exact = $territories->filter(fn (Territory $territory) => $territory->covers($application->postcode))->pluck('id');
        $sameState = $territories->where('state', $application->state)->pluck('id');
        $neededSkills = $this->neededSkills($application);
        $weights = config('mega.allocation.weights');

        return Broker::query()
            ->where('status', 'active')
            ->whereNotIn('id', $excludeBrokerIds)
            ->with(['territories', 'user'])
            ->get()
            ->filter(fn (Broker $broker) => in_array($application->loan_pack->value, $broker->loan_packs, true))
            ->map(function (Broker $broker) use ($exact, $sameState, $neededSkills, $weights) {
                $primary = $broker->territories->first(fn ($territory) => $exact->contains($territory->id) && $territory->pivot->coverage === 'primary');
                $secondary = $broker->territories->first(fn ($territory) => $exact->contains($territory->id));
                $adjacent = $broker->territories->first(fn ($territory) => $sameState->contains($territory->id));

                [$territoryScore, $tier, $territory] = match (true) {
                    $primary !== null => [1.0, 'primary', $primary],
                    $secondary !== null => [0.8, 'secondary', $secondary],
                    $adjacent !== null => [0.4, 'adjacent', $adjacent],
                    default => [0.0, null, null],
                };

                $open = $broker->openApplicationCount();

                if ($tier === null || $open >= $broker->capacity) {
                    return null;
                }

                $skill = $neededSkills === [] ? 1.0 : count(array_intersect($neededSkills, $broker->skills)) / count($neededSkills);
                $capacity = 1 - $open / max(1, $broker->capacity);
                $responsiveness = $broker->acceptance_rate * 0.5 + max(0, 1 - $broker->avg_first_contact_minutes / 120) * 0.5;
                $fairness = $broker->last_allocated_at === null ? 1.0 : min(1, $broker->last_allocated_at->diffInHours(now()) / 48);

                $score = round(100 * (
                    $weights['territory'] * $territoryScore
                    + $weights['skill'] * $skill
                    + $weights['capacity'] * $capacity
                    + $weights['responsiveness'] * $responsiveness
                    + $weights['fairness'] * $fairness
                ), 2);

                return [
                    'broker' => $broker,
                    'score' => $score,
                    'reasons' => [
                        'territory' => $territory->name,
                        'territory_tier' => $tier,
                        'skill_fit' => round($skill, 2),
                        'capacity_headroom' => round($capacity, 2),
                        'responsiveness' => round($responsiveness, 2),
                        'fairness' => round($fairness, 2),
                    ],
                ];
            })
            ->filter()
            ->sortByDesc('score')
            ->values();
    }

    /**
     * @return list<string>
     */
    private function neededSkills(Application $application): array
    {
        $skills = match ($application->loan_pack) {
            LoanPack::Home => match ($application->purpose) {
                'first_home' => ['first_home_buyers'],
                'investment' => ['investors'],
                'refinance' => ['refinance'],
                default => [],
            },
            LoanPack::Business => ['business_lending'],
            LoanPack::Asset => ['asset_finance'],
            LoanPack::Personal => [],
        };

        if ($application->employment_type === 'self_employed') {
            $skills[] = 'self_employed';
        }

        return $skills;
    }
}
