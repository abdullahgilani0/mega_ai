import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types/mega';

export function ConsolePage({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">{children}</div>
    );
}

export function PageHeader({
    eyebrow,
    title,
    description,
    actions,
}: {
    eyebrow?: string;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
                {eyebrow && (
                    <p className="eyebrow text-mega-bright">{eyebrow}</p>
                )}
                <h1 className="mt-2 font-display text-4xl leading-tight">
                    {title}
                </h1>
                {description && (
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {actions}
        </div>
    );
}

export function StatCard({
    label,
    value,
    hint,
    tone = 'default',
}: {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    tone?: 'default' | 'warn' | 'ok' | 'accent';
}) {
    return (
        <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p
                className={cn(
                    'num mt-2 text-3xl',
                    tone === 'warn' && 'text-warn',
                    tone === 'ok' && 'text-ok',
                    tone === 'accent' && 'text-mega-bright',
                )}
            >
                {value}
            </p>
            {hint && (
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            )}
        </div>
    );
}

export function Card({
    title,
    actions,
    children,
    className,
}: {
    title?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'rounded-2xl border border-border bg-card',
                className,
            )}
        >
            {title && (
                <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                    <h2 className="text-sm font-medium">{title}</h2>
                    {actions}
                </header>
            )}
            <div className="p-5">{children}</div>
        </section>
    );
}

export function Table({ children }: { children: ReactNode }) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-left text-sm [&_tbody_tr]:border-b [&_tbody_tr]:border-border/60 [&_tbody_tr:hover]:bg-accent/40 [&_tbody_tr:last-child]:border-0 [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:text-xs [&_th]:font-medium [&_th]:text-muted-foreground [&_thead]:border-b [&_thead]:border-border">
                {children}
            </table>
        </div>
    );
}

const TONES: Record<string, string> = {
    ok: 'bg-ok/15 text-ok',
    warn: 'bg-warn/15 text-warn',
    error: 'bg-error/15 text-error',
    accent: 'bg-mega/15 text-mega-bright',
    muted: 'bg-foreground/5 text-muted-foreground',
};

export function Pill({
    children,
    tone = 'muted',
}: {
    children: ReactNode;
    tone?: keyof typeof TONES;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] whitespace-nowrap',
                TONES[tone],
            )}
        >
            {children}
        </span>
    );
}

export function statusTone(status: string): keyof typeof TONES {
    if (
        [
            'approved',
            'settled',
            'accepted',
            'verified',
            'published',
            'full',
            'active',
            'pass',
            'cleared',
        ].includes(status)
    ) {
        return 'ok';
    }

    if (
        [
            'unallocated',
            'needs_attention',
            'partial',
            'draft',
            'unsure',
            'paused',
            'manual_review',
            'expired',
            'offered',
            'leave',
        ].includes(status)
    ) {
        return 'warn';
    }

    if (
        [
            'declined',
            'withdrawn',
            'fail',
            'unmapped',
            'confirmed_concern',
        ].includes(status)
    ) {
        return 'error';
    }

    if (
        [
            'allocated',
            'allocating',
            'in_progress',
            'submitted_to_lender',
            'conditionally_approved',
            'in_review',
        ].includes(status)
    ) {
        return 'accent';
    }

    return 'muted';
}

export function Pagination<T>({ page }: { page: Paginated<T> }) {
    if (page.last_page <= 1) {
        return null;
    }

    return (
        <nav className="flex flex-wrap items-center gap-1">
            {page.links.map((link, i) => (
                <Link
                    key={i}
                    href={link.url ?? '#'}
                    preserveScroll
                    className={cn(
                        'rounded-md px-3 py-1.5 text-xs',
                        link.active
                            ? 'bg-mega text-white'
                            : 'text-muted-foreground hover:bg-accent',
                        !link.url && 'pointer-events-none opacity-40',
                    )}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                />
            ))}
        </nav>
    );
}
