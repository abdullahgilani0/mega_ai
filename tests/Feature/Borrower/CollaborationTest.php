<?php

use App\Enums\ApplicationStage;
use App\Enums\ApplicationStatus;
use App\Enums\DocumentKind;
use App\Enums\DocumentStatus;
use App\Enums\Role;
use App\Models\Application;
use App\Models\Broker;
use App\Models\CoBorrower;
use App\Models\DisclosureTemplate;
use App\Models\Document;
use App\Models\User;
use App\Notifications\CoBorrowerInviteNotification;
use App\Notifications\JourneyReminderNotification;
use App\Notifications\MessageReceivedNotification;
use App\Notifications\SecurityAlertNotification;
use Database\Seeders\DisclosureTemplateSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

uses(RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();
});

it('lets the borrower and their broker message each other, and notifies the other side', function () {
    $broker = Broker::factory()->create();
    $application = Application::factory()->create(['broker_id' => $broker->id, 'status' => ApplicationStatus::Allocated]);

    $this->actingAs($application->user)->post(route('messages.store', $application->public_id), ['body' => 'When can we talk?']);
    $this->actingAs($broker->user)->post(route('messages.store', $application->public_id), ['body' => 'Tomorrow at 10?']);

    expect($application->messages()->pluck('body')->all())->toBe(['When can we talk?', 'Tomorrow at 10?']);
    Notification::assertSentTo($broker->user, MessageReceivedNotification::class);
    Notification::assertSentTo($application->user, MessageReceivedNotification::class);
});

it('returns 404 when someone outside the file tries to message it', function () {
    $application = Application::factory()->create(['broker_id' => Broker::factory()->create()->id]);

    $this->actingAs(User::factory()->create())
        ->post(route('messages.store', $application->public_id), ['body' => 'Hello'])
        ->assertNotFound();
});

it('serves a document to its owner but not to other borrowers or staff without a grant', function () {
    Storage::fake('local');
    Storage::disk('local')->put('applications/x/payslip.pdf', 'pdf-bytes');
    $application = Application::factory()->create();
    $document = $application->documents()->create([
        'kind' => DocumentKind::Payslip,
        'original_name' => 'payslip.pdf',
        'storage_path' => 'applications/x/payslip.pdf',
        'sha256' => str_repeat('b', 64),
        'mime_type' => 'application/pdf',
        'size_bytes' => 9,
        'status' => DocumentStatus::Verified,
    ]);

    $this->actingAs($application->user)->get(route('files.document', $document))->assertOk();
    $this->actingAs(User::factory()->create())->get(route('files.document', $document))->assertNotFound();
    $this->actingAs(User::factory()->role(Role::Admin)->create())->get(route('files.document', $document))->assertNotFound();
});

it('invites a co-borrower who joins with the invited email only', function () {
    $application = Application::factory()->create(['is_joint' => true]);

    $this->actingAs($application->user)->post(route('journey.co-borrowers.store', $application->public_id), ['email' => 'partner@example.com']);
    $invite = CoBorrower::sole();
    Notification::assertSentOnDemand(CoBorrowerInviteNotification::class);

    $link = URL::temporarySignedRoute('co-borrower.accept', now()->addDay(), ['invite' => $invite->id]);

    $this->actingAs(User::factory()->create(['email' => 'stranger@example.com']))->get($link);
    expect($invite->fresh()->accepted_at)->toBeNull();

    $partner = User::factory()->create(['email' => 'partner@example.com']);
    $this->actingAs($partner)->get($link)->assertRedirect(route('dashboard'));

    expect($invite->fresh()->user_id)->toBe($partner->id)
        ->and($application->hasCoBorrower($partner))->toBeTrue();
});

it('reminds idle borrowers once per reminder window', function () {
    $idle = Application::factory()->create();
    Application::query()->whereKey($idle->id)->update(['updated_at' => now()->subHours(30)]);
    $active = Application::factory()->create();

    $this->artisan('mega:reminders')->assertSuccessful();
    $this->artisan('mega:reminders')->assertSuccessful();

    Notification::assertSentToTimes($idle->user, JourneyReminderNotification::class, 1);
    Notification::assertNotSentTo($active->user, JourneyReminderNotification::class);
});

it('deletes raw ID images after the retention period', function () {
    Storage::fake('local');
    Storage::disk('local')->put('applications/x/licence.jpg', 'image');
    $application = Application::factory()->create();
    $application->identityChecks()->create(['vendor' => 'sandbox', 'document_type' => 'driver_licence', 'result' => 'verified', 'attempts' => 1]);
    $document = $application->documents()->create([
        'kind' => DocumentKind::DriverLicence,
        'original_name' => 'licence.jpg',
        'storage_path' => 'applications/x/licence.jpg',
        'sha256' => str_repeat('c', 64),
        'mime_type' => 'image/jpeg',
        'size_bytes' => 5,
        'status' => DocumentStatus::Verified,
    ]);
    Document::query()->whereKey($document->id)->update(['created_at' => now()->subDays(config('mega.retention.id_images_days') + 1)]);

    $this->artisan('mega:retention')->assertSuccessful();

    expect($document->fresh()->storage_path)->toBe('');
    Storage::disk('local')->assertMissing('applications/x/licence.jpg');
});

it('alerts the user when they sign in from a new device', function () {
    $user = User::factory()->create(['last_login_ip' => '10.0.0.1', 'last_login_user_agent' => 'Old browser', 'last_login_at' => now()->subDay()]);

    $this->withHeader('User-Agent', 'New browser')->post(route('login.store'), ['email' => $user->email, 'password' => 'password']);

    Notification::assertSentTo($user, SecurityAlertNotification::class);
    expect($user->fresh()->last_login_user_agent)->toBe('New browser');
});

it('requires the SMS step-up before signing', function () {
    $this->seed(DisclosureTemplateSeeder::class);
    $application = Application::factory()->atStage(ApplicationStage::Sign)->create();

    $this->actingAs($application->user)
        ->post(route('journey.sign.store', [$application->public_id, DisclosureTemplate::first()->id]), [
            'acknowledged' => '1',
            'signed_name' => $application->user->name,
        ])
        ->assertSessionHasErrors(['step_up' => 'Confirm it’s you with the code we text you before signing.']);
});
