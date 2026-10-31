<?php

namespace App\Enums;

enum Role: string
{
    case Borrower = 'borrower';
    case Broker = 'broker';
    case Processor = 'processor';
    case CreditAnalyst = 'credit_analyst';
    case Admin = 'admin';
    case SuperAdmin = 'super_admin';
    case Auditor = 'auditor';

    public function label(): string
    {
        return match ($this) {
            self::Borrower => 'Borrower',
            self::Broker => 'Broker',
            self::Processor => 'Processor',
            self::CreditAnalyst => 'Credit analyst',
            self::Admin => 'Admin',
            self::SuperAdmin => 'Super admin',
            self::Auditor => 'Security / auditor',
        };
    }

    /**
     * The permissions granted to this role. Anything not listed is denied.
     *
     * @return list<Permission>
     */
    public function permissions(): array
    {
        return match ($this) {
            self::Borrower => [Permission::ApplyForLoan],
            self::Broker => [Permission::WorkAllocatedApplications],
            self::Processor => [
                Permission::AccessConsole,
                Permission::ViewAllApplications,
                Permission::ReviewDocuments,
            ],
            self::CreditAnalyst => [
                Permission::AccessConsole,
                Permission::ViewAllApplications,
                Permission::ReviewDocuments,
                Permission::ViewAuthenticity,
                Permission::ManageLenders,
                Permission::PublishPolicies,
            ],
            self::Admin => [
                Permission::AccessConsole,
                Permission::ViewAllApplications,
                Permission::ReviewDocuments,
                Permission::ViewAuthenticity,
                Permission::ManageAllocations,
                Permission::ManageBrokers,
                Permission::ManageUsers,
                Permission::ViewAuditLog,
                Permission::ViewReports,
                Permission::HandleDataRequests,
            ],
            self::SuperAdmin => Permission::cases(),
            self::Auditor => [
                Permission::AccessConsole,
                Permission::ViewAuditLog,
                Permission::ViewReports,
            ],
        };
    }

    public function isStaff(): bool
    {
        return in_array(Permission::AccessConsole, $this->permissions(), true);
    }
}
