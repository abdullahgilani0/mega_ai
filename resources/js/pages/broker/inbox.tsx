import { Head, Link, router } from '@inertiajs/react';
import { Check, Clock, MapPin, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    ConsolePage,
    PageHeader,
    Pill,
    StatCard,
    Table,
    statusTone,
} from '@/components/mega/console';
import { Button } from '@/components/ui/button';
import { humanize, money } from '@/lib/format';
import broker from '@/routes/broker';
import type { JourneySummary } from '@/types/mega';

type Props = {
    broker: {
        name: string;
        business: string | null;
        capacity: number;
        open: number;
        status: string;
        territories: string[];
    };
    offers: {
        id: number;
        loanPackLabel: string;
        amount: number;
        region: string;
        expiresAt: string;
        score: number;
        reasons: Record<string, string | number>;
    }[];
    applications: (JourneySummary & {
        borrowerName: string;
        escalated: number;
        reviewed: boolean;
    })[];
};

export default function BrokerInbox({
    broker: profile,
    offers,
    applications,
}: Props) {
    return (
        <>
            <Head title="Inbox" />
            <ConsolePage>
                <PageHeader
                    eyebrow={profile.business ?? 'Broker'}
                    title={`Good day, ${profile.name.split(' ')[0]}`}
                    description={`Covering ${profile.territories.join(', ')}. Offers expire if not accepted in time, then move to the next broker.`}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                        label="Live offers"
                        value={offers.length}
                        tone={offers.length ? 'accent' : 'default'}
                    />
                    <StatCard
                        label="Open applications"
                        value={`${profile.open}/${profile.capacity}`}
                        hint="Capacity headroom feeds the allocation score"
                    />
                    <StatCard
                        label="Awaiting your review"
                        value={applications.filter((a) => !a.reviewed).length}
                        tone="warn"
                    />
                </div>

                {offers.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-sm font-medium">New offers</h2>
                        {offers.map((offer) => (
                            <OfferRow key={offer.id} offer={offer} />
                        ))}
                    </section>
                )}

                <section className="space-y-3">
                    <h2 className="text-sm font-medium">Your applications</h2>
                    <Table>
                        <thead>
                            <tr>
                                <th>Borrower</th>
                                <th>Loan</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Review</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map((application) => (
                                <tr key={application.id}>
                                    <td>{application.borrowerName}</td>
                                    <td>{application.loanPackLabel}</td>
                                    <td className="num">
                                        {money(application.amount)}
                                    </td>
                                    <td>
                                        <Pill
                                            tone={statusTone(
                                                application.status,
                                            )}
                                        >
                                            {application.statusLabel}
                                        </Pill>
                                    </td>
                                    <td>
                                        {application.reviewed ? (
                                            <Pill tone="ok">Reviewed</Pill>
                                        ) : (
                                            <Pill tone="warn">To review</Pill>
                                        )}
                                        {application.escalated > 0 && (
                                            <span className="ml-2 text-xs text-warn">
                                                {application.escalated} open
                                                questions
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-right">
                                        <Link
                                            href={broker.applications.show(
                                                application.id,
                                            )}
                                            className="text-sm text-mega-bright"
                                        >
                                            Open
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {applications.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="text-center text-muted-foreground"
                                    >
                                        Accepted applications appear here.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </section>
            </ConsolePage>
        </>
    );
}

function OfferRow({ offer }: { offer: Props['offers'][number] }) {
    const [secondsLeft, setSecondsLeft] = useState(() =>
        Math.max(
            0,
            Math.round(
                (new Date(offer.expiresAt).getTime() - Date.now()) / 1000,
            ),
        ),
    );

    useEffect(() => {
        const timer = setInterval(
            () => setSecondsLeft((s) => Math.max(0, s - 1)),
            1000,
        );

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-mega/40 bg-mega/[0.06] p-5">
            <div className="min-w-48 flex-1">
                <p className="font-medium">
                    {offer.loanPackLabel} ·{' '}
                    <span className="num">{money(offer.amount)}</span>
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {offer.region}
                </p>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                {Object.entries(offer.reasons).map(([key, value]) => (
                    <span
                        key={key}
                        className="rounded-full border border-border px-2 py-0.5"
                    >
                        {humanize(key)}: {String(value)}
                    </span>
                ))}
            </div>
            <p className="num flex items-center gap-1.5 text-sm text-warn">
                <Clock className="size-4" />
                {Math.floor(secondsLeft / 60)}:
                {String(secondsLeft % 60).padStart(2, '0')}
            </p>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() =>
                        router.post(broker.offers.decline.url(offer.id))
                    }
                >
                    <X className="size-4" /> Decline
                </Button>
                <Button
                    className="rounded-full"
                    onClick={() =>
                        router.post(broker.offers.accept.url(offer.id))
                    }
                >
                    <Check className="size-4" /> Accept
                </Button>
            </div>
        </div>
    );
}

BrokerInbox.layout = {
    breadcrumbs: [{ title: 'Inbox', href: broker.inbox() }],
};
