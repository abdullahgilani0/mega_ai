<?php

namespace App\Http\Controllers\Journey;

use App\Enums\ApplicationStage;
use App\Enums\DocumentKind;
use App\Enums\IdentityResult;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\IdentityCheck;
use App\Services\IdentityVerification;
use App\Support\JourneyPresenter;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class IdentityController extends Controller
{
    public function __construct(private IdentityVerification $identity) {}

    public function show(Application $application): Response
    {
        JourneyController::guard($application, ApplicationStage::Identity);

        $check = $application->latestIdentityCheck;
        $pending = $check?->result === IdentityResult::Pending;
        $handoffUrl = $pending ? $this->identity->handoffUrl($check) : null;

        return Inertia::render('journey/identity', [
            'application' => JourneyPresenter::summary($application),
            'check' => $check ? self::present($check) : null,
            'attemptsRemaining' => max(0, config('mega.identity.max_attempts') - $application->identityChecks()->count()),
            'handoff' => $handoffUrl ? [
                'url' => $handoffUrl,
                'qrSvg' => (new Writer(new ImageRenderer(new RendererStyle(220, 1), new SvgImageBackEnd)))->writeString($handoffUrl),
            ] : null,
        ]);
    }

    public function start(Request $request, Application $application): RedirectResponse
    {
        JourneyController::guard($application, ApplicationStage::Identity);

        $validated = $request->validate([
            'document_type' => ['required', Rule::in([DocumentKind::DriverLicence->value, DocumentKind::Passport->value])],
            'id_image' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,heic,pdf', 'max:15360'],
        ]);

        $this->identity->start($application, DocumentKind::from($validated['document_type']), $request->file('id_image'));

        return to_route('journey.identity', $application);
    }

    /**
     * Phone-only path: the borrower is already on a phone, so skip the QR hand-off.
     */
    public function complete(Application $application): RedirectResponse
    {
        JourneyController::guard($application, ApplicationStage::Identity);

        $check = $application->latestIdentityCheck;
        abort_if($check === null, 404);

        $this->identity->complete($check, 'this_device');

        return to_route('journey.identity', $application);
    }

    /**
     * @return array<string, mixed>
     */
    public static function present(IdentityCheck $check): array
    {
        return [
            'id' => $check->id,
            'result' => $check->result->value,
            'documentType' => $check->document_type,
            'attempt' => $check->attempts,
            'advice' => $check->evidence['advice'] ?? null,
            'completedOn' => $check->completed_on,
        ];
    }
}
