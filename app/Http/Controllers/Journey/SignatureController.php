<?php

namespace App\Http\Controllers\Journey;

use App\Enums\ApplicationStage;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\DisclosureTemplate;
use App\Services\ApplicationTimeline;
use App\Services\AuditLogger;
use App\Services\MobileVerifier;
use App\Support\JourneyPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Number;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SignatureController extends Controller
{
    public function index(Application $application): Response
    {
        JourneyController::guard($application, ApplicationStage::Sign);

        $signed = $application->signatures()->get()->keyBy('disclosure_template_id');
        $values = $this->mergeValues($application);

        return Inertia::render('journey/sign', [
            'application' => JourneyPresenter::summary($application),
            'signerName' => $application->user->name,
            'documents' => DisclosureTemplate::current()->get()->map(fn (DisclosureTemplate $template) => [
                'id' => $template->id,
                'key' => $template->key,
                'title' => $template->title,
                'version' => $template->version,
                'summary' => $template->summary,
                'body' => $template->render($values),
                'signedAt' => $signed->get($template->id)?->signed_at->toIso8601String(),
                'hash' => $signed->get($template->id)?->document_hash,
                'signatureId' => $signed->get($template->id)?->id,
            ]),
            'stepUpValid' => self::stepUpValid(),
        ]);
    }

    /**
     * Send a one-time code to the verified mobile before signing.
     */
    public function sendStepUp(Request $request, Application $application, MobileVerifier $verifier): RedirectResponse
    {
        JourneyController::guard($application, ApplicationStage::Sign);

        $code = $verifier->send($request->user());

        if (app()->isLocal()) {
            Inertia::flash('devCode', $code);
        }

        Inertia::flash('toast', ['type' => 'info', 'message' => 'We sent a 6-digit code to your mobile.']);

        return back();
    }

    public function confirmStepUp(Request $request, Application $application, MobileVerifier $verifier): RedirectResponse
    {
        JourneyController::guard($application, ApplicationStage::Sign);

        $validated = $request->validate(['code' => ['required', 'digits:6']]);
        $verifier->confirm($request->user(), $validated['code']);

        $request->session()->put('signing_step_up_until', now()->addMinutes((int) config('mega.security.signing_step_up_minutes'))->getTimestamp());

        return back();
    }

    private static function stepUpValid(): bool
    {
        return (int) session('signing_step_up_until', 0) > now()->getTimestamp();
    }

    public function store(Request $request, Application $application, DisclosureTemplate $template, ApplicationTimeline $timeline, AuditLogger $audit): RedirectResponse
    {
        JourneyController::guard($application, ApplicationStage::Sign);
        abort_if($template->approved_at === null, 404);

        $validated = $request->validate([
            'acknowledged' => ['accepted'],
            'signed_name' => ['required', 'string', 'max:255'],
            'seconds_on_page' => ['nullable', 'integer', 'min:0', 'max:86400'],
        ], ['acknowledged.accepted' => 'Please confirm you have read this document.']);

        if (! self::stepUpValid()) {
            throw ValidationException::withMessages(['step_up' => 'Confirm it’s you with the code we text you before signing.']);
        }

        if (Str::lower(trim($validated['signed_name'])) !== Str::lower(trim($application->user->name))) {
            throw ValidationException::withMessages(['signed_name' => 'Type your full name exactly as it appears on your account.']);
        }

        if ($application->signatures()->where('disclosure_template_id', $template->id)->exists()) {
            return back();
        }

        $rendered = $template->render($this->mergeValues($application));

        $signature = $application->signatures()->create([
            'disclosure_template_id' => $template->id,
            'user_id' => $request->user()->id,
            'rendered_body' => $rendered,
            'document_hash' => hash('sha256', $rendered),
            'signed_name' => trim($validated['signed_name']),
            'seconds_on_page' => $validated['seconds_on_page'] ?? 0,
            'acknowledged_at' => now(),
            'signed_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $timeline->record($application, 'disclosure.signed', ['title' => $template->title, 'version' => $template->version]);
        $audit->record('disclosure.signed', $signature, after: ['template' => $template->key, 'version' => $template->version, 'sha256' => $signature->document_hash]);

        $outstanding = DisclosureTemplate::current()->whereNotIn('id', $application->signatures()->pluck('disclosure_template_id'))->exists();

        if (! $outstanding) {
            $application->advanceTo(ApplicationStage::Finish);

            return to_route('journey.finish', $application);
        }

        return back();
    }

    /**
     * Canonical data merged into the approved template.
     *
     * @return array<string, string>
     */
    private function mergeValues(Application $application): array
    {
        return [
            'borrower_name' => $application->user->name,
            'borrower_email' => $application->user->email,
            'loan_type' => $application->loan_pack->label(),
            'loan_amount' => Number::currency($application->amount, 'AUD', precision: 0) ?: '$'.number_format($application->amount),
            'lender_name' => $application->selectedMatch?->lender->name ?? 'the lender your broker recommends',
            'licensee_name' => Config::string('mega.licensee.name'),
            'licence_number' => Config::string('mega.licensee.licence_number'),
            'date' => now()->format('j F Y'),
        ];
    }
}
