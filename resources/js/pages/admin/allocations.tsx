import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Card,
    ConsolePage,
    PageHeader,
    Pill,
    Table,
    statusTone,
} from '@/components/mega/console';
import { Button } from '@/components/ui/button';
import { dateTime, humanize } from '@/lib/format';
import admin from '@/routes/admin';

type Candidate = {
    brokerId: number;
    name: string;
    score: number;
    reasons: Record<string, string | number>;
};

type Props = {
    queue: {
        id: string;
        borrower: string;
        loanPackLabel: string;
        region: string;
        status: string;
        statusLabel: string;
        submittedAt: string | null;
        candidates: Candidate[];
    }[];
    brokers: { id: number; name: string }[];
    recent: {
        id: number;
        applicationId: string;
        loanPackLabel: string;
        region: string;
        broker: string;
        status: string;
        score: number;
        offeredAt: string;
        minutesToRespond: number | null;
    }[];
};

export default function Allocations({ queue, brokers, recent }: Props) {
    return (
        <>
            <Head title="Allocation" />
            <ConsolePage>
                <PageHeader
                    eyebrow="Broker allocation"
                    title="Allocation"
                    description="Hard filters (licence, loan type, territory, capacity) then a weighted score with a fairness rotation. Manual reassignment needs a reason and is audited."
                />

                <section className="space-y-4">
                    <h2 className="text-sm font-medium">
                        Waiting for a broker ({queue.length})
                    </h2>
                    {queue.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Every submitted application has a broker.
                        </p>
                    )}
                    {queue.map((item) => (
                        <QueueItem
                            key={item.id}
                            item={item}
                            brokers={brokers}
                        />
                    ))}
                </section>

                <section className="space-y-3">
                    <h2 className="text-sm font-medium">Recent offers</h2>
                    <Table>
                        <thead>
                            <tr>
                                <th>Application</th>
                                <th>Region</th>
                                <th>Broker</th>
                                <th>Score</th>
                                <th>Status</th>
                                <th>Response</th>
                                <th>Offered</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recent.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <Link
                                            href={admin.applications.show(
                                                row.applicationId,
                                            )}
                                            className="text-mega-bright"
                                        >
                                            {row.loanPackLabel}
                                        </Link>
                                    </td>
                                    <td>{row.region}</td>
                                    <td>{row.broker}</td>
                                    <td className="num">{row.score}</td>
                                    <td>
                                        <Pill tone={statusTone(row.status)}>
                                            {humanize(row.status)}
                                        </Pill>
                                    </td>
                                    <td className="num text-xs">
                                        {row.minutesToRespond !== null
                                            ? `${row.minutesToRespond} min`
                                            : '—'}
                                    </td>
                                    <td className="text-xs text-muted-foreground">
                                        {dateTime(row.offeredAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </section>
            </ConsolePage>
        </>
    );
}

function QueueItem({
    item,
    brokers,
}: {
    item: Props['queue'][number];
    brokers: Props['brokers'];
}) {
    const [brokerId, setBrokerId] = useState(
        String(item.candidates[0]?.brokerId ?? brokers[0]?.id ?? ''),
    );
    const [reason, setReason] = useState('');

    return (
        <Card
            title={
                <span>
                    {item.borrower} · {item.loanPackLabel} · {item.region}
                </span>
            }
            actions={
                <Pill tone={statusTone(item.status)}>{item.statusLabel}</Pill>
            }
        >
            <p className="text-xs text-muted-foreground">
                Ranked eligible brokers
            </p>
            <ul className="mt-2 space-y-1.5 text-sm">
                {item.candidates.map((candidate) => (
                    <li
                        key={candidate.brokerId}
                        className="flex flex-wrap items-center gap-3"
                    >
                        <span className="num w-12 text-mega-bright">
                            {candidate.score}
                        </span>
                        <span className="w-40">{candidate.name}</span>
                        <span className="text-xs text-muted-foreground">
                            {Object.entries(candidate.reasons)
                                .map(([k, v]) => `${humanize(k)} ${v}`)
                                .join(' · ')}
                        </span>
                    </li>
                ))}
                {item.candidates.length === 0 && (
                    <li className="text-muted-foreground">
                        No eligible broker passes the hard filters. Assign
                        manually.
                    </li>
                )}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
                <select
                    value={brokerId}
                    onChange={(e) => setBrokerId(e.target.value)}
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                    {brokers.map((broker) => (
                        <option
                            key={broker.id}
                            value={broker.id}
                            className="bg-background"
                        >
                            {broker.name}
                        </option>
                    ))}
                </select>
                <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason (logged)"
                    className="h-9 min-w-56 flex-1 rounded-md border border-input bg-transparent px-3 text-sm"
                />
                <Button
                    size="sm"
                    disabled={!reason || !brokerId}
                    onClick={() =>
                        router.post(
                            admin.allocations.reassign.url(item.id),
                            { broker_id: brokerId, reason },
                            { preserveScroll: true },
                        )
                    }
                >
                    Assign
                </Button>
            </div>
        </Card>
    );
}

Allocations.layout = {
    breadcrumbs: [{ title: 'Allocation', href: admin.allocations.index() }],
};
