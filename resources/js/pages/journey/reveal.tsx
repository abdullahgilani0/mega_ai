import { Head, router } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    ChevronDown,
    CircleAlert,
    Download,
    Clock,
    RotateCcw,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { IndicativeNote, StepContainer } from '@/components/mega/journey';
import { LenderMark } from '@/components/mega/lender-mark';
import { Button } from '@/components/ui/button';
import { date, humanize, money, rate } from '@/lib/format';
import { cn } from '@/lib/utils';
import files from '@/routes/files';
import journey from '@/routes/journey';
import type { JourneySummary, MatchCard } from '@/types/mega';

type Props = {
    application: JourneySummary;
    matches: MatchCard[];
    counts: { total: number; passed: number; manualCheck: number };
    selectedId: number | null;
    playReveal: boolean;
};

type Phase = 'collapse' | 'iris' | 'headline' | 'cards';

const INTENT_LABELS = {
    best_overall: 'Best overall',
    lowest_cost: 'Lowest cost',
    highest_confidence: 'Strongest policy fit',
} as const;

export default function Reveal({
    application,
    matches,
    counts,
    selectedId,
    playReveal,
}: Props) {
    const [phase, setPhase] = useState<Phase>(
        playReveal ? 'collapse' : 'cards',
    );
    const [run, setRun] = useState(0);

    useEffect(() => {
        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        if (phase === 'cards' || reduced) {
            setPhase('cards');

            return;
        }

        const timers = [
            setTimeout(() => setPhase('iris'), 1300),
            setTimeout(() => {
                setPhase('headline');
                navigator.vibrate?.(25);
            }, 2700),
            setTimeout(() => setPhase('cards'), 4300),
        ];

        return () => timers.forEach(clearTimeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run]);

    function choose(resultId: number | null) {
        router.post(journey.reveal.select.url(application.id), {
            match_result_id: resultId,
        });
    }

    const sequence = phase !== 'cards';

    return (
        <>
            <Head title="Your matches" />
            <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(50%_60%_at_50%_0%,rgba(45,125,255,0.25),transparent)]" />

                {sequence && (
                    <RevealSequence
                        phase={phase}
                        onSkip={() => setPhase('cards')}
                    />
                )}

                {!sequence && (
                    <StepContainer wide>
                        <div className="text-center">
                            <p className="animate-rise text-[clamp(22px,4vw,40px)] font-light tracking-[0.5em] text-mega-bright">
                                LENDERS MATCHED
                            </p>
                            <p className="mt-4 animate-rise text-muted-foreground [animation-delay:120ms]">
                                <span className="num text-foreground">
                                    {counts.passed}
                                </span>{' '}
                                of <span className="num">{counts.total}</span>{' '}
                                lenders fit their published policy
                                {counts.manualCheck > 0 && (
                                    <>
                                        {' '}
                                        ·{' '}
                                        <span className="num">
                                            {counts.manualCheck}
                                        </span>{' '}
                                        need a manual check by your broker
                                    </>
                                )}
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setPhase('collapse');
                                    setRun((n) => n + 1);
                                }}
                                className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <RotateCcw className="size-3" /> Replay reveal
                            </button>
                        </div>

                        {matches.length === 0 ? (
                            <NoMatches onContinue={() => choose(null)} />
                        ) : (
                            <>
                                <div className="mt-12 grid gap-5 lg:grid-cols-3">
                                    {matches.map((match, i) => (
                                        <MatchCardView
                                            key={match.id}
                                            match={match}
                                            delay={i * 160}
                                            selected={selectedId === match.id}
                                            onChoose={() => choose(match.id)}
                                        />
                                    ))}
                                </div>
                                <div className="mt-10 flex flex-col items-center gap-3">
                                    <IndicativeNote />
                                    <button
                                        type="button"
                                        onClick={() => choose(null)}
                                        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                                    >
                                        Not sure? Let my broker recommend
                                    </button>
                                </div>
                            </>
                        )}
                    </StepContainer>
                )}
            </div>
        </>
    );
}

function RevealSequence({
    phase,
    onSkip,
}: {
    phase: Phase;
    onSkip: () => void;
}) {
    const open = phase === 'iris' || phase === 'headline';

    return (
        <div className="relative flex h-[calc(100dvh-70px)] min-h-[520px] flex-col items-center justify-center bg-[#05070A]">
            <div className="relative h-64 w-64">
                {/* The core collapses into a single bright point. */}
                {phase === 'collapse' && (
                    <div className="absolute inset-4 animate-core-collapse rounded-full bg-[radial-gradient(circle_at_40%_35%,#E6F0FF,#4D96FF_25%,#1D5BE0_50%,#061636)] shadow-[0_0_120px_30px_rgba(111,177,255,0.7)]" />
                )}
                {/* MEGA opens like an iris into three panels. */}
                {[-1, 0, 1].map((offset) => (
                    <div
                        key={offset}
                        className="absolute top-1/2 left-1/2 h-48 w-20 rounded-2xl border border-[#6FB1FF]/50 bg-[linear-gradient(180deg,rgba(45,125,255,0.35),rgba(6,22,54,0.6))] shadow-[0_0_40px_rgba(45,125,255,0.4)] transition-all duration-[1100ms] ease-out"
                        style={{
                            transform: `translate(calc(-50% + ${open ? offset * 110 : 0}px), -50%) scaleY(${open ? 1 : 0.1})`,
                            opacity: open ? 1 : 0,
                        }}
                    />
                ))}
            </div>
            <p
                className={cn(
                    'mt-16 text-[clamp(22px,5vw,48px)] font-light tracking-[0.55em] text-white transition-all duration-1000',
                    phase === 'headline'
                        ? 'blur-0 opacity-100'
                        : 'opacity-0 blur-sm',
                )}
            >
                LENDERS MATCHED
            </p>
            <button
                type="button"
                onClick={onSkip}
                className="absolute right-6 bottom-6 rounded-full border border-white/20 px-4 py-2 text-xs text-white/70 hover:text-white"
            >
                Skip
            </button>
        </div>
    );
}

function MatchCardView({
    match,
    delay,
    selected,
    onChoose,
}: {
    match: MatchCard;
    delay: number;
    selected: boolean;
    onChoose: () => void;
}) {
    const [open, setOpen] = useState(false);
    const reason = match.explanation?.split('. ').slice(1, 2).join('') ?? '';

    return (
        <article
            className={cn(
                'flex animate-rise flex-col rounded-3xl border bg-card/80 p-6 backdrop-blur transition',
                match.rank === 1
                    ? 'border-mega/60 shadow-[0_30px_80px_-40px_var(--mega-accent)]'
                    : 'border-border',
                selected && 'ring-2 ring-ok',
            )}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-center justify-between">
                <span className="num text-xs text-muted-foreground">
                    0{match.rank}
                </span>
                {match.intent && (
                    <span
                        className={cn(
                            'rounded-full px-2.5 py-1 text-[11px]',
                            match.rank === 1
                                ? 'bg-mega text-white'
                                : 'bg-accent text-accent-foreground',
                        )}
                    >
                        {INTENT_LABELS[match.intent]}
                    </span>
                )}
            </div>

            <LenderMark
                name={match.lender.name}
                color={match.lender.color}
                size="lg"
                className="mt-6"
            />
            <p className="mt-1 text-sm text-muted-foreground">
                {match.product?.name}
            </p>

            <p className="num mt-6 text-4xl tracking-tight">
                {rate(match.rateMin)}
                <span className="text-xl text-muted-foreground">
                    {' '}
                    – {rate(match.rateMax)}
                </span>
            </p>
            <p className="text-xs text-muted-foreground">
                Indicative rate range p.a.
            </p>

            <dl className="mt-6 grid grid-cols-3 gap-3 border-y border-border py-4 text-sm">
                <div>
                    <dt className="text-[11px] text-muted-foreground">
                        Max LVR
                    </dt>
                    <dd className="num mt-0.5">
                        {match.maxLvr !== null ? `${match.maxLvr}%` : 'n/a'}
                    </dd>
                </div>
                <div>
                    <dt className="text-[11px] text-muted-foreground">
                        Upfront fee
                    </dt>
                    <dd className="num mt-0.5">
                        {money(match.fees?.establishment)}
                    </dd>
                </div>
                <div>
                    <dt className="text-[11px] text-muted-foreground">
                        Monthly surplus
                    </dt>
                    <dd className="num mt-0.5">
                        {money(match.serviceability?.surplus)}
                    </dd>
                </div>
            </dl>

            <p className="mt-4 text-sm leading-relaxed text-foreground/85">
                {reason}
            </p>

            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="mt-4 inline-flex items-center gap-1.5 self-start text-sm text-mega-bright"
            >
                See why
                <ChevronDown
                    className={cn('size-4 transition', open && 'rotate-180')}
                />
            </button>

            {open && <Evidence match={match} />}

            <div className="mt-auto pt-6">
                <Button
                    onClick={onChoose}
                    variant={match.rank === 1 ? 'default' : 'outline'}
                    className="h-11 w-full rounded-full"
                >
                    {selected ? 'Chosen' : 'Choose this option'}
                    <ArrowRight className="size-4" />
                </Button>
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                    Indicative, not an offer
                </p>
            </div>
        </article>
    );
}

function Evidence({ match }: { match: MatchCard }) {
    const service = match.serviceability;

    return (
        <div className="mt-4 space-y-4 rounded-2xl bg-background/60 p-4 text-sm">
            <p className="leading-relaxed text-muted-foreground">
                {match.explanation}
            </p>
            <ul className="space-y-2.5">
                {match.rules.map((rule) => (
                    <li key={rule.id} className="flex gap-2.5">
                        {rule.outcome === 'pass' ? (
                            <Check className="mt-0.5 size-4 shrink-0 text-ok" />
                        ) : rule.outcome === 'fail' ? (
                            <X className="mt-0.5 size-4 shrink-0 text-error" />
                        ) : (
                            <CircleAlert className="mt-0.5 size-4 shrink-0 text-warn" />
                        )}
                        <span>
                            <span className="font-medium">{rule.label}</span>
                            <span className="block text-xs text-muted-foreground">
                                {rule.clause}
                            </span>
                        </span>
                    </li>
                ))}
            </ul>
            {service && (
                <dl className="grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
                    {[
                        [
                            'Net income / month',
                            money(service.net_monthly_income),
                        ],
                        [
                            'Living costs used',
                            `${money(service.expenses_used)} (higher of declared and benchmark)`,
                        ],
                        [
                            'Other debts / month',
                            money(service.liabilities_used),
                        ],
                        ['Assessment rate', rate(service.assessment_rate)],
                        ['Repayment / month', money(service.repayment)],
                        [
                            'Estimated max borrowing',
                            money(service.max_borrowing),
                        ],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <dt className="text-muted-foreground">{label}</dt>
                            <dd className="num">{value}</dd>
                        </div>
                    ))}
                </dl>
            )}
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="size-3" />
                Policy v{match.policyVersion} · rate sheet effective{' '}
                {date(match.rateEffectiveFrom)} · turnaround ~
                {match.lender.turnaroundDays} days ·{' '}
                {match.product?.features.map(humanize).join(', ')}
            </p>
            {match.lender.creditGuideId ? (
                <a
                    href={files.lenderDocument.url(match.lender.creditGuideId)}
                    className="inline-flex items-center gap-1.5 text-xs text-mega-bright hover:underline"
                >
                    <Download className="size-3" /> {match.lender.name} credit
                    guide
                </a>
            ) : (
                <p className="text-[11px] text-muted-foreground">
                    Your broker will give you {match.lender.name}’s credit
                    guide.
                </p>
            )}
        </div>
    );
}

function NoMatches({ onContinue }: { onContinue: () => void }) {
    return (
        <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-border bg-card p-10 text-center">
            <h2 className="font-display text-3xl">
                No lender fits on paper yet
            </h2>
            <p className="mt-3 text-muted-foreground">
                That is not a decline. A licensed broker can look at the lenders
                that need a manual check and suggest a path, such as a smaller
                amount or a different structure.
            </p>
            <Button
                onClick={onContinue}
                className="mt-8 h-11 rounded-full px-6"
            >
                Continue with a broker
                <ArrowRight className="size-4" />
            </Button>
        </div>
    );
}
