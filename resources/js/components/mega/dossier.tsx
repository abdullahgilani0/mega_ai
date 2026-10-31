import { Link } from '@inertiajs/react';
import { Check, CircleAlert, Download, FileText, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, Pill, statusTone } from '@/components/mega/console';
import { StatusDot } from '@/components/mega/journey';
import { LenderMark } from '@/components/mega/lender-mark';
import { MessageThread } from '@/components/mega/message-thread';
import type { ThreadMessage } from '@/components/mega/message-thread';
import files from '@/routes/files';
import { dateTime, humanize, money, rate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { DocumentTile, JourneySummary, MatchCard } from '@/types/mega';

export type Dossier = {
    summary: JourneySummary;
    borrower: {
        name: string;
        email: string;
        mobile: string | null;
        avatar: number;
    };
    employmentType: string;
    isJoint: boolean;
    facts: { field: string; value: unknown; source: string }[];
    identity: {
        result: string;
        vendor: string;
        completedOn: string | null;
    } | null;
    credit: {
        bureau: string;
        score: number;
        summary: Record<string, unknown>;
    } | null;
    documents: DocumentTile[];
    run: {
        id: number;
        total: number;
        passed: number;
        scenarioHash: string;
        completedAt: string | null;
    } | null;
    shortlist: MatchCard[];
    selectedMatchId: number | null;
    notes: { id: number; fact: string }[];
    transcript: { role: string; body: string }[] | null;
    escalatedGaps: { id: number; prompt: string }[];
    messages: ThreadMessage[] | null;
    coBorrowers: { email: string; name: string | null; accepted: boolean }[];
    signatures: {
        id: number;
        title: string;
        version: number;
        hash: string;
        signedAt: string;
    }[];
    broker: { id: number; name: string } | null;
    brokerReviewedAt: string | null;
    timeline: { id: number; type: string; actor: string | null; at: string }[];
};

const MONEY_FIELDS = [
    'income_annual',
    'expenses_monthly',
    'liabilities_monthly',
    'property_value',
    'asset_price',
    'annual_turnover',
    'savings_balance',
    'credit_card_limits',
];

function formatFact(field: string, value: unknown): string {
    if (value === null || value === undefined) {
        return '—';
    }

    if (MONEY_FIELDS.includes(field)) {
        return money(Number(value));
    }

    return typeof value === 'object'
        ? JSON.stringify(value)
        : String(value as string | number | boolean);
}

export function DossierView({
    dossier,
    children,
}: {
    dossier: Dossier;
    children?: ReactNode;
}) {
    return (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <div className="space-y-6">
                <Card
                    title="Shortlist and evidence"
                    actions={
                        dossier.run && (
                            <span className="num text-xs text-muted-foreground">
                                {dossier.run.passed}/{dossier.run.total} passed
                                · {dossier.run.scenarioHash.slice(0, 10)}
                            </span>
                        )
                    }
                >
                    {dossier.shortlist.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No assessment yet, or no lender passed. Review
                            manual-check lenders with the borrower.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {dossier.shortlist.map((match) => (
                                <div
                                    key={match.id}
                                    className={cn(
                                        'rounded-xl border p-4',
                                        dossier.selectedMatchId === match.id
                                            ? 'border-ok/60'
                                            : 'border-border',
                                    )}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <LenderMark
                                            name={match.lender.name}
                                            color={match.lender.color}
                                        />
                                        <div className="flex items-center gap-2">
                                            {dossier.selectedMatchId ===
                                                match.id && (
                                                <Pill tone="ok">
                                                    Borrower's choice
                                                </Pill>
                                            )}
                                            <Pill tone="accent">
                                                {humanize(match.intent ?? '')}
                                            </Pill>
                                        </div>
                                    </div>
                                    <div className="num mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                                        <span>
                                            {rate(match.rateMin)}–
                                            {rate(match.rateMax)}
                                        </span>
                                        <span>score {match.score}</span>
                                        <span>
                                            confidence{' '}
                                            {match.approvalConfidence}
                                        </span>
                                        <span>
                                            surplus{' '}
                                            {money(
                                                match.serviceability?.surplus,
                                            )}
                                        </span>
                                        <span>
                                            policy v{match.policyVersion}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm text-foreground/85">
                                        {match.explanation}
                                    </p>
                                    <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                                        {match.rules.map((rule) => (
                                            <li
                                                key={rule.id}
                                                className="flex gap-2 text-xs"
                                            >
                                                {rule.outcome === 'pass' ? (
                                                    <Check className="size-3.5 shrink-0 text-ok" />
                                                ) : rule.outcome === 'fail' ? (
                                                    <X className="size-3.5 shrink-0 text-error" />
                                                ) : (
                                                    <CircleAlert className="size-3.5 shrink-0 text-warn" />
                                                )}
                                                <span className="text-muted-foreground">
                                                    {rule.clause}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card title="Canonical data and provenance">
                    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                        {dossier.facts.map((fact) => (
                            <div
                                key={fact.field}
                                className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2"
                            >
                                <dt className="text-xs text-muted-foreground">
                                    {humanize(fact.field)}
                                </dt>
                                <dd className="text-right">
                                    <span className="num text-sm">
                                        {formatFact(fact.field, fact.value)}
                                    </span>
                                    <span className="block text-[10px] text-muted-foreground">
                                        {fact.source}
                                    </span>
                                </dd>
                            </div>
                        ))}
                    </dl>
                </Card>

                <Card title="Documents">
                    <ul className="divide-y divide-border">
                        {dossier.documents.map((doc) => (
                            <li key={doc.id} className="py-3">
                                <div className="flex items-center gap-3">
                                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm">
                                            {doc.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {doc.kindLabel} ·{' '}
                                            {dateTime(doc.uploadedAt)}
                                        </p>
                                    </div>
                                    <StatusDot status={doc.status} />
                                    <a
                                        href={files.document.url(doc.id)}
                                        className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                                        aria-label={`Download ${doc.name}`}
                                    >
                                        <Download className="size-4" />
                                    </a>
                                </div>
                                {doc.authenticity && (
                                    <div className="mt-2 ml-7 rounded-lg bg-background/60 p-2.5 text-xs">
                                        <p
                                            className={cn(
                                                'num',
                                                doc.authenticity.flagged
                                                    ? 'text-warn'
                                                    : 'text-muted-foreground',
                                            )}
                                        >
                                            Authenticity risk{' '}
                                            {doc.authenticity.score}/100
                                            {doc.authenticity.decision &&
                                                ` · ${humanize(doc.authenticity.decision)}`}
                                        </p>
                                        {doc.authenticity.reasons.map(
                                            (reason) => (
                                                <p
                                                    key={reason.code}
                                                    className="text-muted-foreground"
                                                >
                                                    {reason.code}:{' '}
                                                    {reason.detail}
                                                </p>
                                            ),
                                        )}
                                    </div>
                                )}
                            </li>
                        ))}
                        {dossier.documents.length === 0 && (
                            <li className="py-2 text-sm text-muted-foreground">
                                No documents uploaded.
                            </li>
                        )}
                    </ul>
                </Card>
            </div>

            <div className="space-y-6">
                {children}

                {dossier.messages && (
                    <Card title="Messages with the borrower">
                        <MessageThread
                            applicationId={dossier.summary.id}
                            thread={dossier.messages}
                        />
                    </Card>
                )}

                {dossier.coBorrowers.length > 0 && (
                    <Card title="Co-borrowers">
                        <ul className="space-y-1.5 text-sm">
                            {dossier.coBorrowers.map((co) => (
                                <li
                                    key={co.email}
                                    className="flex justify-between gap-3"
                                >
                                    <span>{co.name ?? co.email}</span>
                                    <Pill tone={co.accepted ? 'ok' : 'warn'}>
                                        {co.accepted ? 'Joined' : 'Invited'}
                                    </Pill>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}

                <Card title="Borrower">
                    <p className="font-medium">{dossier.borrower.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {dossier.borrower.email}
                    </p>
                    <p className="num text-sm text-muted-foreground">
                        {dossier.borrower.mobile}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Pill tone="accent">
                            {dossier.summary.loanPackLabel}
                        </Pill>
                        <Pill>{humanize(dossier.summary.purpose)}</Pill>
                        <Pill>{humanize(dossier.employmentType)}</Pill>
                        {dossier.isJoint && <Pill>Joint</Pill>}
                        <Pill tone={statusTone(dossier.summary.status)}>
                            {dossier.summary.statusLabel}
                        </Pill>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <dt className="text-xs text-muted-foreground">
                                Identity
                            </dt>
                            <dd>
                                {dossier.identity
                                    ? humanize(dossier.identity.result)
                                    : 'Not started'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs text-muted-foreground">
                                Credit ({dossier.credit?.bureau ?? '—'})
                            </dt>
                            <dd className="num">
                                {dossier.credit?.score ?? 'Pending'}
                            </dd>
                        </div>
                    </dl>
                </Card>

                {dossier.escalatedGaps.length > 0 && (
                    <Card title="Questions the borrower could not answer">
                        <ul className="space-y-2 text-sm">
                            {dossier.escalatedGaps.map((gap) => (
                                <li key={gap.id} className="flex gap-2">
                                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-warn" />
                                    {gap.prompt}
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}

                <Card title="Advisor notes (borrower confirmed)">
                    {dossier.notes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">None.</p>
                    ) : (
                        <ul className="space-y-2 text-sm">
                            {dossier.notes.map((note) => (
                                <li key={note.id} className="flex gap-2">
                                    <Check className="mt-0.5 size-4 shrink-0 text-ok" />
                                    {note.fact}
                                </li>
                            ))}
                        </ul>
                    )}
                    {dossier.transcript === null ? (
                        <p className="mt-4 text-xs text-muted-foreground">
                            Transcript not shared (no recording consent).
                        </p>
                    ) : (
                        dossier.transcript.length > 0 && (
                            <details className="mt-4 text-sm">
                                <summary className="cursor-pointer text-xs text-mega-bright">
                                    Transcript
                                </summary>
                                <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                                    {dossier.transcript.map((message, i) => (
                                        <p key={i} className="text-xs">
                                            <span className="text-muted-foreground">
                                                {message.role}:{' '}
                                            </span>
                                            {message.body}
                                        </p>
                                    ))}
                                </div>
                            </details>
                        )
                    )}
                </Card>

                <Card title="Signed disclosures">
                    <ul className="space-y-2 text-sm">
                        {dossier.signatures.map((signature) => (
                            <li key={signature.title}>
                                <Link
                                    href={files.signature.url(signature.id)}
                                    className="text-mega-bright hover:underline"
                                >
                                    {signature.title}
                                </Link>{' '}
                                <span className="text-muted-foreground">
                                    v{signature.version}
                                </span>
                                <p className="num text-[10px] text-muted-foreground">
                                    {dateTime(signature.signedAt)} · sha256{' '}
                                    {signature.hash.slice(0, 20)}…
                                </p>
                            </li>
                        ))}
                        {dossier.signatures.length === 0 && (
                            <li className="text-muted-foreground">None yet.</li>
                        )}
                    </ul>
                </Card>

                <Card title="Timeline">
                    <ol className="max-h-80 space-y-2 overflow-y-auto text-xs">
                        {dossier.timeline.map((event) => (
                            <li
                                key={event.id}
                                className="flex justify-between gap-3"
                            >
                                <span>
                                    {event.type}
                                    {event.actor && (
                                        <span className="text-muted-foreground">
                                            {' '}
                                            · {event.actor}
                                        </span>
                                    )}
                                </span>
                                <span className="shrink-0 text-muted-foreground">
                                    {dateTime(event.at)}
                                </span>
                            </li>
                        ))}
                    </ol>
                </Card>
            </div>
        </div>
    );
}
