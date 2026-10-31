import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function StepContainer({
    children,
    wide = false,
    className,
}: {
    children: ReactNode;
    wide?: boolean;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'mx-auto w-full px-5 py-10 sm:py-16',
                wide ? 'max-w-5xl' : 'max-w-2xl',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function StepHeading({
    eyebrow,
    title,
    description,
    className,
}: {
    eyebrow?: string;
    title: ReactNode;
    description?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('mb-10 animate-rise', className)}>
            {eyebrow && <p className="eyebrow text-mega-bright">{eyebrow}</p>}
            <h1 className="mt-3 font-display text-[clamp(34px,5vw,52px)] leading-[1.05]">
                {title}
            </h1>
            {description && (
                <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
                    {description}
                </p>
            )}
        </div>
    );
}

const STATUS_STYLES = {
    queued: ['bg-mega-dim', 'Queued'],
    reading: ['bg-mega-bright animate-pulse', 'Reading'],
    verified: ['bg-ok', 'Verified'],
    in_review: ['bg-mega-bright', 'Being reviewed'],
    needs_attention: ['bg-warn', 'Needs attention'],
} as const;

export function StatusDot({
    status,
    withLabel = true,
}: {
    status: keyof typeof STATUS_STYLES;
    withLabel?: boolean;
}) {
    const [dot, label] = STATUS_STYLES[status];

    return (
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn('size-2 rounded-full', dot)} aria-hidden />
            {withLabel && label}
        </span>
    );
}

export function IndicativeNote({ className }: { className?: string }) {
    return (
        <p
            className={cn(
                'text-xs tracking-wide text-muted-foreground',
                className,
            )}
        >
            Indicative, not an offer. A licensed broker reviews every match.
        </p>
    );
}

export function Panel({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'rounded-2xl border border-border bg-card/70 p-6 backdrop-blur',
                className,
            )}
        >
            {children}
        </div>
    );
}
