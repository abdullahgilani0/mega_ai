<?php

use App\Enums\ApplicationStatus;
use App\Enums\DocumentKind;
use App\Enums\IdentityResult;
use App\Models\AdvisorMessage;
use App\Models\Application;
use App\Models\Document;
use App\Models\MobileVerificationCode;
use App\Notifications\JourneyReminderNotification;
use App\Services\Allocation\AllocationEngine;
use App\Services\ApplicationTimeline;
use App\Services\AuditLogger;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Storage;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('allocations:expire', function (AllocationEngine $engine) {
    $this->info($engine->expireStaleOffers().' stale broker offers moved on.');
})->purpose('Expire broker offers past their accept window and offer the next broker');

Artisan::command('mega:retention', function (AuditLogger $audit) {
    $idCutoff = now()->subDays((int) config('mega.retention.id_images_days'));
    $purged = 0;

    Document::query()
        ->whereIn('kind', [DocumentKind::DriverLicence, DocumentKind::Passport])
        ->where('storage_path', '!=', '')
        ->where('created_at', '<', $idCutoff)
        ->whereHas('application.identityChecks', fn ($query) => $query->whereIn('result', [IdentityResult::Verified, IdentityResult::ManualReview]))
        ->each(function (Document $document) use (&$purged) {
            Storage::disk('local')->delete($document->storage_path);
            $document->update(['storage_path' => '']);
            $purged++;
        });

    $transcripts = AdvisorMessage::where('created_at', '<', now()->subDays((int) config('mega.retention.advisor_transcripts_days')))->delete();
    $codes = MobileVerificationCode::where('expires_at', '<', now()->subDay())->delete();

    $audit->record('retention.run', null, after: ['id_images_purged' => $purged, 'transcripts_deleted' => $transcripts, 'codes_deleted' => $codes]);
    $this->info("Purged {$purged} ID images, {$transcripts} old transcript messages and {$codes} expired codes.");
})->purpose('Apply the data retention schedule');

Artisan::command('mega:reminders', function (ApplicationTimeline $timeline) {
    $hours = (int) config('mega.reminders.after_hours');
    $sent = 0;

    Application::query()
        ->where('status', ApplicationStatus::InProgress)
        ->where('updated_at', '<', now()->subHours($hours))
        ->whereDoesntHave('events', fn ($query) => $query->where('type', 'reminder.sent')->where('occurred_at', '>', now()->subHours($hours)))
        ->with('user')
        ->each(function (Application $application) use ($timeline, &$sent) {
            $application->user->notify(new JourneyReminderNotification($application));
            $timeline->record($application, 'reminder.sent', ['stage' => $application->stage->value], $application->user_id);
            $sent++;
        });

    $this->info("Sent {$sent} reminders.");
})->purpose('Remind borrowers who paused their application');

Schedule::command('allocations:expire')->everyMinute()->withoutOverlapping();
Schedule::command('mega:reminders')->hourly()->withoutOverlapping();
Schedule::command('mega:retention')->dailyAt('02:30')->withoutOverlapping();
