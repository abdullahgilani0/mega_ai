<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\Allocation;
use App\Models\Application;
use App\Services\AuditLogger;
use App\Services\FileAccess;
use App\Support\ApplicationDossier;
use App\Support\JourneyPresenter;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::enum(ApplicationStatus::class)],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $applications = Application::query()
            ->with(['user:id,name,email', 'broker.user:id,name'])
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($inner) => $inner
                ->where('postcode', $search)
                ->orWhere('public_id', $search)
                ->orWhereHas('user', fn ($user) => $user->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))))
            ->latest('id')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Application $application) => [
                ...JourneyPresenter::summary($application),
                'borrowerName' => $application->user->name,
                'brokerName' => $application->broker?->user->name,
            ]);

        return Inertia::render('admin/applications/index', [
            'applications' => $applications,
            'filters' => $filters,
            'statuses' => array_map(fn (ApplicationStatus $status) => ['value' => $status->value, 'label' => $status->label()], ApplicationStatus::cases()),
        ]);
    }

    public function show(Request $request, Application $application, AuditLogger $audit, FileAccess $access): Response
    {
        $grant = $access->activeGrant($request->user(), $application);

        if ($grant === null) {
            return Inertia::render('admin/applications/access-required', [
                'application' => [
                    'id' => $application->public_id,
                    'loanPackLabel' => $application->loan_pack->label(),
                    'region' => $application->state.' '.$application->postcode,
                    'statusLabel' => $application->status->label(),
                ],
                'grantMinutes' => config('mega.access.grant_minutes'),
                'canBreakGlass' => $request->user()->can('access.break_glass'),
            ]);
        }

        $audit->record('application.viewed', $application, reason: $grant->reason);

        return Inertia::render('admin/applications/show', [
            'grant' => [
                'reason' => $grant->reason,
                'breakGlass' => $grant->break_glass,
                'expiresAt' => $grant->expires_at->toIso8601String(),
            ],
            'dossier' => ApplicationDossier::build($application, staffView: true),
            'allocations' => $application->allocations()->with('broker.user:id,name')->latest('id')->get()->map(fn (Allocation $allocation) => [
                'id' => $allocation->id,
                'broker' => $allocation->broker->user->name,
                'status' => $allocation->status->value,
                'score' => $allocation->score,
                'reasons' => $allocation->reasons,
                'offeredAt' => $allocation->offered_at->toIso8601String(),
                'respondedAt' => $allocation->responded_at?->toIso8601String(),
            ]),
        ]);
    }
}
