import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Card,
    ConsolePage,
    PageHeader,
    Pill,
    StatCard,
    statusTone,
} from '@/components/mega/console';
import { Button } from '@/components/ui/button';
import { dateTime, humanize } from '@/lib/format';
import admin from '@/routes/admin';

type Props = {
    identity: {
        id: number;
        applicationId: string;
        borrower: string;
        documentType: string;
        documentId: number | null;
        attempts: number;
        createdAt: string;
    }[];
    documents: {
        id: number;
        applicationId: string;
        borrower: string;
        kind: string;
        status: string;
        reason: string | null;
        createdAt: string;
    }[];
    gaps: {
        id: number;
        applicationId: string;
        borrower: string;
        prompt: string;
        createdAt: string;
    }[];
};

export default function WorkQueue({ identity, documents, gaps }: Props) {
    return (
        <>
            <Head title="Work queue" />
            <ConsolePage>
                <PageHeader
                    eyebrow="Back office"
                    title="Work queue"
                    description="Items the automation handed to a person. Opening a borrower file asks for your reason and grants time-limited access."
                />
                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                        label="Identity checks to confirm"
                        value={identity.length}
                        tone={identity.length ? 'warn' : 'default'}
                    />
                    <StatCard
                        label="Documents needing a look"
                        value={documents.length}
                        tone={documents.length ? 'warn' : 'default'}
                    />
                    <StatCard
                        label="Questions handed to staff"
                        value={gaps.length}
                    />
                </div>

                <Card title="Identity: manual review">
                    {identity.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Nothing to confirm.
                        </p>
                    )}
                    <ul className="divide-y divide-border">
                        {identity.map((item) => (
                            <IdentityRow key={item.id} item={item} />
                        ))}
                    </ul>
                </Card>

                <Card title="Documents">
                    {documents.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            No flagged documents.
                        </p>
                    )}
                    <ul className="divide-y divide-border text-sm">
                        {documents.map((doc) => (
                            <li
                                key={doc.id}
                                className="flex flex-wrap items-center justify-between gap-3 py-3"
                            >
                                <span>
                                    {doc.kind} · {doc.borrower}
                                    {doc.reason && (
                                        <span className="block text-xs text-muted-foreground">
                                            {doc.reason}
                                        </span>
                                    )}
                                </span>
                                <span className="flex items-center gap-3">
                                    <Pill tone={statusTone(doc.status)}>
                                        {humanize(doc.status)}
                                    </Pill>
                                    <Link
                                        href={admin.applications.show(
                                            doc.applicationId,
                                        )}
                                        className="text-xs text-mega-bright"
                                    >
                                        Open file
                                    </Link>
                                </span>
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card title="Questions the borrower couldn’t answer">
                    {gaps.length === 0 && (
                        <p className="text-sm text-muted-foreground">None.</p>
                    )}
                    <ul className="divide-y divide-border">
                        {gaps.map((gap) => (
                            <GapRow key={gap.id} gap={gap} />
                        ))}
                    </ul>
                </Card>
            </ConsolePage>
        </>
    );
}

function IdentityRow({ item }: { item: Props['identity'][number] }) {
    const [note, setNote] = useState('');
    const decide = (decision: 'verified' | 'retry') =>
        router.post(
            admin.workQueue.identity.url(item.id),
            { decision, note },
            { preserveScroll: true },
        );

    return (
        <li className="flex flex-wrap items-center gap-3 py-3 text-sm">
            <span className="min-w-48 flex-1">
                {item.borrower} · {humanize(item.documentType)}
                <span className="block text-xs text-muted-foreground">
                    {item.attempts} attempts · {dateTime(item.createdAt)}
                </span>
            </span>
            <Link
                href={admin.applications.show(item.applicationId)}
                className="text-xs text-mega-bright"
            >
                Open file
            </Link>
            <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (logged)"
                className="h-8 w-44 rounded-md border border-input bg-transparent px-2 text-xs"
            />
            <Button
                size="sm"
                variant="outline"
                disabled={!note}
                onClick={() => decide('retry')}
            >
                Ask to retake
            </Button>
            <Button
                size="sm"
                disabled={!note}
                onClick={() => decide('verified')}
            >
                Confirm identity
            </Button>
        </li>
    );
}

function GapRow({ gap }: { gap: Props['gaps'][number] }) {
    const [note, setNote] = useState('');

    return (
        <li className="flex flex-wrap items-center gap-3 py-3 text-sm">
            <span className="min-w-48 flex-1">
                {gap.prompt}
                <span className="block text-xs text-muted-foreground">
                    {gap.borrower} · {dateTime(gap.createdAt)}
                </span>
            </span>
            <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="How it was resolved"
                className="h-8 w-52 rounded-md border border-input bg-transparent px-2 text-xs"
            />
            <Button
                size="sm"
                disabled={!note}
                onClick={() =>
                    router.post(
                        admin.workQueue.gap.url(gap.id),
                        { note },
                        { preserveScroll: true },
                    )
                }
            >
                Resolve
            </Button>
        </li>
    );
}

WorkQueue.layout = {
    breadcrumbs: [{ title: 'Work queue', href: admin.workQueue.index() }],
};
