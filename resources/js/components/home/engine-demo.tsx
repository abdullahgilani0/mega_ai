import {
    Check,
    CircleAlert,
    FileText,
    Play,
    RotateCcw,
    Target,
    UserRound,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { MegaOrb } from '@/components/mega/orb';
import { cn } from '@/lib/utils';

type Outcome = 'pass' | 'fail' | 'unsure';

const LENDERS: {
    name: string;
    color: string;
    outcome: Outcome;
    reason: string;
    rate?: string;
}[] = [
    {
        name: 'Harbourline Bank',
        color: '#2D7DFF',
        outcome: 'fail',
        reason: 'Max LVR 80% · yours is 85%',
    },
    {
        name: 'Jarrah Bank',
        color: '#FFB547',
        outcome: 'pass',
        reason: 'LVR, income and credit all within policy',
        rate: '5.76%',
    },
    {
        name: 'Tidewater CU',
        color: '#22D3EE',
        outcome: 'pass',
        reason: 'Accepts 6 months in a new role',
        rate: '5.89%',
    },
    {
        name: 'Kestrel Bank',
        color: '#F472B6',
        outcome: 'unsure',
        reason: 'Policy being re-mapped · broker to confirm',
    },
    {
        name: 'Northline Home Loans',
        color: '#A78BFA',
        outcome: 'fail',
        reason: 'Serviceability short by $210/month',
    },
    {
        name: 'Mulga Credit Union',
        color: '#60A5FA',
        outcome: 'pass',
        reason: 'Most room in its rules',
        rate: '5.92%',
    },
    {
        name: 'Coolabah Bank',
        color: '#FACC15',
        outcome: 'pass',
        reason: 'Lowest cost over 5 years',
        rate: '5.81%',
    },
];

const INPUTS = [
    { key: 'docs', label: 'Your documents', icon: FileText },
    { key: 'goals', label: 'Your goals', icon: Target },
    { key: 'situation', label: 'Your situation', icon: UserRound },
] as const;

/**
 * A scripted marketing demo of the assessment with fictional lenders. The real product
 * animation is driven only by events the engine actually emits.
 */
export function EngineDemo() {
    const [inputs, setInputs] = useState<Record<string, boolean>>({
        docs: true,
        goals: true,
        situation: false,
    });
    const [step, setStep] = useState(-1);
    const ready = Object.values(inputs).every(Boolean);
    const running = step >= 0 && step < LENDERS.length;
    const done = step >= LENDERS.length;

    useEffect(() => {
        if (!running) {
            return;
        }

        const timer = setTimeout(() => setStep((s) => s + 1), 650);

        return () => clearTimeout(timer);
    }, [step, running]);

    const shortlist = LENDERS.filter((l) => l.outcome === 'pass').slice(0, 3);

    return (
        <div className="relative rounded-[32px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur sm:p-8">
            <p className="text-xs tracking-[0.2em] text-white/50 uppercase">
                Interactive demo · fictional lenders
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2">
                {INPUTS.map((input) => (
                    <button
                        key={input.key}
                        type="button"
                        onClick={() => {
                            setInputs((current) => ({
                                ...current,
                                [input.key]: !current[input.key],
                            }));
                            setStep(-1);
                        }}
                        aria-pressed={inputs[input.key]}
                        className={cn(
                            'flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center text-xs transition',
                            inputs[input.key]
                                ? 'border-[#6FB1FF]/60 bg-[#2F6BFF]/15 text-white shadow-[0_0_30px_-8px_rgba(47,107,255,0.8)]'
                                : 'border-white/10 text-white/50 hover:border-white/25',
                        )}
                    >
                        <input.icon className="size-5" />
                        {input.label}
                        <span
                            className={cn(
                                'size-1.5 rounded-full',
                                inputs[input.key]
                                    ? 'bg-[#2FD08A]'
                                    : 'bg-white/20',
                            )}
                        />
                    </button>
                ))}
            </div>

            <div className="relative my-6 flex items-center justify-center">
                <svg
                    className="absolute inset-x-0 -top-6 h-10 w-full"
                    viewBox="0 0 300 40"
                    preserveAspectRatio="none"
                    aria-hidden
                >
                    {[50, 150, 250].map((x, i) => (
                        <path
                            key={x}
                            d={`M${x} 0 C ${x} 25, 150 15, 150 40`}
                            fill="none"
                            stroke="#6FB1FF"
                            strokeOpacity={
                                Object.values(inputs)[i] ? 0.8 : 0.12
                            }
                            strokeDasharray="4 4"
                            className={
                                running
                                    ? 'animate-[dash_1s_linear_infinite]'
                                    : ''
                            }
                        />
                    ))}
                </svg>
                <MegaOrb
                    className="w-28"
                    label="MEGA"
                    intensity={running ? 'working' : 'idle'}
                />
            </div>

            <ul className="space-y-1.5">
                {LENDERS.map((lender, i) => {
                    const evaluated = step > i || done;
                    const evaluating = step === i;
                    const faded = done && lender.outcome !== 'pass';

                    return (
                        <li
                            key={lender.name}
                            className={cn(
                                'flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-all duration-500',
                                evaluating
                                    ? 'border-[#6FB1FF]/70 bg-[#2F6BFF]/20'
                                    : 'border-white/5 bg-white/[0.03]',
                                faded && 'opacity-35',
                            )}
                        >
                            <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ background: lender.color }}
                            />
                            <span className="w-40 shrink-0 truncate text-white/90">
                                {lender.name}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-xs text-white/45">
                                {evaluated
                                    ? lender.reason
                                    : evaluating
                                      ? 'Checking policy…'
                                      : ''}
                            </span>
                            {evaluated &&
                                (lender.outcome === 'pass' ? (
                                    <Check className="size-4 shrink-0 text-[#2FD08A]" />
                                ) : lender.outcome === 'fail' ? (
                                    <X className="size-4 shrink-0 text-white/40" />
                                ) : (
                                    <CircleAlert className="size-4 shrink-0 text-[#FFB547]" />
                                ))}
                        </li>
                    );
                })}
            </ul>

            <div className="mt-6 min-h-24">
                {done ? (
                    <div className="grid animate-rise grid-cols-3 gap-2">
                        {shortlist.map((lender, i) => (
                            <div
                                key={lender.name}
                                className={cn(
                                    'rounded-2xl p-3 text-center',
                                    i === 0 ? 'bg-[#2F6BFF]' : 'bg-white/10',
                                )}
                            >
                                <p className="truncate text-xs text-white/80">
                                    {lender.name}
                                </p>
                                <p className="mt-1 font-mono text-lg text-white">
                                    {lender.rate}
                                </p>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setStep(-1)}
                            className="col-span-3 mt-2 inline-flex items-center justify-center gap-1.5 text-xs text-white/50 hover:text-white"
                        >
                            <RotateCcw className="size-3" /> Reset demo
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        disabled={!ready || running}
                        onClick={() => setStep(0)}
                        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white font-medium text-[#13233D] transition hover:bg-[#E3ECFF] disabled:bg-white/10 disabled:text-white/40"
                    >
                        <Play className="size-4" />
                        {running
                            ? 'MEGA is checking policies…'
                            : ready
                              ? 'Run MEGA'
                              : 'Switch on all three inputs to run'}
                    </button>
                )}
            </div>
        </div>
    );
}
