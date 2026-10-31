<?php

namespace App\Http\Controllers\Journey;

use App\Enums\ApplicationStage;
use App\Http\Controllers\Controller;
use App\Models\AdvisorMessage;
use App\Models\AdvisorNote;
use App\Models\Application;
use App\Services\ApplicationTimeline;
use App\Services\AuditLogger;
use App\Services\Vendors\Contracts\AdvisorModel;
use App\Support\JourneyPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdvisorController extends Controller
{
    public function show(Application $application): Response
    {
        JourneyController::guard($application, ApplicationStage::Advisor);

        return Inertia::render('journey/advisor', [
            'application' => JourneyPresenter::summary($application),
            'messages' => $application->advisorMessages()->orderBy('id')->get()->map(fn (AdvisorMessage $message) => [
                'id' => $message->id,
                'role' => $message->role,
                'body' => $message->body,
            ]),
            'notes' => $application->advisorNotes()->whereNull('dismissed_at')->orderBy('id')->get()->map(fn (AdvisorNote $note) => [
                'id' => $note->id,
                'field' => $note->field,
                'value' => $note->value,
                'fact' => $note->fact,
                'confirmed' => $note->confirmed_at !== null,
            ]),
        ]);
    }

    public function message(Request $request, Application $application, AdvisorModel $advisor, ApplicationTimeline $timeline): RedirectResponse
    {
        JourneyController::guard($application, ApplicationStage::Advisor);

        $validated = $request->validate(['body' => ['required', 'string', 'max:1000']]);

        $history = $application->advisorMessages()->orderBy('id')->get();
        $userMessage = $application->advisorMessages()->create(['role' => 'user', 'body' => $validated['body']]);

        $response = $advisor->respond($application, $history, $validated['body']);

        $application->advisorMessages()->create(['role' => 'assistant', 'body' => $response['reply']]);

        foreach ($response['notes'] as $note) {
            $application->advisorNotes()->create([...$note, 'advisor_message_id' => $userMessage->id]);
        }

        $timeline->record($application, 'advisor.message', ['model' => $advisor->name(), 'notes' => count($response['notes'])]);

        return back();
    }

    /**
     * The borrower confirms (optionally correcting) or dismisses a note.
     */
    public function update(Request $request, Application $application, AdvisorNote $note, AuditLogger $audit): RedirectResponse
    {
        JourneyController::guard($application, ApplicationStage::Advisor);
        abort_unless($note->application_id === $application->id, 404);

        $validated = $request->validate([
            'action' => ['required', Rule::in(['confirm', 'dismiss'])],
            'value' => ['nullable', 'numeric', 'min:0', 'max:100000000'],
        ]);

        if ($validated['action'] === 'dismiss') {
            $note->update(['dismissed_at' => now()]);

            return back();
        }

        $value = $validated['value'] ?? $note->value;
        $note->update(['confirmed_at' => now(), 'value' => $value]);

        if ($note->field !== null && $value !== null) {
            $application->setFact($note->field, (float) $value, 'advisor_confirmed');
            $application->save();
        }

        $audit->record('advisor.note_confirmed', $note, after: ['field' => $note->field, 'value' => $value]);

        return back();
    }

    public function continue(Application $application): RedirectResponse
    {
        JourneyController::guard($application, ApplicationStage::Advisor);

        $application->advanceTo(ApplicationStage::Assessment);

        return to_route('journey.assessment', $application);
    }
}
