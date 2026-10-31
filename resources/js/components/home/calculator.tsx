import { Link } from '@inertiajs/react';
import { ArrowRight, Info } from 'lucide-react';
import { useState } from 'react';
import type { InertiaLinkProps } from '@inertiajs/react';
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { DotGrid } from './patterns';

const PANEL_SIZE = 92;
const ASSESSMENT_RATE = 9.0;
const INDICATIVE_RATE = 6.1;

const money = (value: number) =>
    new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        maximumFractionDigits: 0,
    }).format(value);

function netAnnualIncome(gross: number): number {
    const tax =
        gross <= 18200
            ? 0
            : gross <= 45000
              ? (gross - 18200) * 0.16
              : gross <= 135000
                ? 4288 + (gross - 45000) * 0.3
                : gross <= 190000
                  ? 31288 + (gross - 135000) * 0.37
                  : 51638 + (gross - 190000) * 0.45;

    return gross - tax - gross * 0.02;
}

function repayment(principal: number, annualRate: number, months = 360) {
    const r = annualRate / 100 / 12;

    return (principal * r) / (1 - (1 + r) ** -months);
}

/**
 * Illustrative only: the same shape of maths the engine uses (tax, a living-cost floor,
 * a buffered assessment rate) with typical panel LVR limits. Not lender-specific.
 */
function estimate(
    price: number,
    depositPct: number,
    income: number,
    joint: boolean,
) {
    const loan = price * (1 - depositPct / 100);
    const lvr = 100 - depositPct;
    const monthlyNet = netAnnualIncome(income) / 12;
    const livingCosts = 1900 + (joint ? 1000 : 0);
    const available = Math.max(0, monthlyNet - livingCosts);
    const r = ASSESSMENT_RATE / 100 / 12;
    const borrowingPower =
        Math.round((available * (1 - (1 + r) ** -360)) / r / 1000) * 1000;
    const affordable = loan <= borrowingPower;

    const lvrShare =
        lvr <= 80
            ? 0.86
            : lvr <= 85
              ? 0.72
              : lvr <= 90
                ? 0.55
                : lvr <= 95
                  ? 0.3
                  : 0.03;
    const headroom =
        borrowingPower > 0 ? Math.min(1, loan / borrowingPower) : 1;
    const lenders = Math.round(
        PANEL_SIZE *
            lvrShare *
            (affordable ? 1 - Math.max(0, headroom - 0.85) * 1.5 : 0.08),
    );

    return {
        loan,
        lvr,
        borrowingPower,
        affordable,
        lenders,
        monthly: repayment(loan, INDICATIVE_RATE),
    };
}

function Slider({
    label,
    value,
    display,
    min,
    max,
    step,
    onChange,
}: {
    label: string;
    value: number;
    display: string;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
}) {
    const percent = ((value - min) / (max - min)) * 100;

    return (
        <label className="block">
            <span className="flex items-baseline justify-between text-sm">
                <span className="text-[#13233D]/70">{label}</span>
                <span className="font-mono text-base font-medium text-[#13233D] tabular-nums">
                    {display}
                </span>
            </span>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="mega-range mt-3 w-full"
                style={{ '--fill': `${percent}%` } as CSSProperties}
            />
        </label>
    );
}

function LvrGauge({ lvr }: { lvr: number }) {
    const radius = 54;
    const circumference = Math.PI * radius;
    const fraction = Math.min(1, lvr / 100);
    const tone = lvr <= 80 ? '#3E9B6B' : lvr <= 90 ? '#E39A12' : '#E2445E';

    return (
        <div className="relative w-36">
            <svg viewBox="0 0 140 80" className="w-full" aria-hidden>
                <path
                    d="M16 72 A54 54 0 0 1 124 72"
                    fill="none"
                    stroke="#13233D"
                    strokeOpacity="0.1"
                    strokeWidth="12"
                    strokeLinecap="round"
                />
                <path
                    d="M16 72 A54 54 0 0 1 124 72"
                    fill="none"
                    stroke={tone}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - fraction)}
                    className="transition-[stroke-dashoffset,stroke] duration-500"
                />
                {/* 80% LVR marker: below it, most lenders skip mortgage insurance. */}
                <line
                    x1="70"
                    y1="72"
                    x2={70 + Math.cos(Math.PI * 0.2) * 62}
                    y2={72 - Math.sin(Math.PI * 0.2) * 62}
                    stroke="#13233D"
                    strokeOpacity="0.35"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                />
            </svg>
            <div className="absolute inset-x-0 bottom-0 text-center">
                <p className="font-mono text-2xl font-medium tabular-nums">
                    {lvr}%
                </p>
                <p className="text-[11px] text-[#13233D]/60">loan-to-value</p>
            </div>
        </div>
    );
}

export function MatchPreview({
    ctaHref,
}: {
    ctaHref: NonNullable<InertiaLinkProps['href']>;
}) {
    const [price, setPrice] = useState(850000);
    const [deposit, setDeposit] = useState(20);
    const [income, setIncome] = useState(165000);
    const [joint, setJoint] = useState(true);
    const result = estimate(price, deposit, income, joint);

    return (
        <div className="relative overflow-hidden rounded-[32px] border border-[#13233D]/10 bg-white shadow-[0_40px_120px_-50px_rgba(19,35,61,0.45)]">
            <DotGrid className="absolute inset-0 text-[#13233D]/[0.06]" />
            <div className="relative grid lg:grid-cols-[1fr_1.15fr]">
                <div className="space-y-7 border-b border-[#13233D]/10 p-7 sm:p-10 lg:border-r lg:border-b-0">
                    <div>
                        <p className="text-xs font-semibold tracking-[0.2em] text-[#2F6BFF] uppercase">
                            Try it, no sign-up
                        </p>
                        <h3 className="mt-2 font-display text-3xl text-[#13233D]">
                            What could this look like for you?
                        </h3>
                    </div>
                    <Slider
                        label="Property price"
                        value={price}
                        display={money(price)}
                        min={300000}
                        max={2500000}
                        step={10000}
                        onChange={setPrice}
                    />
                    <Slider
                        label="Deposit"
                        value={deposit}
                        display={`${deposit}% · ${money((price * deposit) / 100)}`}
                        min={5}
                        max={40}
                        step={1}
                        onChange={setDeposit}
                    />
                    <Slider
                        label={
                            joint
                                ? 'Combined income before tax'
                                : 'Income before tax'
                        }
                        value={income}
                        display={money(income)}
                        min={40000}
                        max={400000}
                        step={5000}
                        onChange={setIncome}
                    />
                    <div className="flex rounded-full bg-[#13233D]/[0.06] p-1 text-sm">
                        {[
                            [false, 'Just me'],
                            [true, 'With a partner'],
                        ].map(([value, label]) => (
                            <button
                                key={String(value)}
                                type="button"
                                onClick={() => setJoint(value as boolean)}
                                aria-pressed={joint === value}
                                className={cn(
                                    'flex-1 rounded-full py-2 transition',
                                    joint === value
                                        ? 'bg-white font-medium text-[#13233D] shadow-sm'
                                        : 'text-[#13233D]/60',
                                )}
                            >
                                {label as string}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-7 sm:p-10">
                    <div className="flex flex-wrap items-end gap-8">
                        <LvrGauge lvr={result.lvr} />
                        <dl className="grid flex-1 grid-cols-2 gap-5 text-[#13233D]">
                            <div>
                                <dt className="text-xs text-[#13233D]/60">
                                    Loan amount
                                </dt>
                                <dd className="mt-1 font-mono text-xl tabular-nums">
                                    {money(result.loan)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-[#13233D]/60">
                                    Est. borrowing power
                                </dt>
                                <dd
                                    className={cn(
                                        'mt-1 font-mono text-xl tabular-nums',
                                        !result.affordable && 'text-[#E2445E]',
                                    )}
                                >
                                    {money(result.borrowingPower)}
                                </dd>
                            </div>
                            <div className="col-span-2">
                                <dt className="text-xs text-[#13233D]/60">
                                    Repayments around {INDICATIVE_RATE}% p.a.
                                </dt>
                                <dd className="mt-1 font-mono text-xl tabular-nums">
                                    {money(result.monthly)}
                                    <span className="text-sm text-[#13233D]/50">
                                        {' '}
                                        / month
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="mt-8 rounded-2xl bg-[#F6F1E8] p-5">
                        <p className="text-sm text-[#13233D]">
                            <span className="font-mono text-2xl font-medium tabular-nums">
                                {result.lenders}
                            </span>
                            <span className="text-[#13233D]/70">
                                {' '}
                                of {PANEL_SIZE} panel lenders typically consider
                                a profile like this
                            </span>
                        </p>
                        <div
                            className="mt-4 grid grid-cols-[repeat(23,minmax(0,1fr))] gap-1.5"
                            aria-hidden
                        >
                            {Array.from({ length: PANEL_SIZE }, (_, i) => (
                                <span
                                    key={i}
                                    className={cn(
                                        'aspect-square rounded-full transition-all duration-500',
                                        i < result.lenders
                                            ? 'scale-100 bg-[#2F6BFF]'
                                            : 'scale-75 bg-[#13233D]/15',
                                    )}
                                    style={{
                                        transitionDelay: `${(i % 23) * 12}ms`,
                                    }}
                                />
                            ))}
                        </div>
                        {!result.affordable && (
                            <p className="mt-4 text-sm text-[#B5304A]">
                                This loan is above the estimated borrowing
                                power. A bigger deposit or a lower price opens
                                up more lenders.
                            </p>
                        )}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                        <p className="flex max-w-xs items-start gap-1.5 text-[11px] leading-snug text-[#13233D]/55">
                            <Info className="mt-0.5 size-3.5 shrink-0" />
                            A rough illustration only. Your real matches use
                            each lender's actual policy, and are indicative, not
                            an offer.
                        </p>
                        <Link
                            href={ctaHref}
                            className="group inline-flex h-12 items-center gap-2 rounded-full bg-[#13233D] px-6 text-sm font-medium text-white transition hover:bg-[#2F6BFF]"
                        >
                            Get my real matches
                            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
