import { Form, Head, Link, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import {
    ArrowRight,
    BadgeCheck,
    Dices,
    FileSignature,
    Mail,
    Plus,
    UserRound,
    UsersRound,
} from 'lucide-react';
import { MegaAvatar } from '@/components/mega/avatar';
import { MessageThread } from '@/components/mega/message-thread';
import type { ThreadMessage } from '@/components/mega/message-thread';
import { MegaOrb } from '@/components/mega/orb';
import { Button } from '@/components/ui/button';
import { dateTime, money } from '@/lib/format';
import { cn } from '@/lib/utils';
import apply from '@/routes/apply';
import avatar from '@/routes/avatar';
import files from '@/routes/files';
import journey from '@/routes/journey';
import type { JourneySummary } from '@/types/mega';

type Props = {
    applications: JourneySummary[];
    active: {
        summary: JourneySummary;
        timeline: {
            id: number;
            type: string;
            label: string;
            detail: string | null;
            at: string;
        }[];
        broker: {
            name: string;
            business: string | null;
            email: string;
            languages: string[];
        } | null;
        selectedLender: string | null;
        signatures: {
            id: number;
            title: string;
            signedAt: string;
            hash: string;
        }[];
        isOwner: boolean;
        owner: string;
        isJoint: boolean;
        coBorrowers: {
            email: string;
            name: string | null;
            accepted: boolean;
        }[];
        messages: ThreadMessage[];
    } | null;
};

export default function BorrowerDashboard({ applications, active }: Props) {
    const { auth } = usePage().props;
    const firstName = String(auth.user.name).split(' ')[0];

    if (!active) {
        return (
            <>
                <Head title="Dashboard" />
                <div className="mx-auto flex max-w-xl flex-col items-center py-10 text-center">
                    <MegaOrb className="w-36 animate-float" />
                    <h1 className="mt-10 font-display text-5xl">
                        Welcome, {firstName}
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Six quick questions and MEGA will show you which lenders
                        typically fit, before any heavy lifting.
                    </p>
                    <Button
                        asChild
                        size="lg"
                        className="mt-10 h-12 rounded-full px-8 shadow-[0_8px_30px_-8px_var(--mega-accent)]"
                    >
                        <Link href={apply.create()}>
                            Find my matches
                            <ArrowRight className="size-4" />
                        </Link>
                    </Button>
                </div>
            </>
        );
    }

    const { summary } = active;
    const inProgress = summary.status === 'in_progress';
    const reached = summary.stages.filter((stage) => stage.reached).length;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                    <p className="eyebrow text-mega-bright">Your application</p>
                    <h1 className="mt-3 font-display text-5xl">
                        Hi {firstName}.
                    </h1>
                </div>
                <Button asChild variant="outline" className="rounded-full">
                    <Link href={apply.create()}>
                        <Plus className="size-4" /> New application
                    </Link>
                </Button>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-8">
                    <div className="absolute -top-24 -right-24 size-72 rounded-full bg-mega/20 blur-3xl" />
                    <div className="relative">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-mega/15 px-3 py-1 text-xs text-mega-bright">
                                {summary.statusLabel}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {summary.loanPackLabel} · {summary.state}{' '}
                                {summary.postcode}
                            </span>
                        </div>
                        <p className="num mt-6 text-5xl tracking-tight">
                            {money(summary.amount)}
                        </p>
                        {active.selectedLender && (
                            <p className="mt-2 text-muted-foreground">
                                Option chosen: {active.selectedLender}
                            </p>
                        )}

                        <div className="mt-8">
                            <div className="flex gap-1">
                                {summary.stages.map((stage) => (
                                    <span
                                        key={stage.key}
                                        title={stage.label}
                                        className={cn(
                                            'h-1.5 flex-1 rounded-full',
                                            stage.reached
                                                ? 'bg-mega'
                                                : 'bg-border',
                                        )}
                                    />
                                ))}
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground">
                                {inProgress
                                    ? `Step ${reached} of ${summary.stages.length}: ${summary.stageLabel}`
                                    : summary.stageLabel}
                            </p>
                        </div>

                        {inProgress && (
                            <Button
                                asChild
                                size="lg"
                                className="mt-8 h-12 rounded-full px-7"
                            >
                                <Link href={journey.resume(summary.id)}>
                                    Continue where you left off
                                    <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                        )}
                    </div>
                </section>

                <aside className="space-y-6">
                    {!active.isOwner && (
                        <p className="rounded-2xl border border-mega/30 bg-mega/10 p-4 text-sm">
                            You’re a co-borrower on {active.owner}’s
                            application.
                        </p>
                    )}
                    <div className="rounded-3xl border border-border p-6">
                        <p className="eyebrow text-muted-foreground">
                            Messages
                        </p>
                        <div className="mt-4">
                            <MessageThread
                                applicationId={summary.id}
                                thread={active.messages}
                                disabledReason={
                                    active.broker
                                        ? undefined
                                        : 'Messaging opens once your broker is assigned.'
                                }
                            />
                        </div>
                    </div>
                    {active.isJoint && (
                        <CoBorrowers
                            active={active}
                            applicationId={summary.id}
                        />
                    )}
                    <div className="rounded-3xl border border-border p-6">
                        <p className="eyebrow text-muted-foreground">
                            Your broker
                        </p>
                        {active.broker ? (
                            <div className="mt-4">
                                <div className="flex items-center gap-3">
                                    <span className="grid size-11 place-items-center rounded-full bg-mega/15">
                                        <UserRound className="size-5 text-mega-bright" />
                                    </span>
                                    <div>
                                        <p className="font-medium">
                                            {active.broker.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {active.broker.business}
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm text-muted-foreground">
                                    They will contact you within one business
                                    day. Speaks{' '}
                                    {active.broker.languages.join(', ')}.
                                </p>
                                <a
                                    href={`mailto:${active.broker.email}`}
                                    className="mt-4 inline-flex items-center gap-2 text-sm text-mega-bright"
                                >
                                    <Mail className="size-4" />
                                    {active.broker.email}
                                </a>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-muted-foreground">
                                {summary.status === 'allocating' ||
                                summary.status === 'unallocated'
                                    ? 'We are matching you with a licensed broker who covers your area.'
                                    : 'Once you finish, MEGA allocates a licensed local broker.'}
                            </p>
                        )}
                    </div>

                    <div className="rounded-3xl border border-border p-6">
                        <div className="flex items-center justify-between">
                            <p className="eyebrow text-muted-foreground">
                                Your avatar
                            </p>
                            <Form
                                {...avatar.reroll.form()}
                                options={{ preserveScroll: true }}
                            >
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <Dices className="size-3.5" /> Reroll
                                </button>
                            </Form>
                        </div>
                        <div className="mt-4 flex items-center gap-4">
                            <MegaAvatar
                                index={
                                    (auth as { avatar?: number }).avatar ?? 0
                                }
                                className="size-16"
                            />
                            <p className="text-sm text-muted-foreground">
                                Hangs above MEGA during your assessment.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                <section className="rounded-3xl border border-border p-8">
                    <p className="eyebrow text-muted-foreground">Timeline</p>
                    <ol className="mt-6 space-y-5">
                        {active.timeline.map((event, i) => (
                            <li key={event.id} className="flex gap-4">
                                <span
                                    className={cn(
                                        'mt-1.5 size-2.5 shrink-0 rounded-full',
                                        i === 0
                                            ? 'bg-mega shadow-[0_0_10px_var(--mega-accent)]'
                                            : 'bg-border',
                                    )}
                                />
                                <div className="flex-1">
                                    <p className="text-sm">
                                        {event.label}
                                        {event.detail && (
                                            <span className="text-muted-foreground">
                                                {' '}
                                                · {event.detail}
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {dateTime(event.at)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className="rounded-3xl border border-border p-8">
                    <p className="eyebrow text-muted-foreground">
                        Signed documents
                    </p>
                    {active.signatures.length === 0 ? (
                        <p className="mt-4 text-sm text-muted-foreground">
                            Nothing signed yet.
                        </p>
                    ) : (
                        <ul className="mt-5 space-y-4">
                            {active.signatures.map((signature) => (
                                <li key={signature.id} className="flex gap-3">
                                    <FileSignature className="mt-0.5 size-4 text-ok" />
                                    <div>
                                        <Link
                                            href={files.signature.url(
                                                signature.id,
                                            )}
                                            className="text-sm text-mega-bright hover:underline"
                                        >
                                            {signature.title}
                                        </Link>
                                        <p className="num text-[11px] text-muted-foreground">
                                            {dateTime(signature.signedAt)} ·{' '}
                                            {signature.hash.slice(0, 16)}…
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {applications.length > 1 && (
                        <>
                            <p className="eyebrow mt-10 text-muted-foreground">
                                Earlier applications
                            </p>
                            <ul className="mt-4 space-y-2 text-sm">
                                {applications.slice(1).map((app) => (
                                    <li
                                        key={app.id}
                                        className="flex justify-between"
                                    >
                                        <span>{app.loanPackLabel}</span>
                                        <span className="text-muted-foreground">
                                            {app.statusLabel}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
                        <BadgeCheck className="size-4" />
                        Indicative matches, not an offer of credit.
                    </p>
                </section>
            </div>
        </>
    );
}

function CoBorrowers({
    active,
    applicationId,
}: {
    active: NonNullable<Props['active']>;
    applicationId: string;
}) {
    const form = useForm({ email: '' });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(journey.coBorrowers.store.url(applicationId), {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    }

    return (
        <div className="rounded-3xl border border-border p-6">
            <p className="eyebrow text-muted-foreground">Co-borrowers</p>
            <ul className="mt-4 space-y-2 text-sm">
                {active.coBorrowers.map((co) => (
                    <li
                        key={co.email}
                        className="flex items-center justify-between gap-3"
                    >
                        <span className="flex items-center gap-2">
                            <UsersRound className="size-4 text-muted-foreground" />
                            {co.name ?? co.email}
                        </span>
                        <span
                            className={cn(
                                'rounded-full px-2 py-0.5 text-[11px]',
                                co.accepted
                                    ? 'bg-ok/15 text-ok'
                                    : 'bg-warn/15 text-warn',
                            )}
                        >
                            {co.accepted ? 'Joined' : 'Invited'}
                        </span>
                    </li>
                ))}
                {active.coBorrowers.length === 0 && (
                    <li className="text-muted-foreground">
                        Each person on a joint application verifies their own
                        mobile and email.
                    </li>
                )}
            </ul>
            {active.isOwner && (
                <form onSubmit={submit} className="mt-4 flex gap-2">
                    <input
                        type="email"
                        value={form.data.email}
                        onChange={(e) => form.setData('email', e.target.value)}
                        placeholder="Their email"
                        className="h-10 flex-1 rounded-full border border-input bg-transparent px-4 text-sm"
                    />
                    <Button
                        type="submit"
                        className="rounded-full"
                        disabled={form.processing || !form.data.email}
                    >
                        Invite
                    </Button>
                </form>
            )}
            {form.errors.email && (
                <p className="mt-2 text-sm text-error">{form.errors.email}</p>
            )}
        </div>
    );
}
