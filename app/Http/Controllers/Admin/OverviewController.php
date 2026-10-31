<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AllocationStatus;
use App\Enums\ApplicationStatus;
use App\Enums\LenderCoverage;
use App\Http\Controllers\Controller;
use App\Models\Allocation;
use App\Models\Application;
use App\Models\AuditLog;
use App\Models\AuthenticityReport;
use App\Models\Lender;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OverviewController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $accepted = Allocation::where('status', AllocationStatus::Accepted)->whereNotNull('responded_at')->where('score', '>', 0)->get(['offered_at', 'responded_at']);

        return Inertia::render('admin/overview', [
            'metrics' => [
                'applications' => Application::count(),
                'inProgress' => Application::where('status', ApplicationStatus::InProgress)->count(),
                'awaitingBroker' => Application::whereIn('status', [ApplicationStatus::Allocating, ApplicationStatus::Unallocated])->count(),
                'unallocated' => Application::where('status', ApplicationStatus::Unallocated)->count(),
                'flagsOpen' => $user->can('authenticity.view')
                    ? AuthenticityReport::where('score', '>=', config('mega.authenticity.review_threshold'))->whereNull('decision')->count()
                    : null,
                'lenders' => Lender::where('status', 'active')->count(),
                'avgMinutesToAccept' => $accepted->isEmpty() ? null : round($accepted->avg(fn ($allocation) => $allocation->offered_at->diffInMinutes($allocation->responded_at)), 1),
            ],
            'funnel' => Application::query()
                ->selectRaw('stage, count(*) as total')
                ->groupBy('stage')
                ->pluck('total', 'stage'),
            'coverage' => collect(LenderCoverage::cases())->mapWithKeys(fn (LenderCoverage $coverage) => [
                $coverage->value => Lender::where('coverage', $coverage)->count(),
            ]),
            'recentAudit' => $user->can('audit.view')
                ? AuditLog::with('actor:id,name')->latest('id')->limit(8)->get()->map(fn (AuditLog $log) => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'actor' => $log->actor_id === null ? 'System' : $log->actor->name,
                    'subject' => $log->subject_type ? $log->subject_type.' #'.$log->subject_id : null,
                    'at' => $log->created_at->toIso8601String(),
                ])
                : null,
        ]);
    }
}
