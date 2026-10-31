import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ConsolePage,
    PageHeader,
    Pill,
    Table,
} from '@/components/mega/console';
import { Button } from '@/components/ui/button';
import { dateTime } from '@/lib/format';
import admin from '@/routes/admin';

type Grant = {
    id: number;
    user: string;
    role: string;
    applicationId: string;
    reason: string;
    breakGlass: boolean;
    active: boolean;
    expiresAt: string;
    reviewedAt: string | null;
    createdAt: string;
};

export default function Access({ grants }: { grants: Grant[] }) {
    const permissions = usePage().props.auth.permissions ?? [];
    const canManage = permissions.includes('access.break_glass');

    return (
        <>
            <Head title="Staff access" />
            <ConsolePage>
                <PageHeader
                    eyebrow="Just-in-time access"
                    title="Staff access log"
                    description="Staff open a borrower file only with a stated reason, for a limited time. Borrowers see these entries in their privacy centre. Break-glass access needs a post-incident review."
                />
                <Table>
                    <thead>
                        <tr>
                            <th>When</th>
                            <th>Staff member</th>
                            <th>Application</th>
                            <th>Reason</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {grants.map((grant) => (
                            <tr key={grant.id}>
                                <td className="text-xs text-muted-foreground">
                                    {dateTime(grant.createdAt)}
                                </td>
                                <td>
                                    {grant.user}
                                    <p className="text-xs text-muted-foreground">
                                        {grant.role}
                                    </p>
                                </td>
                                <td>
                                    <Link
                                        href={admin.applications.show(
                                            grant.applicationId,
                                        )}
                                        className="font-mono text-xs text-mega-bright"
                                    >
                                        {grant.applicationId.slice(0, 10)}…
                                    </Link>
                                </td>
                                <td className="max-w-72 text-sm">
                                    {grant.reason}
                                </td>
                                <td>
                                    {grant.breakGlass ? (
                                        <Pill tone="error">Break-glass</Pill>
                                    ) : (
                                        <Pill>Standard</Pill>
                                    )}
                                </td>
                                <td>
                                    {grant.active ? (
                                        <Pill tone="ok">
                                            Active until{' '}
                                            {dateTime(grant.expiresAt)}
                                        </Pill>
                                    ) : (
                                        <Pill>Expired</Pill>
                                    )}
                                    {grant.breakGlass &&
                                        (grant.reviewedAt ? (
                                            <p className="mt-1 text-[11px] text-ok">
                                                Reviewed{' '}
                                                {dateTime(grant.reviewedAt)}
                                            </p>
                                        ) : (
                                            <p className="mt-1 text-[11px] text-warn">
                                                Review required
                                            </p>
                                        ))}
                                </td>
                                <td className="space-x-1 text-right whitespace-nowrap">
                                    {canManage && grant.active && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                router.post(
                                                    admin.access.revoke.url(
                                                        grant.id,
                                                    ),
                                                    {},
                                                    { preserveScroll: true },
                                                )
                                            }
                                        >
                                            Revoke
                                        </Button>
                                    )}
                                    {canManage &&
                                        grant.breakGlass &&
                                        !grant.reviewedAt && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    router.post(
                                                        admin.access.review.url(
                                                            grant.id,
                                                        ),
                                                        {},
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            >
                                                Mark reviewed
                                            </Button>
                                        )}
                                </td>
                            </tr>
                        ))}
                        {grants.length === 0 && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="text-center text-muted-foreground"
                                >
                                    No staff have accessed borrower files yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </ConsolePage>
        </>
    );
}

Access.layout = {
    breadcrumbs: [{ title: 'Staff access', href: admin.access.index() }],
};
