<?php

use App\Enums\Permission;
use App\Enums\Role;
use App\Models\AccessGrant;
use App\Models\Application;
use App\Models\ApprovalRequest;
use App\Models\AuditLog;
use App\Models\DataRequest;
use App\Models\User;
use App\Notifications\ApprovalNeededNotification;
use App\Notifications\BreakGlassNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();
    $this->superA = User::factory()->role(Role::SuperAdmin)->create();
    $this->superB = User::factory()->role(Role::SuperAdmin)->create();
});

it('changes a role only after a second super admin approves', function () {
    $target = User::factory()->role(Role::Processor)->create();

    $this->actingAs($this->superA)
        ->patch(route('admin.users.role', $target), ['role' => 'admin', 'reason' => 'Promoted to operations manager']);

    $request = ApprovalRequest::sole();
    expect($target->fresh()->role)->toBe(Role::Processor);
    Notification::assertSentTo($this->superB, ApprovalNeededNotification::class);

    $this->actingAs($this->superA)
        ->post(route('admin.approvals.decide', $request), ['approve' => true])
        ->assertSessionHasErrors(['approval' => 'A different super admin must approve this request.']);
    expect($target->fresh()->role)->toBe(Role::Processor);

    $this->actingAs($this->superB)->post(route('admin.approvals.decide', $request), ['approve' => true, 'note' => 'Confirmed with HR']);

    expect($target->fresh()->role)->toBe(Role::Admin)
        ->and($request->fresh()->status)->toBe('executed');
});

it('does nothing when the second super admin rejects', function () {
    $target = User::factory()->create();
    $this->actingAs($this->superA)->patch(route('admin.users.role', $target), ['role' => 'super_admin', 'reason' => 'Test']);

    $this->actingAs($this->superB)->post(route('admin.approvals.decide', ApprovalRequest::sole()), ['approve' => false, 'note' => 'Not justified']);

    expect($target->fresh()->role)->toBe(Role::Borrower)
        ->and(ApprovalRequest::sole()->status)->toBe('rejected');
});

it('invites privileged staff with least privilege until approved', function () {
    $this->actingAs($this->superA)->post(route('admin.users.store'), [
        'name' => 'New Admin',
        'email' => 'new.admin@mega.test',
        'role' => 'admin',
        'reason' => 'New operations manager',
    ]);

    expect(User::where('email', 'new.admin@mega.test')->sole()->role)->toBe(Role::Auditor)
        ->and(ApprovalRequest::where('action', 'role_change')->sole()->payload['role'])->toBe('admin');
});

it('suspends a user and ends their sessions', function () {
    $admin = User::factory()->role(Role::Admin)->create();
    $target = User::factory()->role(Role::Processor)->create();

    $this->actingAs($admin)->patch(route('admin.users.status', $target), ['status' => 'suspended', 'reason' => 'Left the company']);

    expect($target->fresh()->status)->toBe('suspended')
        ->and($target->fresh()->hasPermission(Permission::AccessConsole))->toBeFalse();
});

it('requires a stated reason before staff can open a borrower file', function () {
    $application = Application::factory()->create();
    $processor = User::factory()->role(Role::Processor)->create();

    $this->actingAs($processor)
        ->get(route('admin.applications.show', $application->public_id))
        ->assertInertia(fn ($page) => $page->component('admin/applications/access-required'));

    $this->actingAs($processor)
        ->post(route('admin.access.store', $application->public_id), ['reason' => 'Checking an escalated question'])
        ->assertRedirect(route('admin.applications.show', $application->public_id));

    $this->actingAs($processor)
        ->get(route('admin.applications.show', $application->public_id))
        ->assertInertia(fn ($page) => $page->component('admin/applications/show'));

    expect(AuditLog::where('subject_type', 'Application')->where('subject_id', $application->id)->where('actor_id', $processor->id)->pluck('reason'))
        ->toContain('Checking an escalated question');
});

it('stops access when the grant expires', function () {
    $application = Application::factory()->create();
    $admin = User::factory()->role(Role::Admin)->create();
    AccessGrant::create(['user_id' => $admin->id, 'application_id' => $application->id, 'reason' => 'Review', 'expires_at' => now()->addMinutes(5)]);

    $this->travel(6)->minutes();

    $this->actingAs($admin)
        ->get(route('admin.applications.show', $application->public_id))
        ->assertInertia(fn ($page) => $page->component('admin/applications/access-required'));
});

it('alerts admins when a super admin breaks glass, and forbids it for others', function () {
    $application = Application::factory()->create();
    $admin = User::factory()->role(Role::Admin)->create();

    $this->actingAs($admin)
        ->post(route('admin.access.break-glass', $application->public_id), ['reason' => 'Suspected account takeover in progress'])
        ->assertForbidden();

    $this->actingAs($this->superA)
        ->post(route('admin.access.break-glass', $application->public_id), ['reason' => 'Suspected account takeover in progress']);

    expect(AccessGrant::sole()->break_glass)->toBeTrue();
    Notification::assertSentTo($admin, BreakGlassNotification::class);
});

it('erases a borrower only after a deletion request passes four-eyes approval', function () {
    $borrower = User::factory()->create(['email' => 'leaving@example.com']);
    $application = Application::factory()->create(['user_id' => $borrower->id]);
    $application->advisorMessages()->create(['role' => 'user', 'body' => 'Private detail']);

    $this->actingAs($borrower)->post(route('privacy.deletion'));
    $dataRequest = DataRequest::sole();

    $this->actingAs(User::factory()->role(Role::Admin)->create())
        ->patch(route('admin.data-requests.update', $dataRequest), ['decision' => 'approve', 'notes' => 'Identity confirmed by phone']);

    expect($borrower->fresh()->email)->toBe('leaving@example.com');

    $this->actingAs($this->superB)->post(route('admin.approvals.decide', ApprovalRequest::sole()), ['approve' => true]);

    expect($borrower->fresh())
        ->email->toBe('deleted-'.$borrower->id.'@invalid.mega')
        ->status->toBe('deleted')
        ->and($application->advisorMessages()->count())->toBe(0)
        ->and($dataRequest->fresh()->status)->toBe('completed');
});

it('applies platform settings at runtime and validates weights', function () {
    $this->actingAs($this->superA)->patch(route('admin.settings.update'), ['key' => 'allocation.offer_window_minutes', 'value' => 30]);
    expect(config('mega.allocation.offer_window_minutes'))->toBe(30);

    $this->actingAs($this->superA)
        ->patch(route('admin.settings.update'), ['key' => 'matching.weights', 'value' => ['approval_confidence' => 0.5, 'cost' => 0.5, 'speed' => 0.5, 'feature_fit' => 0]])
        ->assertSessionHasErrors(['value' => 'Weights must add up to 1.']);
});

it('sends staff without two-factor to set it up when enforcement is on', function () {
    config(['mega.security.require_staff_mfa' => true]);

    $this->actingAs(User::factory()->role(Role::Admin)->create())
        ->get(route('admin.overview'))
        ->assertRedirect(route('security.edit'));

    $this->actingAs(User::factory()->role(Role::Admin)->withTwoFactor()->create())
        ->get(route('admin.overview'))
        ->assertOk();
});

it('releases the audit export only to the requester after approval', function () {
    $this->actingAs($this->superA)->post(route('admin.audit.export'), ['reason' => 'Quarterly compliance review']);
    $export = ApprovalRequest::sole();

    $this->actingAs($this->superA)->get(route('admin.audit.download', $export))->assertNotFound();

    $this->actingAs($this->superB)->post(route('admin.approvals.decide', $export), ['approve' => true]);

    $this->actingAs($this->superA)->get(route('admin.audit.download', $export))->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
    $this->actingAs($this->superB)->get(route('admin.audit.download', $export))->assertNotFound();
});
