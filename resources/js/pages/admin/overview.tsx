import { Head } from '@inertiajs/react';
import {
    Card,
    ConsolePage,
    PageHeader,
    StatCard,
} from '@/components/mega/console';
import { dateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import admin from '@/routes/admin';

type Props = {
    metrics: {
        applications: number;
        inProgress: number;
        awaitingBroker: number;
        unallocated: number;
        flagsOpen: number | null;
        lenders: number;
        avgMinutesToAccept: number | null;
    };
    funnel: Record<string, number>;
    coverage: Record<'full' | 'partial' | 'unmapped', number>;
    recentAudit:
        | {
              id: number;
              action: string;
              actor: string;
              subject: string | null;
              at: string;
          }[]
        | null;
};

const STAGES = [
    'consent',
    'identity',
    'documents',
    'advisor',
    'assessment',
    'questions',
    'reveal',
    'sign',
    'finish',
    'submitted',
];

export default function Overview({
    metrics,
    funnel,
    coverage,
    recentAudit,
}: Props) {
    const max = Math.max(1, ...Object.values(funnel));
    const coverageTotal = Math.max(
        1,
        coverage.full + coverage.partial + coverage.unmapped,
    );

    return (
        <>
            <Head title="Overview" />
            <ConsolePage>
                <PageHeader
                    eyebrow="Operations"
                    title="Overview"
                    description="Every number here is computed from live records; nothing is estimated."
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Applications"
                        value={metrics.applications}
                        hint={`${metrics.inProgress} in progress`}
                    />
                    <StatCard
                        label="Awaiting a broker"
                        value={metrics.awaitingBroker}
                        hint={`${metrics.unallocated} need a person`}
                        tone={metrics.unallocated ? 'warn' : 'default'}
                    />
                    <StatCard
                        label="Open authenticity flags"
                        value={metrics.flagsOpen ?? '—'}
                        tone={metrics.flagsOpen ? 'warn' : 'default'}
                        hint="Routed to human review"
                    />
                    <StatCard
                        label="Avg minutes to accept"
                        value={metrics.avgMinutesToAccept ?? '—'}
                        hint={`${metrics.lenders} active lenders`}
                        tone="accent"
                    />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                    <Card title="Journey funnel (current stage)">
                        <ul className="space-y-2.5">
                            {STAGES.map((stage) => (
                                <li
                                    key={stage}
                                    className="grid grid-cols-[100px_1fr_40px] items-center gap-3 text-xs"
                                >
                                    <span className="text-muted-foreground capitalize">
                                        {stage}
                                    </span>
                                    <span className="h-2 overflow-hidden rounded-full bg-border">
                                        <span
                                            className="block h-full rounded-full bg-mega"
                                            style={{
                                                width: `${((funnel[stage] ?? 0) / max) * 100}%`,
                                            }}
                                        />
                                    </span>
                                    <span className="num text-right">
                                        {funnel[stage] ?? 0}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card title="Lender policy coverage">
                        <div className="flex h-3 overflow-hidden rounded-full">
                            <span
                                className="bg-ok"
                                style={{
                                    width: `${(coverage.full / coverageTotal) * 100}%`,
                                }}
                            />
                            <span
                                className="bg-warn"
                                style={{
                                    width: `${(coverage.partial / coverageTotal) * 100}%`,
                                }}
                            />
                            <span
                                className="bg-error"
                                style={{
                                    width: `${(coverage.unmapped / coverageTotal) * 100}%`,
                                }}
                            />
                        </div>
                        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                            {(['full', 'partial', 'unmapped'] as const).map(
                                (key) => (
                                    <div key={key}>
                                        <dt className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize">
                                            <span
                                                className={cn(
                                                    'size-2 rounded-full',
                                                    key === 'full'
                                                        ? 'bg-ok'
                                                        : key === 'partial'
                                                          ? 'bg-warn'
                                                          : 'bg-error',
                                                )}
                                            />
                                            {key}
                                        </dt>
                                        <dd className="num mt-1 text-xl">
                                            {coverage[key]}
                                        </dd>
                                    </div>
                                ),
                            )}
                        </dl>
                        <p className="mt-4 text-xs text-muted-foreground">
                            Unmapped lenders show as "manual check needed" to
                            borrowers, never as a pass.
                        </p>
                    </Card>
                </div>

                {recentAudit && (
                    <Card title="Recent activity">
                        <ul className="divide-y divide-border text-sm">
                            {recentAudit.map((log) => (
                                <li
                                    key={log.id}
                                    className="flex flex-wrap justify-between gap-2 py-2.5"
                                >
                                    <span>
                                        <span className="font-mono text-xs">
                                            {log.action}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {' '}
                                            · {log.actor}
                                            {log.subject && ` · ${log.subject}`}
                                        </span>
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {dateTime(log.at)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </ConsolePage>
        </>
    );
}

Overview.layout = {
    breadcrumbs: [{ title: 'Overview', href: admin.overview() }],
};
