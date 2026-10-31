<?php

use App\Enums\ApplicationStage;
use App\Enums\DocumentKind;
use App\Enums\DocumentStatus;
use App\Enums\Role;
use App\Models\AccessGrant;
use App\Models\Application;
use App\Models\AuditLog;
use App\Models\Broker;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

it('declares a permission on every borrower, broker and console route', function () {
    $unguarded = collect(Route::getRoutes()->getRoutes())
        ->filter(fn ($route) => preg_match('/^(admin|broker|journey|apply|privacy|avatar)\./', (string) $route->getName()))
        ->reject(fn ($route) => collect($route->gatherMiddleware())->contains(fn ($middleware) => str_starts_with($middleware, 'can:')))
        ->map(fn ($route) => $route->getName())
        ->values()
        ->all();

    expect($unguarded)->toBe([]);
});

it('limits authenticity scores to admins, credit analysts and super admins', function (Role $role, bool $allowed) {
    expect(Gate::forUser(User::factory()->role($role)->make())->allows('authenticity.view'))->toBe($allowed);
})->with([
    [Role::Borrower, false],
    [Role::Broker, false],
    [Role::Processor, false],
    [Role::CreditAnalyst, true],
    [Role::Admin, true],
    [Role::SuperAdmin, true],
    [Role::Auditor, false],
]);

it('denies every permission to a suspended account', function () {
    $user = User::factory()->role(Role::SuperAdmin)->create(['status' => 'suspended']);

    expect(Gate::forUser($user)->allows('console.access'))->toBeFalse();
});

it('forbids borrowers from the staff console', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('admin.overview'))
        ->assertForbidden();
});

it('lets only super admins change roles', function () {
    $target = User::factory()->create();

    $this->actingAs(User::factory()->role(Role::Admin)->create())
        ->patch(route('admin.users.role', $target), ['role' => 'super_admin', 'reason' => 'Promotion'])
        ->assertForbidden();

    expect($target->fresh()->role)->toBe(Role::Borrower);
});

it('returns 404 when a broker opens an application allocated to someone else', function () {
    $application = Application::factory()->create(['broker_id' => Broker::factory()->create()->id]);
    $otherBroker = Broker::factory()->create();

    $this->actingAs($otherBroker->user)
        ->get(route('broker.applications.show', $application->public_id))
        ->assertNotFound();
});

it('never sends authenticity data to the borrower or the broker, only to admins', function () {
    $broker = Broker::factory()->create();
    $application = Application::factory()->atStage(ApplicationStage::Documents)->create(['broker_id' => $broker->id]);
    $document = $application->documents()->create([
        'kind' => DocumentKind::Payslip,
        'original_name' => 'payslip.pdf',
        'storage_path' => 'x/payslip.pdf',
        'sha256' => str_repeat('a', 64),
        'mime_type' => 'application/pdf',
        'size_bytes' => 20000,
        'status' => DocumentStatus::InReview,
    ]);
    $document->authenticityReport()->create([
        'score' => 80,
        'reason_codes' => [['code' => 'metadata.editing_tool', 'detail' => 'Photoshop', 'weight' => 35]],
    ]);

    $borrowerPage = $this->actingAs($application->user)->get(route('journey.documents', $application->public_id));
    $brokerPage = $this->actingAs($broker->user)->get(route('broker.applications.show', $application->public_id));
    $admin = User::factory()->role(Role::Admin)->create();
    AccessGrant::create(['user_id' => $admin->id, 'application_id' => $application->id, 'reason' => 'Authenticity review', 'expires_at' => now()->addHour()]);
    $adminPage = $this->actingAs($admin)->get(route('admin.applications.show', $application->public_id));

    expect(json_encode($borrowerPage->viewData('page')['props']))->not->toContain('metadata.editing_tool')
        ->and(json_encode($brokerPage->viewData('page')['props']))->not->toContain('metadata.editing_tool')
        ->and(json_encode($adminPage->viewData('page')['props']))->toContain('metadata.editing_tool');
});

it('refuses to change or delete audit log entries', function () {
    $entry = AuditLog::create(['action' => 'test.entry', 'created_at' => now()]);

    expect(fn () => $entry->update(['action' => 'tampered']))->toThrow(LogicException::class)
        ->and(fn () => $entry->delete())->toThrow(LogicException::class);
});
