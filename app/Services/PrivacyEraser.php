<?php

namespace App\Services;

use App\Models\Document;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Executes an approved deletion request: removes personal data that is not under a
 * legal retention obligation and de-identifies the rest. Signed disclosures and the
 * audit trail are kept, as the law requires.
 */
class PrivacyEraser
{
    public function __construct(private AuditLogger $audit) {}

    public function erase(User $user): void
    {
        DB::transaction(function () use ($user) {
            foreach ($user->applications as $application) {
                $application->documents()->each(function (Document $document) {
                    if ($document->storage_path !== '') {
                        Storage::disk('local')->delete($document->storage_path);
                    }
                    $document->update(['storage_path' => '', 'original_name' => 'deleted', 'extracted' => null]);
                });

                $application->advisorMessages()->delete();
                $application->advisorNotes()->delete();
                $application->messages()->delete();
                $application->update(['data' => [], 'provenance' => []]);
            }

            $user->forceFill([
                'name' => 'Deleted borrower #'.$user->id,
                'email' => 'deleted-'.$user->id.'@invalid.mega',
                'mobile' => null,
                'status' => 'deleted',
                'password' => bin2hex(random_bytes(16)),
                'last_login_ip' => null,
                'last_login_user_agent' => null,
            ])->save();

            DB::table('sessions')->where('user_id', $user->id)->delete();
        });

        $this->audit->record('privacy.erased', $user, reason: 'Approved deletion request');
    }
}
