import {
    Brain,
    FileScan,
    GitCompareArrows,
    MessageSquareText,
    Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useInView } from './hooks';

type LogLine = { kind: 'read' | 'ok' | 'flag' | 'match'; text: string };

const LOG: LogLine[] = [
    { kind: 'read', text: 'Reading payslip_oct.pdf' },
    { kind: 'ok', text: 'Gross pay $4,820 / fortnight · 98% confidence' },
    { kind: 'read', text: 'Cross-checking 6 months of bank deposits' },
    { kind: 'ok', text: 'Salary deposits match the payslip ✓' },
    { kind: 'flag', text: 'Buy-now-pay-later found · added to expenses' },
    { kind: 'read', text: 'Evaluating 92 lender policies' },
    { kind: 'flag', text: 'Harbourline §3.1: LVR 85% > 80% limit' },
    { kind: 'ok', text: 'Jarrah §4.3: 4 months in role accepted ✓' },
    { kind: 'match', text: '3 lenders matched · every clause cited' },
];

const TONE: Record<LogLine['kind'], string> = {
    read: 'text-[#9CC2FF]',
    ok: 'text-[#5BE3A4]',
    flag: 'text-[#FFC27A]',
    match: 'text-white font-semibold',
};

const PREFIX: Record<LogLine['kind'], string> = {
    read: '→',
    ok: '✓',
    flag: '!',
    match: '★',
};

/**
 * A scripted illustration of the kind of work the engine does, typed out line by line.
 */
export function AiLiveFeed({ className }: { className?: string }) {
    const { ref, inView } = useInView<HTMLDivElement>(0.3);
    const [lines, setLines] = useState(0);
    const [chars, setChars] = useState(0);

    useEffect(() => {
        if (!inView) {
            return;
        }

        const current = LOG[lines];

        if (!current) {
            const restart = setTimeout(() => {
                setLines(0);
                setChars(0);
            }, 3200);

            return () => clearTimeout(restart);
        }

        const timer =
            chars < current.text.length
                ? setTimeout(() => setChars((c) => c + 2), 22)
                : setTimeout(() => {
                      setLines((l) => l + 1);
                      setChars(0);
                  }, 420);

        return () => clearTimeout(timer);
    }, [inView, lines, chars]);

    return (
        <div
            ref={ref}
            className={cn(
                'beam overflow-hidden rounded-3xl bg-[#0B1628] text-[13px] shadow-[0_40px_80px_-40px_rgba(11,22,40,0.8)]',
                className,
            )}
        >
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
                <span className="size-2.5 rounded-full bg-[#FF5F57]" />
                <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
                <span className="size-2.5 rounded-full bg-[#28C840]" />
                <span className="ml-3 flex items-center gap-1.5 text-xs text-white/50">
                    <Sparkles className="size-3.5 text-[#9CC2FF]" /> MEGA · live
                    assessment
                </span>
                <span className="ml-auto flex items-center gap-1.5 text-[11px] text-[#5BE3A4]">
                    <span className="size-1.5 animate-pulse rounded-full bg-[#5BE3A4]" />{' '}
                    running
                </span>
            </div>
            <div
                className="min-h-[300px] space-y-2 p-5 font-mono"
                aria-live="off"
            >
                {LOG.slice(0, lines + 1).map((line, i) => {
                    const typing = i === lines;
                    const text = typing ? line.text.slice(0, chars) : line.text;

                    return (
                        <p
                            key={i}
                            className={cn(
                                'flex gap-3 leading-relaxed',
                                TONE[line.kind],
                            )}
                        >
                            <span className="w-3 shrink-0 text-white/30">
                                {PREFIX[line.kind]}
                            </span>
                            <span>
                                {text}
                                {typing && (
                                    <span className="caret ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-white/70" />
                                )}
                            </span>
                        </p>
                    );
                })}
            </div>
            <p className="border-t border-white/10 px-5 py-2.5 text-[11px] text-white/35">
                Illustrative example of an assessment
            </p>
        </div>
    );
}

/**
 * Animated comparison of the manual process and MEGA.
 */
export function ThenVsNow() {
    const { ref, inView } = useInView<HTMLDivElement>(0.35);

    const rows = [
        {
            label: 'Time to a shortlist',
            before: 'Days to weeks',
            now: 'About 15 minutes',
            beforeWidth: 100,
            nowWidth: 9,
        },
        {
            label: 'Lender policies compared',
            before: 'A handful',
            now: 'All 92 on the panel',
            beforeWidth: 14,
            nowWidth: 100,
        },
        {
            label: 'Forms you fill in',
            before: 'One per lender',
            now: 'One, prefilled',
            beforeWidth: 88,
            nowWidth: 12,
        },
    ];

    return (
        <div
            ref={ref}
            className="rounded-3xl border border-[#13233D]/10 bg-white p-6 sm:p-8"
        >
            <div className="flex items-center justify-between text-xs font-semibold tracking-[0.18em] uppercase">
                <span className="text-[#13233D]/45">The usual way</span>
                <span className="text-[#2F6BFF]">With MEGA</span>
            </div>
            <div className="mt-6 space-y-7">
                {rows.map((row, i) => (
                    <div key={row.label}>
                        <p className="text-sm font-semibold text-[#13233D]">
                            {row.label}
                        </p>
                        <div className="mt-3 space-y-2">
                            {[
                                [
                                    row.before,
                                    row.beforeWidth,
                                    'bg-[#13233D]/15',
                                    'text-[#13233D]/60',
                                    2200,
                                ],
                                [
                                    row.now,
                                    row.nowWidth,
                                    'bg-[linear-gradient(90deg,#2F6BFF,#7B6CE0)]',
                                    'text-[#13233D]',
                                    900,
                                ],
                            ].map(([text, width, bar, tone, duration], j) => (
                                <div
                                    key={j}
                                    className="flex items-center gap-3"
                                >
                                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#13233D]/[0.05]">
                                        <div
                                            className={cn(
                                                'h-full rounded-full ease-out',
                                                bar as string,
                                            )}
                                            style={{
                                                width: inView
                                                    ? `${width as number}%`
                                                    : '0%',
                                                transition: `width ${duration as number}ms cubic-bezier(0.16,1,0.3,1) ${i * 150}ms`,
                                            }}
                                        />
                                    </div>
                                    <span
                                        className={cn(
                                            'w-36 shrink-0 text-right text-sm',
                                            tone as string,
                                        )}
                                    >
                                        {text as string}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Inputs flow through a small network into three matches; pulses travel along each edge.
 */
export function NeuralNet({ className }: { className?: string }) {
    const layers = [
        [60, 130, 200, 270],
        [40, 105, 170, 235, 300],
        [80, 170, 260],
    ];
    const xs = [40, 200, 360];
    const edges: [number, number, number, number][] = [];

    layers.slice(0, -1).forEach((layer, l) => {
        layer.forEach((y1) => {
            layers[l + 1].forEach((y2) =>
                edges.push([xs[l], y1, xs[l + 1], y2]),
            );
        });
    });

    return (
        <svg viewBox="0 0 400 340" className={className} aria-hidden>
            <defs>
                <linearGradient id="nn-edge" x1="0" x2="1">
                    <stop offset="0%" stopColor="#2F6BFF" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#7B6CE0" stopOpacity="0.4" />
                </linearGradient>
                <radialGradient id="nn-node">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#9CC2FF" />
                </radialGradient>
            </defs>
            {edges.map(([x1, y1, x2, y2], i) => (
                <g key={i}>
                    <path
                        id={`nn-${i}`}
                        d={`M${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
                        stroke="url(#nn-edge)"
                        strokeWidth="1.2"
                        fill="none"
                    />
                    {i % 3 === 0 && (
                        <circle r="2.6" fill="#FFFFFF">
                            <animateMotion
                                dur={`${2 + (i % 5) * 0.4}s`}
                                begin={`${(i % 7) * 0.3}s`}
                                repeatCount="indefinite"
                            >
                                <mpath href={`#nn-${i}`} />
                            </animateMotion>
                        </circle>
                    )}
                </g>
            ))}
            {layers.map((layer, l) =>
                layer.map((y) => (
                    <g key={`${l}-${y}`}>
                        <circle
                            cx={xs[l]}
                            cy={y}
                            r={l === 2 ? 15 : 10}
                            fill={l === 2 ? '#2F6BFF' : '#13233D'}
                            stroke="#9CC2FF"
                            strokeOpacity="0.5"
                            strokeWidth="1.5"
                        />
                        <circle
                            cx={xs[l]}
                            cy={y}
                            r={l === 2 ? 5 : 3.5}
                            fill="url(#nn-node)"
                        >
                            <animate
                                attributeName="opacity"
                                values="0.4;1;0.4"
                                dur={`${1.6 + ((y / 40) % 1.4)}s`}
                                repeatCount="indefinite"
                            />
                        </circle>
                    </g>
                )),
            )}
        </svg>
    );
}

const CAPABILITIES = [
    {
        icon: FileScan,
        title: 'Reads every page',
        body: 'Payslips, statements, IDs and tax returns turned into clean, verified figures.',
        visual: 'scan',
    },
    {
        icon: GitCompareArrows,
        title: 'Spots what humans miss',
        body: 'Cross-checks documents against each other and flags anything that doesn’t add up.',
        visual: 'compare',
    },
    {
        icon: Brain,
        title: 'Knows 92 policy books',
        body: 'Holds every lender’s current rules in memory and checks them in seconds.',
        visual: 'count',
    },
    {
        icon: MessageSquareText,
        title: 'Explains in plain English',
        body: 'Every match comes with the reasons and the clause it relied on.',
        visual: 'explain',
    },
] as const;

function CapabilityVisual({
    kind,
}: {
    kind: (typeof CAPABILITIES)[number]['visual'];
}) {
    if (kind === 'scan') {
        return (
            <div className="relative mx-auto h-24 w-20 overflow-hidden rounded-lg border border-[#13233D]/15 bg-white p-2.5">
                {[80, 60, 70, 45, 65].map((w, i) => (
                    <span
                        key={i}
                        className="mb-2 block h-1.5 rounded-full bg-[#13233D]/12"
                        style={{ width: `${w}%` }}
                    />
                ))}
                <span className="scan-line absolute inset-x-0 top-0 h-6 bg-[linear-gradient(transparent,rgba(47,107,255,0.35),transparent)] [--scan-distance:90px]" />
            </div>
        );
    }

    if (kind === 'compare') {
        return (
            <div className="mx-auto flex h-24 items-center gap-2">
                {['$4,820', '$4,820'].map((value, i) => (
                    <div
                        key={i}
                        className="rounded-lg border border-[#13233D]/15 bg-white px-3 py-2 text-center"
                    >
                        <p className="text-[9px] text-[#13233D]/50">
                            {i === 0 ? 'Payslip' : 'Bank'}
                        </p>
                        <p className="font-mono text-xs">{value}</p>
                    </div>
                ))}
                <span className="grid size-7 animate-pulse place-items-center rounded-full bg-[#2FD08A]/20 text-xs text-[#1E8F5C]">
                    =
                </span>
            </div>
        );
    }

    if (kind === 'count') {
        return (
            <div className="mx-auto grid h-24 w-32 grid-cols-8 content-center gap-1">
                {Array.from({ length: 32 }, (_, i) => (
                    <span
                        key={i}
                        className="aspect-square animate-pulse rounded-sm bg-[#2F6BFF]"
                        style={{
                            animationDelay: `${(i % 8) * 120 + Math.floor(i / 8) * 60}ms`,
                            opacity: 0.25 + (i % 5) * 0.15,
                        }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="mx-auto flex h-24 max-w-[170px] flex-col justify-center gap-1.5">
            <span className="self-start rounded-xl rounded-bl-sm bg-[#13233D]/[0.06] px-3 py-1.5 text-[10px]">
                Why Jarrah Bank?
            </span>
            <span className="self-end rounded-xl rounded-br-sm bg-[#2F6BFF] px-3 py-1.5 text-[10px] text-white">
                LVR 80% is within its 90% limit (§3.1)
            </span>
        </div>
    );
}

export function AiCapabilities() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((item) => (
                <div
                    key={item.title}
                    className="beam group rounded-3xl bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(47,107,255,0.5)]"
                >
                    <div className="rounded-2xl bg-[#F6F1E8] p-3">
                        <CapabilityVisual kind={item.visual} />
                    </div>
                    <span className="mt-5 grid size-10 place-items-center rounded-xl bg-[#2F6BFF]/10 text-[#2F6BFF]">
                        <item.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 font-display text-xl">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#13233D]/65">
                        {item.body}
                    </p>
                </div>
            ))}
        </div>
    );
}

const TICKER = [
    'Reading your payslip…',
    'Income verified · 98% confidence',
    'Checking 92 lender policies…',
    '3 lenders matched ✓',
];

/**
 * Small hero card cycling through what the AI is doing.
 */
export function AiTicker() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(
            () => setIndex((i) => (i + 1) % TICKER.length),
            2200,
        );

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center gap-3">
            <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#2F6BFF,#7B6CE0)] text-white">
                <Sparkles className="size-4" />
                <span className="absolute inset-0 animate-ping rounded-xl bg-[#2F6BFF]/40 [animation-duration:2.2s]" />
            </span>
            <div className="min-w-44">
                <p className="text-[11px] font-semibold tracking-wide text-[#2F6BFF] uppercase">
                    MEGA AI
                </p>
                <p key={index} className="animate-rise text-sm font-medium">
                    {TICKER[index]}
                </p>
            </div>
        </div>
    );
}
