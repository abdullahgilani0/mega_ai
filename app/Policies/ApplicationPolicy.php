<?php

namespace App\Policies;

use App\Enums\AllocationStatus;
use App\Enums\ApplicationStatus;
use App\Enums\Permission;
use App\Models\Application;
use App\Models\User;

/**
 * Attribute-based rules on top of role permissions: borrowers see only their own
 * applications, brokers only those allocated or currently offered to them.
 */
class ApplicationPolicy
{
    public function view(User $user, Application $application): bool
    {
        return $this->owns($user, $application)
            || $this->isAllocatedBroker($user, $application)
            || $this->hasPendingOffer($user, $application)
            || $user->hasPermission(Permission::ViewAllApplications);
    }

    /**
     * Borrower journey actions: the owner, while the application is still in progress.
     */
    public function continue(User $user, Application $application): bool
    {
        return $this->owns($user, $application)
            && $user->hasPermission(Permission::ApplyForLoan)
            && $application->status === ApplicationStatus::InProgress;
    }

    public function work(User $user, Application $application): bool
    {
        return $user->hasPermission(Permission::WorkAllocatedApplications)
            && $this->isAllocatedBroker($user, $application);
    }

    private function owns(User $user, Application $application): bool
    {
        return $application->user_id === $user->id;
    }

    private function isAllocatedBroker(User $user, Application $application): bool
    {
        return $user->broker !== null && $application->broker_id === $user->broker->id;
    }

    private function hasPendingOffer(User $user, Application $application): bool
    {
        return $user->broker !== null && $application->allocations()
            ->where('broker_id', $user->broker->id)
            ->where('status', AllocationStatus::Offered)
            ->exists();
    }
}
