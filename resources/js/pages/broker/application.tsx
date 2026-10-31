import { Head, router } from '@inertiajs/react';
import { BadgeCheck } from 'lucide-react';
import { Card, ConsolePage, PageHeader } from '@/components/mega/console';
import type { Dossier } from '@/components/mega/dossier';
import { DossierView } from '@/components/mega/dossier';
import { Button } from '@/components/ui/button';
import { dateTime, money } from '@/lib/format';
import broker from '@/routes/broker';

type Props = {
    dossier: Dossier;
    statuses: { value: string; label: string }[];
};

export default function BrokerApplication({ dossier, statuses }: Props) {
    const update = (data: Record<string, string | boolean>) =>
        router.patch(broker.applications.update.url(dossier.summary.id), data, {
            preserveScroll: true,
        });

    return (
        <>
            <Head title={dossier.borrower.name} />
            <ConsolePage>
                <PageHeader
                    eyebrow={`${dossier.summary.loanPackLabel} · ${dossier.summary.state} ${dossier.summary.postcode}`}
                    title={`${dossier.borrower.name} · ${money(dossier.summary.amount)}`}
                    description="AI proposes, you decide. Review the shortlist and evidence, then confirm you take responsibility for the recommendation."
                />
                <DossierView dossier={dossier}>
                    <Card title="Your actions">
                        {dossier.brokerReviewedAt ? (
                            <p className="flex items-center gap-2 text-sm text-ok">
                                <BadgeCheck className="size-4" />
                                Shortlist reviewed{' '}
                                {dateTime(dossier.brokerReviewedAt)}
                            </p>
                        ) : (
                            <Button
                                className="w-full rounded-full"
                                onClick={() => update({ reviewed: true })}
                            >
                                <BadgeCheck className="size-4" />
                                I have reviewed the shortlist and evidence
                            </Button>
                        )}
                        <label
                            className="mt-5 block text-xs text-muted-foreground"
                            htmlFor="status"
                        >
                            Lender progress
                        </label>
                        <select
                            id="status"
                            value={dossier.summary.status}
                            onChange={(e) => update({ status: e.target.value })}
                            className="mt-1.5 h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                        >
                            {statuses.map((status) => (
                                <option
                                    key={status.value}
                                    value={status.value}
                                    className="bg-background"
                                >
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </Card>
                </DossierView>
            </ConsolePage>
        </>
    );
}

BrokerApplication.layout = {
    breadcrumbs: [{ title: 'Inbox', href: broker.inbox() }],
};
