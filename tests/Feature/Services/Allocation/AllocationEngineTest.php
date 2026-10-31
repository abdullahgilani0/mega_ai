<?php

use App\Enums\AllocationStatus;
use App\Enums\ApplicationStage;
use App\Enums\ApplicationStatus;
use App\Enums\Role;
use App\Models\Application;
use App\Models\Broker;
use App\Models\Territory;
use App\Models\User;
use App\Notifications\AllocationFallbackNotification;
use App\Notifications\BrokerAssignedNotification;
use App\Notifications\BrokerOfferNotification;
use App\Services\Allocation\AllocationEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();
    $this->westernSydney = Territory::create(['name' => 'Western Sydney', 'state' => 'NSW', 'postcodes' => ['2150', '2151']]);
    $this->newcastle = Territory::create(['name' => 'Newcastle', 'state' => 'NSW', 'postcodes' => ['2300']]);
    $this->application = Application::factory()->atStage(ApplicationStage::Submitted)->create(['postcode' => '2150', 'state' => 'NSW']);
});

function brokerIn(Territory $territory, string $coverage = 'primary', array $attributes = []): Broker
{
    $broker = Broker::factory()->create($attributes);
    $broker->territories()->attach($territory->id, ['coverage' => $coverage]);

    return $broker;
}

it('offers the application to the broker whose primary territory covers the postcode', function () {
    brokerIn($this->newcastle);
    $local = brokerIn($this->westernSydney);

    $allocation = app(AllocationEngine::class)->offerNext($this->application);

    expect($allocation->broker_id)->toBe($local->id)
        ->and($allocation->status)->toBe(AllocationStatus::Offered)
        ->and($allocation->reasons['territory_tier'])->toBe('primary')
        ->and($this->application->fresh()->status)->toBe(ApplicationStatus::Allocating);
    Notification::assertSentTo($local->user, BrokerOfferNotification::class);
});

it('skips brokers who are paused, at capacity or not authorised for the loan type', function () {
    brokerIn($this->westernSydney, attributes: ['status' => 'paused']);
    brokerIn($this->westernSydney, attributes: ['capacity' => 0]);
    brokerIn($this->westernSydney, attributes: ['loan_packs' => ['business']]);
    $eligible = brokerIn($this->westernSydney, 'secondary');

    $allocation = app(AllocationEngine::class)->offerNext($this->application);

    expect($allocation->broker_id)->toBe($eligible->id);
});

it('offers the next broker when the first declines', function () {
    $first = brokerIn($this->westernSydney);
    $second = brokerIn($this->newcastle);
    $engine = app(AllocationEngine::class);

    $engine->decline($engine->offerNext($this->application), 'On leave this week');

    $offers = $this->application->allocations()->orderBy('id')->get();
    expect($offers->pluck('broker_id')->all())->toBe([$first->id, $second->id])
        ->and($offers->pluck('status')->all())->toBe([AllocationStatus::Declined, AllocationStatus::Offered]);
});

it('moves an expired offer to the next broker', function () {
    brokerIn($this->westernSydney);
    $next = brokerIn($this->newcastle);
    $engine = app(AllocationEngine::class);
    $offer = $engine->offerNext($this->application);

    $this->travel(config('mega.allocation.offer_window_minutes') + 1)->minutes();
    $expired = $engine->expireStaleOffers();

    expect($expired)->toBe(1)
        ->and($offer->fresh()->status)->toBe(AllocationStatus::Expired)
        ->and($this->application->allocations()->latest('id')->first()->broker_id)->toBe($next->id);
});

it('falls back to the admin queue and alerts admins when no broker is eligible', function () {
    $admin = User::factory()->role(Role::Admin)->create();

    $allocation = app(AllocationEngine::class)->offerNext($this->application);

    expect($allocation)->toBeNull()
        ->and($this->application->fresh()->status)->toBe(ApplicationStatus::Unallocated);
    Notification::assertSentTo($admin, AllocationFallbackNotification::class);
});

it('assigns the application and tells the borrower when the broker accepts', function () {
    $broker = brokerIn($this->westernSydney);
    $engine = app(AllocationEngine::class);

    $engine->accept($engine->offerNext($this->application));

    expect($this->application->fresh())
        ->broker_id->toBe($broker->id)
        ->status->toBe(ApplicationStatus::Allocated);
    Notification::assertSentTo($this->application->user, BrokerAssignedNotification::class);
});

it('rejects accepting an offer after its window has closed', function () {
    brokerIn($this->westernSydney);
    $engine = app(AllocationEngine::class);
    $offer = $engine->offerNext($this->application);

    $this->travel(config('mega.allocation.offer_window_minutes') + 1)->minutes();

    expect(fn () => $engine->accept($offer))->toThrow(ValidationException::class, 'This offer is no longer available.');
});
