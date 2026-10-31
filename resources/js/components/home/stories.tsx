import { Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PALETTE } from './illustrations';
import { Bust, SKIN } from './people';
import type { PersonLook } from './people';

type Story = {
    key: string;
    name: string;
    tag: string;
    look: PersonLook;
    tint: string;
    situation: string;
    checked: string[];
    outcome: string;
    stat: [string, string];
};

const STORIES: Story[] = [
    {
        key: 'first-home',
        name: 'Ana & Leo',
        tag: 'First home, Parramatta',
        look: {
            skin: SKIN.tan,
            hair: '#2B1A12',
            hairStyle: 'long',
            top: PALETTE.coral,
            bottom: '#13233D',
        },
        tint: '#FFE1D6',
        situation:
            'Two incomes, a 10% deposit, and Leo started a new job four months ago.',
        checked: [
            'LVR of 90% against each lender’s grid',
            'Which lenders accept under 6 months in a role',
            'First home buyer guarantee eligibility',
        ],
        outcome:
            'Three options, including one that accepts a recent job change without a waiting period.',
        stat: ['90%', 'LVR, matched'],
    },
    {
        key: 'upsizing',
        name: 'The Okafors',
        tag: 'Upsizing, three kids',
        look: {
            skin: SKIN.deep,
            hair: '#1A1210',
            hairStyle: 'curly',
            top: PALETTE.sage,
            bottom: '#3D4F6B',
            glasses: true,
        },
        tint: '#E3F0E6',
        situation:
            'Selling and buying at once, with three dependants and a car loan.',
        checked: [
            'Bridging policy and peak-debt limits',
            'Living costs at the higher of declared and benchmark',
            'Car loan and card limits in serviceability',
        ],
        outcome:
            'Two lenders fit comfortably; one needs a broker check on bridging terms.',
        stat: ['$1,180', 'monthly headroom'],
    },
    {
        key: 'tradie',
        name: 'Jack',
        tag: 'Self-employed sparky, new ute',
        look: {
            skin: SKIN.light,
            hair: '#C9822F',
            hairStyle: 'short',
            top: PALETTE.sun,
            bottom: '#3D4F6B',
            beard: true,
        },
        tint: '#FFF0CC',
        situation:
            'ABN for 18 months, BAS lodged, wants a 2-year-old ute with a balloon.',
        checked: [
            'Minimum ABN age per lender',
            'Asset age at end of term',
            'Balloon limits and low-doc options',
        ],
        outcome:
            'Matched with asset lenders that accept 12+ months ABN; one bank ruled out on age.',
        stat: ['18 mo', 'ABN accepted'],
    },
    {
        key: 'cafe',
        name: 'Mei',
        tag: 'Café owner, second site',
        look: {
            skin: SKIN.fair,
            hair: '#1E1A1A',
            hairStyle: 'bob',
            top: PALETTE.plum,
            bottom: '#13233D',
        },
        tint: '#ECE8FF',
        situation:
            'Two years trading, strong turnover, wants equipment and fit-out for a new site.',
        checked: [
            'Time trading and turnover floors',
            'Industry policy for hospitality',
            'Director credit and guarantees',
        ],
        outcome:
            'Business lenders shortlisted with fit-out finance; a broker confirms security.',
        stat: ['24 mo', 'trading history'],
    },
];

export function Stories() {
    const [active, setActive] = useState(STORIES[0].key);
    const story = STORIES.find((s) => s.key === active) ?? STORIES[0];

    return (
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.4fr]">
            <div
                className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible"
                role="tablist"
            >
                {STORIES.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        role="tab"
                        aria-selected={item.key === active}
                        onClick={() => setActive(item.key)}
                        className={cn(
                            'flex min-w-60 items-center gap-4 rounded-2xl border p-3 pr-5 text-left transition',
                            item.key === active
                                ? 'border-[#13233D] bg-[#13233D] text-white shadow-[0_20px_40px_-20px_rgba(19,35,61,0.6)]'
                                : 'border-[#13233D]/10 bg-white text-[#13233D] hover:border-[#13233D]/30',
                        )}
                    >
                        <Bust
                            look={item.look}
                            background={item.tint}
                            className="size-14 shrink-0"
                        />
                        <span>
                            <span className="block font-semibold">
                                {item.name}
                            </span>
                            <span
                                className={cn(
                                    'text-sm',
                                    item.key === active
                                        ? 'text-white/65'
                                        : 'text-[#13233D]/55',
                                )}
                            >
                                {item.tag}
                            </span>
                        </span>
                    </button>
                ))}
            </div>

            <div
                key={story.key}
                className="relative animate-rise overflow-hidden rounded-[32px] bg-white p-8 sm:p-10"
                role="tabpanel"
            >
                <div
                    className="absolute -top-16 -right-16 size-56 rounded-full"
                    style={{ background: story.tint }}
                    aria-hidden
                />
                <div className="relative">
                    <div className="flex items-start justify-between gap-6">
                        <p className="max-w-md font-display text-3xl leading-snug text-[#13233D]">
                            “{story.situation}”
                        </p>
                        <Bust
                            look={story.look}
                            background="#FFFFFF"
                            className="hidden size-24 shrink-0 sm:block"
                        />
                    </div>
                    <div className="mt-8 grid gap-8 sm:grid-cols-[1.3fr_1fr]">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.2em] text-[#13233D]/50 uppercase">
                                What MEGA checked
                            </p>
                            <ul className="mt-3 space-y-2.5">
                                {story.checked.map((item) => (
                                    <li
                                        key={item}
                                        className="flex gap-2.5 text-[#13233D]/80"
                                    >
                                        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#2F6BFF] text-white">
                                            <Check
                                                className="size-3"
                                                strokeWidth={3}
                                            />
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-2xl bg-[#F6F1E8] p-5">
                            <p className="font-mono text-3xl text-[#13233D]">
                                {story.stat[0]}
                            </p>
                            <p className="text-sm text-[#13233D]/60">
                                {story.stat[1]}
                            </p>
                            <p className="mt-4 text-sm leading-relaxed text-[#13233D]/80">
                                {story.outcome}
                            </p>
                        </div>
                    </div>
                    <p className="mt-8 text-xs text-[#13233D]/45">
                        Illustrative scenario showing how matching works. Not a
                        real customer or a testimonial.
                    </p>
                </div>
            </div>
        </div>
    );
}
