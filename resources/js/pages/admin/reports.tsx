import { Head } from '@inertiajs/react';
import {
    Card,
    ConsolePage,
    PageHeader,
    StatCard,
    Table,
} from '@/components/mega/console';
import { LenderMark } from '@/components/mega/lender-mark';
import admin from '@/routes/admin';

type Props = {
    funnel: { stage: string; reached: number }[];
    brokers: {
        name: string;
        offered: number;
        accepted: number;
        declined: number;
        expired: number;
        avgMinutes: number | null;
        share: number;
    }[];
    lenders: {
        name: string;
        color: string;
        evaluated: number;
        passRate: number | null;
        manualCheck: number;
    }[];
    authenticity: { reviewed: number; cleared: number; confirmed: number };
    outcomes: { pass: number; fail: number; unsure: number };
};

export default function Reports({
    funnel,
    brokers,
    lenders,
    authenticity,
    outcomes,
}: Props) {
    const top = Math.max(1, funnel[0]?.reached ?? 1);
    const falsePositive = authenticity.reviewed
        ? Math.round((authenticity.cleared / authenticity.reviewed) * 100)
        : null;
    const evaluated = outcomes.pass + outcomes.fail + outcomes.unsure;

    return (
        <>
            <Head title="Reports" />
            <ConsolePage>
                <PageHeader
                    eyebrow="Pilot measures"
                    title="Reports"
                    description="Drop-off by step, allocation speed and fairness, lender fit and authenticity review outcomes, from live records."
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Lender evaluations"
                        value={evaluated}
                        hint={`${outcomes.pass} pass · ${outcomes.unsure} manual · ${outcomes.fail} fail`}
                    />
                    <StatCard
                        label="Authenticity reviews"
                        value={authenticity.reviewed}
                        hint={`${authenticity.confirmed} confirmed concerns`}
                    />
                    <StatCard
                        label="Flags cleared by reviewer"
                        value={
                            falsePositive === null ? '—' : `${falsePositive}%`
                        }
                        hint="Proxy for false-positive rate"
                        tone="warn"
                    />
                    <StatCard
                        label="Brokers receiving offers"
                        value={brokers.filter((b) => b.offered > 0).length}
                        hint={`of ${brokers.length} in the network`}
                        tone="accent"
                    />
                </div>

                <Card title="Journey funnel: applications that reached each step">
                    <ul className="space-y-2.5">
                        {funnel.map((row, i) => {
                            const previous =
                                i === 0 ? row.reached : funnel[i - 1].reached;
                            const drop =
                                previous > 0
                                    ? Math.round(
                                          ((previous - row.reached) /
                                              previous) *
                                              100,
                                      )
                                    : 0;

                            return (
                                <li
                                    key={row.stage}
                                    className="grid grid-cols-[150px_1fr_60px_70px] items-center gap-3 text-xs"
                                >
                                    <span className="text-muted-foreground">
                                        {row.stage}
                                    </span>
                                    <span className="h-2.5 overflow-hidden rounded-full bg-border">
                                        <span
                                            className="block h-full rounded-full bg-mega"
                                            style={{
                                                width: `${(row.reached / top) * 100}%`,
                                            }}
                                        />
                                    </span>
                                    <span className="num text-right">
                                        {row.reached}
                                    </span>
                                    <span className="num text-right text-warn">
                                        {i > 0 && drop > 0 ? `−${drop}%` : ''}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </Card>

                <div className="grid gap-6 xl:grid-cols-2">
                    <section className="space-y-3">
                        <h2 className="text-sm font-medium">
                            Allocation by broker
                        </h2>
                        <Table>
                            <thead>
                                <tr>
                                    <th>Broker</th>
                                    <th>Offered</th>
                                    <th>Accepted</th>
                                    <th>Declined</th>
                                    <th>Expired</th>
                                    <th>Avg min</th>
                                    <th>Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {brokers.map((broker) => (
                                    <tr key={broker.name}>
                                        <td>{broker.name}</td>
                                        <td className="num">
                                            {broker.offered}
                                        </td>
                                        <td className="num text-ok">
                                            {broker.accepted}
                                        </td>
                                        <td className="num">
                                            {broker.declined}
                                        </td>
                                        <td className="num text-warn">
                                            {broker.expired}
                                        </td>
                                        <td className="num">
                                            {broker.avgMinutes ?? '—'}
                                        </td>
                                        <td className="num">{broker.share}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </section>
                    <section className="space-y-3">
                        <h2 className="text-sm font-medium">
                            Most-evaluated lenders
                        </h2>
                        <Table>
                            <thead>
                                <tr>
                                    <th>Lender</th>
                                    <th>Evaluated</th>
                                    <th>Pass rate</th>
                                    <th>Manual check</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lenders.map((lender) => (
                                    <tr key={lender.name}>
                                        <td>
                                            <LenderMark
                                                name={lender.name}
                                                color={lender.color}
                                                size="sm"
                                            />
                                        </td>
                                        <td className="num">
                                            {lender.evaluated}
                                        </td>
                                        <td className="num">
                                            {lender.passRate === null
                                                ? '—'
                                                : `${lender.passRate}%`}
                                        </td>
                                        <td className="num">
                                            {lender.manualCheck}
                                        </td>
                                    </tr>
                                ))}
                                {lenders.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="text-center text-muted-foreground"
                                        >
                                            No assessments yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </section>
                </div>
            </ConsolePage>
        </>
    );
}

Reports.layout = {
    breadcrumbs: [{ title: 'Reports', href: admin.reports.index() }],
};
