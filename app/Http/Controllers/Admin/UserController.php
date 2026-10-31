<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\ApprovalRequest;
use App\Models\User;
use App\Services\ApprovalService;
use App\Services\AuditLogger;
use App\Support\AustralianMobile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Roles that can only be granted through a second super admin's approval.
     */
    private const PRIVILEGED = [Role::Admin, Role::SuperAdmin];

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', Rule::enum(Role::class)],
        ]);
        $search = $filters['search'] ?? null;

        return Inertia::render('admin/users', [
            'users' => User::query()
                ->when($search, fn ($query) => $query->where(fn ($inner) => $inner->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")))
                ->when($filters['role'] ?? null, fn ($query, $role) => $query->where('role', $role))
                ->orderBy('name')
                ->paginate(30)
                ->withQueryString()
                ->through(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role->value,
                    'roleLabel' => $user->role->label(),
                    'status' => $user->status,
                    'mobileVerified' => $user->hasVerifiedMobile(),
                    'emailVerified' => $user->email_verified_at !== null,
                    'mfa' => $user->two_factor_confirmed_at !== null,
                    'lastLoginAt' => $user->last_login_at?->toIso8601String(),
                    'pendingRole' => ApprovalRequest::where('action', 'role_change')->where('subject_id', $user->id)->where('status', 'pending')->value('payload')['role'] ?? null,
                ]),
            'roles' => array_map(fn (Role $role) => ['value' => $role->value, 'label' => $role->label()], Role::cases()),
            'filters' => $filters,
            'canAssignRoles' => $request->user()->can('roles.assign'),
        ]);
    }

    /**
     * Create a staff or borrower account and email a link to set a password.
     */
    public function store(Request $request, ApprovalService $approvals, AuditLogger $audit): RedirectResponse
    {
        $request->merge(['mobile' => $request->filled('mobile') ? AustralianMobile::normalise((string) $request->input('mobile')) : null]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique(User::class)],
            'mobile' => ['nullable', 'regex:'.AustralianMobile::PATTERN, Rule::unique(User::class)],
            'role' => ['required', Rule::enum(Role::class)],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $requested = Role::from($validated['role']);
        $privileged = in_array($requested, self::PRIVILEGED, true);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'mobile' => $validated['mobile'],
            'password' => Str::password(32),
        ]);
        $user->forceFill([
            'role' => $privileged ? Role::Auditor : $requested,
            'email_verified_at' => now(),
            'mobile_verified_at' => $validated['mobile'] ? now() : null,
        ])->save();

        $audit->record('user.created', $user, after: ['role' => $user->role->value], reason: $validated['reason']);

        if ($privileged) {
            $approvals->request($request->user(), 'role_change', $user, ['role' => $requested->value, 'from' => $user->role->value], $validated['reason']);
        }

        Password::sendResetLink(['email' => $user->email]);

        Inertia::flash('toast', ['type' => 'success', 'message' => $privileged
            ? "Invite sent. {$requested->label()} access needs a second super admin's approval."
            : 'Invite sent: they will set their own password.']);

        return back();
    }

    public function updateRole(Request $request, User $user, ApprovalService $approvals): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', Rule::enum(Role::class)],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        if ($user->is($request->user())) {
            throw ValidationException::withMessages(['role' => 'You cannot change your own role.']);
        }

        $approvals->request($request->user(), 'role_change', $user, ['role' => $validated['role'], 'from' => $user->role->value], $validated['reason']);

        Inertia::flash('toast', ['type' => 'info', 'message' => 'Role change sent to a second super admin for approval.']);

        return back();
    }

    public function updateStatus(Request $request, User $user, AuditLogger $audit): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'suspended'])],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        if ($user->is($request->user()) || ($user->role === Role::SuperAdmin && $request->user()->role !== Role::SuperAdmin)) {
            throw ValidationException::withMessages(['status' => 'You cannot change this account’s status.']);
        }

        $before = ['status' => $user->status];
        $user->forceFill(['status' => $validated['status']])->save();

        if ($validated['status'] === 'suspended') {
            $user->sessions()->delete();
        }

        $audit->record('user.status_changed', $user, $before, ['status' => $validated['status']], $validated['reason']);

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$user->name} is now {$validated['status']}."]);

        return back();
    }
}
