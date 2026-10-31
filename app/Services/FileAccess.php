<?php

namespace App\Services;

use App\Enums\Permission;
use App\Models\AccessGrant;
use App\Models\Application;
use App\Models\User;

/**
 * Who may read a borrower's file. Borrowers, accepted co-borrowers and the allocated
 * broker have standing access; staff need an active just-in-time grant.
 */
class FileAccess
{
    public function canRead(User $user, Application $application): bool
    {
        return $application->user_id === $user->id
            || $application->hasCoBorrower($user)
            || ($user->broker !== null && $application->broker_id === $user->broker->id)
            || $this->activeGrant($user, $application) !== null;
    }

    public function activeGrant(User $user, Application $application): ?AccessGrant
    {
        if (! $user->hasPermission(Permission::ViewAllApplications) && ! $user->hasPermission(Permission::ReviewDocuments)) {
            return null;
        }

        return AccessGrant::query()
            ->active()
            ->where('user_id', $user->id)
            ->where('application_id', $application->id)
            ->latest('id')
            ->first();
    }
}
