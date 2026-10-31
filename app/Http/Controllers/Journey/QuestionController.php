<?php

namespace App\Http\Controllers\Journey;

use App\Enums\ApplicationStage;
use App\Enums\DocumentKind;
use App\Enums\DocumentStatus;
use App\Enums\GapStatus;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\ApplicationGap;
use App\Services\ApplicationTimeline;
use App\Services\Documents\DocumentIntake;
use App\Support\JourneyPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuestionController extends Controller
{
    private const FIELD_INPUTS = [
        'income_annual' => 'money',
        'expenses_monthly' => 'money',
        'liabilities_monthly' => 'money',
        'property_value' => 'money',
        'asset_price' => 'money',
        'annual_turnover' => 'money',
        'dependants' => 'count',
        'employment_months' => 'months',
        'time_in_business_months' => 'months',
        'asset_age_years' => 'years',
    ];

    public function index(Application $application): Response
    {
        JourneyController::guard($application, ApplicationStage::Questions);

        $open = $application->gaps()->where('status', GapStatus::Open)->orderBy('priority')->orderBy('id')->get();

        return Inertia::render('journey/questions', [
            'application' => JourneyPresenter::summary($application),
            'gaps' => $open->take(config('mega.matching.max_open_gaps_shown'))->map(fn (ApplicationGap $gap) => [
                'id' => $gap->id,
                'kind' => $gap->kind,
                'field' => $gap->field,
                'prompt' => $gap->prompt,
                'input' => in_array($gap->kind, ['missing_document', 'unreadable_document'], true) ? 'document' : self::FIELD_INPUTS[$gap->field] ?? 'money',
            ])->values(),
            'remaining' => $open->count(),
            'resolved' => $application->gaps()->where('status', '!=', GapStatus::Open)->count(),
        ]);
    }

    public function resolve(Request $request, Application $application, ApplicationGap $gap, DocumentIntake $intake, ApplicationTimeline $timeline): RedirectResponse
    {
        JourneyController::guard($application, ApplicationStage::Questions);
        abort_unless($gap->application_id === $application->id && $gap->status === GapStatus::Open, 404);

        if ($request->boolean('cannot_answer')) {
            $gap->update(['status' => GapStatus::Escalated, 'resolved_at' => now()]);
            $timeline->record($application, 'gaps.escalated', ['gap_id' => $gap->id]);
            Inertia::flash('toast', ['type' => 'info', 'message' => 'No problem. Your broker will help with this one.']);

            return back();
        }

        if (in_array($gap->kind, ['missing_document', 'unreadable_document'], true)) {
            $request->validate(['file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp,heic', 'max:15360']]);

            $document = $intake->store($application, $request->file('file'), DocumentKind::tryFrom((string) $gap->field) ?? DocumentKind::Other);

            if ($document->status === DocumentStatus::NeedsAttention) {
                $gap->update(['prompt' => $document->attention_reason]);

                return back();
            }
        } else {
            $validated = $request->validate(['value' => ['required', 'numeric', 'min:0', 'max:100000000']]);
            $application->setFact((string) $gap->field, (float) $validated['value'], 'borrower_answer');
            $application->save();
        }

        $gap->update(['status' => GapStatus::Resolved, 'resolved_at' => now()]);
        $timeline->record($application, 'gaps.resolved', ['gap_id' => $gap->id, 'field' => $gap->field]);

        return back();
    }
}
