import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Card,
    ConsolePage,
    PageHeader,
    Pill,
    statusTone,
} from '@/components/mega/console';
import { Button } from '@/components/ui/button';
import { dateTime, humanize } from '@/lib/format';
import { cn } from '@/lib/utils';
import admin from '@/routes/admin';

type Report = {
    id: number;
    score: number;
    reasons: { code: string; detail: string; weight: number }[];
    decision: string | null;
    reviewer: string | null;
    reviewedAt: string | null;
    document: { name: string; kind: string; sha256: string };
    application: { id: string; borrower: string };
    createdAt: string;
};

type Props = { threshold: number; queue: Report[]; recent: Report[] };

export default function Authenticity({ threshold, queue, recent }: Props) {
    return (
        <>
            <Head title="Authenticity flags" />
            <ConsolePage>
                <PageHeader
                    eyebrow="Admin and credit analyst only"
                    title="Authenticity review"
                    description={`Scores at or above ${threshold} route here. A score is a probabilistic signal, never a decline: borrowers only ever see a neutral request.`}
                />

                <section className="space-y-4">
                    <h2 className="text-sm font-medium">
                        Awaiting review ({queue.length})
                    </h2>
                    {queue.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Nothing to review.
                        </p>
                    )}
                    {queue.map((report) => (
                        <ReportCard key={report.id} report={report} />
                    ))}
                </section>

                <Card title="Recently analysed">
                    <ul className="divide-y divide-border text-sm">
                        {recent.map((report) => (
                            <li
                                key={report.id}
                                className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                            >
                                <span>
                                    {report.document.name}
                                    <span className="text-muted-foreground">
                                        {' '}
                                        · {report.document.kind} ·{' '}
                                        {report.application.borrower}
                                    </span>
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="num text-xs">
                                        {report.score}/100
                                    </span>
                                    {report.decision && (
                                        <Pill
                                            tone={statusTone(report.decision)}
                                        >
                                            {humanize(report.decision)}
                                        </Pill>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </ConsolePage>
        </>
    );
}

function ReportCard({ report }: { report: Report }) {
    const [reason, setReason] = useState('');
    const decide = (decision: 'cleared' | 'confirmed_concern') =>
        router.post(
            admin.authenticity.review.url(report.id),
            { decision, reason },
            { preserveScroll: true },
        );

    return (
        <div className="rounded-2xl border border-warn/40 bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="font-medium">{report.document.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {report.document.kind} ·{' '}
                        <Link
                            href={admin.applications.show(
                                report.application.id,
                            )}
                            className="text-mega-bright"
                        >
                            {report.application.borrower}
                        </Link>{' '}
                        · {dateTime(report.createdAt)}
                    </p>
                    <p className="num mt-1 text-[11px] text-muted-foreground">
                        sha256 {report.document.sha256}
                    </p>
                </div>
                <div className="text-right">
                    <p
                        className={cn(
                            'num text-3xl',
                            report.score >= 70 ? 'text-error' : 'text-warn',
                        )}
                    >
                        {report.score}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                        risk score
                    </p>
                </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm">
                {report.reasons.map((r) => (
                    <li key={r.code} className="flex gap-3">
                        <span className="num w-8 shrink-0 text-xs text-warn">
                            +{r.weight}
                        </span>
                        <span>
                            <span className="font-mono text-xs">{r.code}</span>{' '}
                            <span className="text-muted-foreground">
                                {r.detail}
                            </span>
                        </span>
                    </li>
                ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
                <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for your decision (logged)"
                    className="h-9 min-w-64 flex-1 rounded-md border border-input bg-transparent px-3 text-sm"
                />
                <Button
                    size="sm"
                    variant="outline"
                    disabled={!reason}
                    onClick={() => decide('cleared')}
                >
                    Clear
                </Button>
                <Button
                    size="sm"
                    variant="destructive"
                    disabled={!reason}
                    onClick={() => decide('confirmed_concern')}
                >
                    Confirm concern
                </Button>
            </div>
        </div>
    );
}

Authenticity.layout = {
    breadcrumbs: [
        { title: 'Authenticity flags', href: admin.authenticity.index() },
    ],
};
