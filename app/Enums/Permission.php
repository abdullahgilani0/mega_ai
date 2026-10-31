<?php

namespace App\Enums;

enum Permission: string
{
    case ApplyForLoan = 'loan.apply';
    case WorkAllocatedApplications = 'broker.work';
    case AccessConsole = 'console.access';
    case ViewAllApplications = 'applications.view_all';
    case ReviewDocuments = 'documents.review';
    case ViewAuthenticity = 'authenticity.view';
    case ManageLenders = 'lenders.manage';
    case PublishPolicies = 'policies.publish';
    case ManageAllocations = 'allocations.manage';
    case ManageBrokers = 'brokers.manage';
    case ManageUsers = 'users.manage';
    case AssignRoles = 'roles.assign';
    case ViewAuditLog = 'audit.view';
    case ViewReports = 'reports.view';
    case ManageSettings = 'settings.manage';
    case ReviewApprovals = 'approvals.review';
    case BreakGlass = 'access.break_glass';
    case HandleDataRequests = 'privacy.requests';
}
