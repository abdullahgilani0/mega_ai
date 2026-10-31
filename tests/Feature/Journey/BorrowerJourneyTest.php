<?php

use App\Enums\AllocationStatus;
use App\Enums\ApplicationStage;
use App\Enums\ApplicationStatus;
use App\Enums\IdentityResult;
use App\Enums\LoanPack;
use App\Models\Application;
use App\Models\Broker;
use App\Models\DisclosureTemplate;
use App\Models\Lender;
use App\Models\Territory;
use App\Models\User;
use App\Notifications\MobileVerificationCodeNotification;
use Database\Seeders\DisclosureTemplateSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local');
    Notification::fake();
});

it('takes a borrower from pre-qualification to an accepted broker allocation', function () {
    $this->seed(DisclosureTemplateSeeder::class);
    Lender::factory()->count(3)->withPolicy(LoanPack::Home, homeLoanRules())->create();
    $broker = Broker::factory()->create();
    $broker->territories()->attach(
        Territory::create(['name' => 'Western Sydney', 'state' => 'NSW', 'postcodes' => ['2150']])->id,
        ['coverage' => 'primary'],
    );
    $borrower = User::factory()->create(['name' => 'Alex Borrower']);
    $this->actingAs($borrower);

    $this->post(route('apply.store'), [
        'loan_pack' => 'home',
        'amount' => 600000,
        'purpose' => 'first_home',
        'state' => 'NSW',
        'postcode' => '2150',
        'employment_type' => 'payg',
        'is_joint' => false,
    ]);
    $application = $borrower->applications()->sole();
    $id = $application->public_id;

    $this->post(route('journey.consent.store', $id), ['consents' => [
        'personal_information' => true, 'automated_processing' => true, 'credit_check' => true,
        'biometric' => true, 'recording' => true, 'marketing' => false,
    ]])->assertRedirect(route('journey.identity', $id));

    $this->post(route('journey.identity.start', $id), [
        'document_type' => 'driver_licence',
        'id_image' => UploadedFile::fake()->create('licence.jpg', 400, 'image/jpeg'),
    ]);
    $this->post(route('journey.identity.complete', $id));
    expect($application->latestIdentityCheck()->first()->result)->toBe(IdentityResult::Verified)
        ->and($application->creditReport()->exists())->toBeTrue();

    $this->post(route('journey.documents.bank', $id));
    $this->post(route('journey.documents.continue', $id))->assertRedirect(route('journey.advisor', $id));

    $this->post(route('journey.advisor.message', $id), [
        'body' => 'I earn $180k, have two kids, 3 years in my job and the property is worth $800k',
    ]);
    foreach ($application->advisorNotes()->whereNotNull('field')->get() as $note) {
        $this->patch(route('journey.advisor.notes.update', [$id, $note->id]), ['action' => 'confirm']);
    }
    expect($application->fresh()->data)->toMatchArray([
        'income_annual' => 180000, 'dependants' => 2, 'employment_months' => 36, 'property_value' => 800000,
    ]);

    $this->post(route('journey.advisor.continue', $id));
    $this->post(route('journey.assessment.store', $id));
    expect($application->fresh()->stage)->toBe(ApplicationStage::Reveal);

    $choice = $application->fresh()->latestMatchRun->shortlist()->first();
    $this->post(route('journey.reveal.select', $id), ['match_result_id' => $choice->id])
        ->assertRedirect(route('journey.sign', $id));

    $this->post(route('journey.sign.step-up', $id));
    $code = null;
    Notification::assertSentTo($borrower, MobileVerificationCodeNotification::class, function ($notification) use (&$code) {
        $code = $notification->code;

        return true;
    });
    $this->post(route('journey.sign.step-up.confirm', $id), ['code' => $code]);

    foreach (DisclosureTemplate::current()->get() as $template) {
        $this->post(route('journey.sign.store', [$id, $template->id]), [
            'acknowledged' => '1',
            'signed_name' => 'alex borrower',
        ]);
    }
    $this->post(route('journey.finish.store', $id))->assertRedirect(route('dashboard'));

    $offer = $application->allocations()->sole();
    expect($offer->broker_id)->toBe($broker->id)
        ->and($application->fresh()->status)->toBe(ApplicationStatus::Allocating)
        ->and($application->signatures()->count())->toBe(4);

    $this->actingAs($broker->user)->post(route('broker.offers.accept', $offer->id));

    expect($offer->fresh()->status)->toBe(AllocationStatus::Accepted)
        ->and($application->fresh())
        ->status->toBe(ApplicationStatus::Allocated)
        ->broker_id->toBe($broker->id);
});

it('returns 404 when a borrower opens another borrower\'s application', function () {
    $application = Application::factory()->create();

    $this->actingAs(User::factory()->create())
        ->get(route('journey.consent', $application->public_id))
        ->assertNotFound();
});

it('sends the borrower back to their current stage when they skip ahead', function () {
    $application = Application::factory()->atStage(ApplicationStage::Consent)->create();

    $this->actingAs($application->user)
        ->get(route('journey.documents', $application->public_id))
        ->assertRedirect(route('journey.consent', $application->public_id));
});

it('rejects consent when a required item is missing', function () {
    $application = Application::factory()->create();

    $this->actingAs($application->user)
        ->post(route('journey.consent.store', $application->public_id), ['consents' => ['personal_information' => true]])
        ->assertSessionHasErrors(['consents.credit_check' => 'This consent is needed to continue.']);

    expect($application->fresh()->stage)->toBe(ApplicationStage::Consent);
});

it('rejects a signature that does not match the account name', function () {
    $this->seed(DisclosureTemplateSeeder::class);
    $application = Application::factory()->atStage(ApplicationStage::Sign)->create();

    $this->actingAs($application->user)
        ->withSession(['signing_step_up_until' => now()->addMinutes(10)->getTimestamp()])
        ->post(route('journey.sign.store', [$application->public_id, DisclosureTemplate::first()->id]), [
            'acknowledged' => '1',
            'signed_name' => 'Somebody Else',
        ])
        ->assertSessionHasErrors(['signed_name' => 'Type your full name exactly as it appears on your account.']);

    expect($application->signatures()->count())->toBe(0);
});

it('refuses to finish while a disclosure is unsigned', function () {
    $this->seed(DisclosureTemplateSeeder::class);
    $application = Application::factory()->atStage(ApplicationStage::Finish)->create();

    $this->actingAs($application->user)
        ->post(route('journey.finish.store', $application->public_id))
        ->assertSessionHasErrors(['signatures' => 'Please sign every document first.']);

    expect($application->fresh()->submitted_at)->toBeNull();
});
