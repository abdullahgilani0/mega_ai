import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    ConsolePage,
    PageHeader,
    Pill,
    Table,
    statusTone,
} from '@/components/mega/console';
import { Button } from '@/components/ui/button';
import { dateTime, humanize } from '@/lib/format';
import admin from '@/routes/admin';

type DataRequest = {
    id: number;
    user: string;
    email: string;
    type: string;
    status: string;
    notes: string | null;
    createdAt: string;
    handledAt: string | null;
};

export default function DataRequests({
    requests,
}: {
    requests: DataRequest[];
}) {
    return (
        <>
            <Head title="Data requests" />
            <ConsolePage>
                <PageHeader
                    eyebrow="Privacy Act"
                    title="Data requests"
                    description="Borrower deletion requests. Approving sends the request to a second super admin; signed disclosures and the audit trail are kept as the law requires."
                />
                <Table>
                    <thead>
                        <tr>
                            <th>Received</th>
                            <th>Borrower</th>
                            <th>Request</th>
                            <th>Status</th>
                            <th>Notes</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request) => (
                            <Row key={request.id} request={request} />
                        ))}
                        {requests.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="text-center text-muted-foreground"
                                >
                                    No requests.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </ConsolePage>
        </>
    );
}

function Row({ request }: { request: DataRequest }) {
    const [notes, setNotes] = useState('');
    const decide = (decision: 'approve' | 'reject') =>
        router.patch(
            admin.dataRequests.update.url(request.id),
            { decision, notes },
            { preserveScroll: true },
        );

    return (
        <tr className="align-top">
            <td className="text-xs text-muted-foreground">
                {dateTime(request.createdAt)}
            </td>
            <td>
                {request.user}
                <p className="text-xs text-muted-foreground">{request.email}</p>
            </td>
            <td>{humanize(request.type)}</td>
            <td>
                <Pill
                    tone={statusTone(
                        request.status === 'completed'
                            ? 'approved'
                            : request.status === 'open'
                              ? 'offered'
                              : request.status,
                    )}
                >
                    {humanize(request.status)}
                </Pill>
            </td>
            <td className="max-w-64 text-xs">{request.notes ?? '—'}</td>
            <td>
                {request.status === 'open' && (
                    <div className="flex flex-wrap justify-end gap-2">
                        <input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Notes (logged)"
                            className="h-8 w-48 rounded-md border border-input bg-transparent px-2 text-xs"
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={!notes}
                            onClick={() => decide('reject')}
                        >
                            Reject
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            disabled={!notes}
                            onClick={() => decide('approve')}
                        >
                            Approve deletion
                        </Button>
                    </div>
                )}
            </td>
        </tr>
    );
}

DataRequests.layout = {
    breadcrumbs: [{ title: 'Data requests', href: admin.dataRequests.index() }],
};
