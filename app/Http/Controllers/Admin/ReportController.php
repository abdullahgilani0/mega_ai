<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AllocationStatus;
use App\Enums\ApplicationStage;
use App\Enums\MatchOutcome;
use App\Http\Controllers\Controller;
use App\Models\Allocation;
use App\Models\Application;
use App\Models\AuthenticityReport;
use App\Models\Broker;
use App\Models\Lender;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Operational reports from live records: funnel drop-off, allocation speed and
 * fairness, lender pass rates and authenticity review outcomes.
 */
class ReportController extends Controller
{
    public function __invoke(): Response
    {
        $byStage = Application::query()->selectRaw('stage, count(*) as total')->groupBy('stage')->pluck('total', 'stage');
        $reached = [];
        $running = 0;

        foreach (array_reverse(ApplicationStage::cases()) as $stage) {
            $running += (int) ($byStage[$stage->value] ?? 0);
            $reached[$stage->value] = $running;
        }

        $allocations = Allocation::query()->get(['broker_id', 'status', 'offered_at', 'responded_at', 'score']);
        $totalAccepted = max(1, $allocations->where('status', AllocationStatus::Accepted)->count());

        $results = DB::table('match_results')
            ->select('lender_id', DB::raw('count(*) as total'), DB::raw("sum(case when outcome = 'pass' then 1 else 0 end) as passed"), DB::raw("sum(case when outcome = 'unsure' then 1 else 0 end) as unsure"))
            ->groupBy('lender_id')
            ->get()
            ->keyBy('lender_id');

        $reviewed = AuthenticityReport::whereNotNull('decision')->get(['decision']);

        return Inertia::render('admin/reports', [
            'funnel' => collect(ApplicationStage::cases())->map(fn (ApplicationStage $stage) => [
                'stage' => $stage->label(),
                'reached' => $reached[$stage->value],
            ]),
            'brokers' => Broker::with('user:id,name')->get()->map(function (Broker $broker) use ($allocations, $totalAccepted) {
                $mine = $allocations->where('broker_id', $broker->id);
                $responded = $mine->filter(fn ($allocation) => $allocation->responded_at !== null && $allocation->score > 0);

                return [
                    'name' => $broker->user->name,
                    'offered' => $mine->count(),
                    'accepted' => $mine->where('status', AllocationStatus::Accepted)->count(),
                    'declined' => $mine->where('status', AllocationStatus::Declined)->count(),
                    'expired' => $mine->where('status', AllocationStatus::Expired)->count(),
                    'avgMinutes' => $responded->isEmpty() ? null : round($responded->avg(fn ($allocation) => $allocation->offered_at->diffInMinutes($allocation->responded_at)), 1),
                    'share' => round($mine->where('status', AllocationStatus::Accepted)->count() / $totalAccepted * 100, 1),
                ];
            })->sortByDesc('offered')->values(),
            'lenders' => Lender::orderBy('name')->get(['id', 'name', 'brand_color'])->map(fn (Lender $lender) => [
                'name' => $lender->name,
                'color' => $lender->brand_color,
                'evaluated' => (int) ($results[$lender->id]->total ?? 0),
                'passRate' => isset($results[$lender->id]) && $results[$lender->id]->total > 0
                    ? round($results[$lender->id]->passed / $results[$lender->id]->total * 100) : null,
                'manualCheck' => (int) ($results[$lender->id]->unsure ?? 0),
            ])->filter(fn (array $row) => $row['evaluated'] > 0)->sortByDesc('evaluated')->take(25)->values(),
            'authenticity' => [
                'reviewed' => $reviewed->count(),
                'cleared' => $reviewed->where('decision', 'cleared')->count(),
                'confirmed' => $reviewed->where('decision', 'confirmed_concern')->count(),
            ],
            'outcomes' => [
                'pass' => DB::table('match_results')->where('outcome', MatchOutcome::Pass->value)->count(),
                'fail' => DB::table('match_results')->where('outcome', MatchOutcome::Fail->value)->count(),
                'unsure' => DB::table('match_results')->where('outcome', MatchOutcome::Unsure->value)->count(),
            ],
        ]);
    }
}
