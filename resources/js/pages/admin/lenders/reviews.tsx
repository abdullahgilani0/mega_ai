import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { ConsolePage, PageHeader, Pill } from '@/components/mega/console';
import { LenderMark } from '@/components/mega/lender-mark';
import { dateTime } from '@/lib/format';
import admin from '@/routes/admin';

type Draft = {
    id: number;
    lenderId: number;
    lender: string;
    color: string;
    loanPack: string;
    version: number;
    source: string | null;
    author: string;
    createdAt: string | null;
    changes: { id: string; label: string; from: unknown; to: unknown }[];
};

const show = (value: unknown) =>
    Array.isArray(value)
        ? value.join(', ')
        : value === null || value === undefined
          ? '—'
          : String(value as string);

export default function Reviews({ drafts }: { drafts: Draft[] }) {
    return (
        <>
            <Head title="Policy reviews" />
            <ConsolePage>
                <PageHeader
                    eyebrow="Review queue"
                    title="Policy changes awaiting approval"
                    description="Drafts from analysts or automated ingestion. Nothing goes live until a second person approves it and golden scenarios pass."
                />
                {drafts.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        No drafts waiting.
                    </p>
                )}
                <div className="space-y-3">
                    {drafts.map((draft) => (
                        <div
                            key={draft.id}
                            className="rounded-2xl border border-border bg-card p-5"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <LenderMark
                                        name={draft.lender}
                                        color={draft.color}
                                    />
                                    <Pill tone="accent">
                                        {draft.loanPack} · v{draft.version}
                                    </Pill>
                                </div>
                                <Link
                                    href={admin.lenders.show(draft.lenderId)}
                                    className="inline-flex items-center gap-1 text-sm text-mega-bright"
                                >
                                    Review <ArrowRight className="size-3.5" />
                                </Link>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                {draft.source} · by {draft.author} ·{' '}
                                {dateTime(draft.createdAt)}
                            </p>
                            {draft.changes.length > 0 ? (
                                <ul className="mt-3 space-y-1 text-sm">
                                    {draft.changes.map((change) => (
                                        <li
                                            key={change.id}
                                            className="font-mono text-xs"
                                        >
                                            {change.id} {change.label}:{' '}
                                            <span className="text-error line-through">
                                                {show(change.from)}
                                            </span>{' '}
                                            →{' '}
                                            <span className="text-ok">
                                                {show(change.to)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-3 text-xs text-muted-foreground">
                                    New policy (no published version to
                                    compare).
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </ConsolePage>
        </>
    );
}

Reviews.layout = {
    breadcrumbs: [{ title: 'Policy reviews', href: admin.policies.reviews() }],
};
