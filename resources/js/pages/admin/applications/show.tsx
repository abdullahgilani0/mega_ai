import { Head } from '@inertiajs/react';
import {
    Card,
    ConsolePage,
    PageHeader,
    Pill,
    statusTone,
} from '@/components/mega/console';
import type { Dossier } from '@/components/mega/dossier';
import { DossierView } from '@/components/mega/dossier';
import { dateTime, humanize, money } from '@/lib/format';
import admin from '@/routes/admin';

type Props = {
    grant: { reason: string; breakGlass: boolean; expiresAt: string };
    dossier: Dossier;
    allocations: {
        id: number;
        broker: string;
        status: string;
        score: number;
        reasons: Record<string, unknown>;
        offeredAt: string;
        respondedAt: string | null;
    }[];
};

export default function AdminApplication({
    grant,
    dossier,
    allocations,
}: Props) {
    return (
        <>
            <Head title={dossier.borrower.name} />
            <ConsolePage>
                <div
                    className={`rounded-xl border px-4 py-2.5 text-xs ${grant.breakGlass ? 'border-error/50 bg-error/10 text-error' : 'border-mega/30 bg-mega/10'}`}
                >
                    {grant.breakGlass
                        ? 'Break-glass access'
                        : 'Just-in-time access'}{' '}
                    until {dateTime(grant.expiresAt)} · “{grant.reason}” ·
                    visible to the borrower in their access history
                </div>
                <PageHeader
                    eyebrow={`${dossier.summary.loanPackLabel} · ${dossier.summary.stageLabel}`}
                    title={`${dossier.borrower.name} · ${money(dossier.summary.amount)}`}
                    description={
                        dossier.broker
                            ? `Allocated to ${dossier.broker.name}`
                            : 'Not yet allocated'
                    }
                />
                <DossierView dossier={dossier}>
                    <Card title="Allocation history">
                        {allocations.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No offers yet.
                            </p>
                        ) : (
                            <ul className="space-y-3 text-sm">
                                {allocations.map((allocation) => (
                                    <li
                                        key={allocation.id}
                                        className="rounded-lg border border-border p-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{allocation.broker}</span>
                                            <Pill
                                                tone={statusTone(
                                                    allocation.status,
                                                )}
                                            >
                                                {humanize(allocation.status)}
                                            </Pill>
                                        </div>
                                        <p className="num mt-1 text-xs text-muted-foreground">
                                            score {allocation.score} · offered{' '}
                                            {dateTime(allocation.offeredAt)}
                                            {allocation.respondedAt &&
                                                ` · responded ${dateTime(allocation.respondedAt)}`}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </DossierView>
            </ConsolePage>
        </>
    );
}

AdminApplication.layout = {
    breadcrumbs: [{ title: 'Applications', href: admin.applications.index() }],
};
