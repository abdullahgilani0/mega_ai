import { Head, router } from '@inertiajs/react';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import {
    Card,
    ConsolePage,
    PageHeader,
    Pill,
    statusTone,
} from '@/components/mega/console';
import { Button } from '@/components/ui/button';
import { dateTime, humanize } from '@/lib/format';
import admin from '@/routes/admin';

type Approval = {
    id: number;
    action: string;
    actionLabel: string;
    subject: string | null;
    payload: Record<string, unknown>;
    reason: string;
    status: string;
    requester: string;
    mine: boolean;
    decider: string | null;
    decisionNote: string | null;
    createdAt: string;
    decidedAt: string | null;
};

export default function Approvals({
    pending,
    history,
}: {
    pending: Approval[];
    history: Approval[];
}) {
    return (
        <>
            <Head title="Approvals" />
            <ConsolePage>
                <PageHeader
                    eyebrow="Four-eyes control"
                    title="Approvals"
                    description="Role escalations, personal-data deletion and bulk exports run only after a second super admin approves. You cannot approve your own request."
                />
                <section className="space-y-3">
                    <h2 className="text-sm font-medium">
                        Waiting for a decision ({pending.length})
                    </h2>
                    {pending.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Nothing waiting.
                        </p>
                    )}
                    {pending.map((approval) => (
                        <PendingCard key={approval.id} approval={approval} />
                    ))}
                </section>
                <Card title="Recent decisions">
                    <ul className="divide-y divide-border text-sm">
                        {history.map((approval) => (
                            <li
                                key={approval.id}
                                className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                            >
                                <span>
                                    {approval.actionLabel}
                                    <span className="text-muted-foreground">
                                        {' '}
                                        · {approval.subject} · by{' '}
                                        {approval.requester}, decided by{' '}
                                        {approval.decider}
                                    </span>
                                </span>
                                <span className="flex items-center gap-2">
                                    <Pill
                                        tone={statusTone(
                                            approval.status === 'executed'
                                                ? 'approved'
                                                : approval.status,
                                        )}
                                    >
                                        {approval.status}
                                    </Pill>
                                    <span className="text-xs text-muted-foreground">
                                        {dateTime(approval.decidedAt)}
                                    </span>
                                </span>
                            </li>
                        ))}
                        {history.length === 0 && (
                            <li className="py-2 text-muted-foreground">
                                No decisions yet.
                            </li>
                        )}
                    </ul>
                </Card>
            </ConsolePage>
        </>
    );
}

function PendingCard({ approval }: { approval: Approval }) {
    const [note, setNote] = useState('');
    const [error, setError] = useState<string>();
    const decide = (approve: boolean) =>
        router.post(
            admin.approvals.decide.url(approval.id),
            { approve, note },
            {
                preserveScroll: true,
                onError: (errors) =>
                    setError(errors.approval ?? Object.values(errors)[0]),
            },
        );

    return (
        <div className="rounded-2xl border border-warn/40 bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="font-medium">{approval.actionLabel}</p>
                    <p className="text-sm text-muted-foreground">
                        {approval.subject} · requested by {approval.requester} ·{' '}
                        {dateTime(approval.createdAt)}
                    </p>
                </div>
                {approval.mine && <Pill tone="muted">Your request</Pill>}
            </div>
            <p className="mt-3 rounded-lg bg-background/60 p-3 text-sm">
                “{approval.reason}”
            </p>
            <dl className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                {Object.entries(approval.payload).map(([key, value]) => (
                    <div key={key}>
                        <dt className="inline">{humanize(key)}: </dt>
                        <dd className="inline font-mono text-foreground">
                            {String(value as string)}
                        </dd>
                    </div>
                ))}
            </dl>
            {!approval.mine && (
                <div className="mt-4 flex flex-wrap gap-2">
                    <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Decision note (logged)"
                        className="h-9 min-w-56 flex-1 rounded-md border border-input bg-transparent px-3 text-sm"
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decide(false)}
                    >
                        <X className="size-4" /> Reject
                    </Button>
                    <Button size="sm" onClick={() => decide(true)}>
                        <Check className="size-4" /> Approve and run
                    </Button>
                </div>
            )}
            <InputError message={error} className="mt-2" />
        </div>
    );
}

Approvals.layout = {
    breadcrumbs: [{ title: 'Approvals', href: admin.approvals.index() }],
};
