import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { useScrollProgress } from './hooks';
import {
    DocsIcon,
    HandshakeIcon,
    PhoneScanIcon,
    ThreeCardsIcon,
} from './illustrations';

const STEPS: {
    icon: ComponentType;
    time: string;
    title: string;
    body: string;
    detail: string;
}[] = [
    {
        icon: PhoneScanIcon,
        time: '3 min',
        title: 'Tell us who you are',
        body: 'Six quick questions, a photo of your licence and a two-second face scan on your phone.',
        detail: 'Already on a laptop? Scan a QR code and finish on your phone.',
    },
    {
        icon: DocsIcon,
        time: '2 min',
        title: 'Connect, don’t upload',
        body: 'Link your bank securely and MEGA reads income, spending and debts for you.',
        detail: 'Prefer PDFs? Drop them in. We only ask what we can’t verify.',
    },
    {
        icon: ThreeCardsIcon,
        time: 'seconds',
        title: 'Meet your top three',
        body: 'MEGA checks every lender’s real policy and shows three different options, each with its evidence.',
        detail: 'Best overall, lowest cost, and strongest policy fit.',
    },
    {
        icon: HandshakeIcon,
        time: 'same day',
        title: 'A real broker takes over',
        body: 'Sign your credit guide in-app, and a licensed local broker who speaks your language gets in touch.',
        detail: 'They review every match and stay with you to settlement.',
    },
];

export function JourneyTimeline() {
    const { ref, progress } = useScrollProgress<HTMLOListElement>();
    const active = Math.min(
        STEPS.length - 1,
        Math.floor(progress * STEPS.length),
    );

    return (
        <ol ref={ref} className="relative space-y-6 pl-14 sm:pl-20">
            <div
                className="absolute top-4 bottom-4 left-[22px] w-[3px] rounded-full bg-[#13233D]/10 sm:left-[30px]"
                aria-hidden
            >
                <div
                    className="w-full rounded-full bg-[linear-gradient(#2F6BFF,#7B6CE0)] transition-[height] duration-300"
                    style={{ height: `${progress * 100}%` }}
                />
            </div>

            {STEPS.map((step, i) => {
                const reached = i <= active;

                return (
                    <li key={step.title} className="relative">
                        <span
                            className={cn(
                                'absolute top-8 -left-14 grid size-12 place-items-center rounded-full border-[3px] font-mono text-sm font-semibold transition-all duration-500 sm:-left-20 sm:size-16 sm:text-base',
                                reached
                                    ? 'border-[#2F6BFF] bg-[#2F6BFF] text-white shadow-[0_0_0_8px_rgba(47,107,255,0.15)]'
                                    : 'border-[#13233D]/15 bg-[#F6F1E8] text-[#13233D]/40',
                            )}
                        >
                            0{i + 1}
                        </span>
                        <div
                            className={cn(
                                'flex flex-col gap-5 rounded-3xl border p-6 transition-all duration-500 sm:flex-row sm:items-center sm:p-8',
                                i === active
                                    ? 'border-[#2F6BFF]/30 bg-white shadow-[0_30px_80px_-40px_rgba(47,107,255,0.6)]'
                                    : 'border-[#13233D]/10 bg-white/50',
                            )}
                        >
                            <div
                                className={cn(
                                    'shrink-0 transition duration-500',
                                    i === active
                                        ? 'scale-105'
                                        : 'opacity-70 grayscale-[40%]',
                                )}
                            >
                                <step.icon />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-semibold text-[#13233D]">
                                        {step.title}
                                    </h3>
                                    <span className="rounded-full bg-[#13233D]/[0.06] px-2.5 py-0.5 font-mono text-[11px] text-[#13233D]/60">
                                        {step.time}
                                    </span>
                                </div>
                                <p className="mt-2 leading-relaxed text-[#13233D]/70">
                                    {step.body}
                                </p>
                                <p
                                    className={cn(
                                        'overflow-hidden text-sm font-semibold text-[#2F6BFF] transition-all duration-500',
                                        i === active
                                            ? 'mt-3 max-h-16 opacity-100'
                                            : 'max-h-0 opacity-0',
                                    )}
                                >
                                    {step.detail}
                                </p>
                            </div>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
