import type { SVGAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Original MEGA wordmark: thin geometric strokes, a bar-stack "E" and an open "A".
 */
export function MegaWordmark({
    className,
    ...props
}: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 86 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="square"
            strokeLinejoin="miter"
            role="img"
            aria-label="MEGA"
            className={cn('h-5 w-auto', className)}
            {...props}
        >
            <path d="M1.1 19V1.2L9 12.6 16.9 1.2V19" />
            <path d="M24 1.1h14M24 10h14M24 18.9h14" />
            <path d="M59.1 2.9A10 10 0 1 0 62 10h-7.5" />
            <path d="M68 19 76 1.1 84 19" />
        </svg>
    );
}

/**
 * Compact mark: the MEGA core inside its orbit ring.
 */
export function MegaMark({ className, ...props }: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            className={cn('size-8', className)}
            {...props}
        >
            <defs>
                <radialGradient id="mega-mark-core" cx="40%" cy="35%" r="70%">
                    <stop offset="0%" stopColor="#CFE3FF" />
                    <stop offset="35%" stopColor="#6FB1FF" />
                    <stop offset="100%" stopColor="#1240A8" />
                </radialGradient>
            </defs>
            <circle cx="16" cy="16" r="8.5" fill="url(#mega-mark-core)" />
            <ellipse
                cx="16"
                cy="16"
                rx="14.5"
                ry="5.2"
                stroke="#6FB1FF"
                strokeOpacity="0.85"
                strokeWidth="1.2"
                transform="rotate(-24 16 16)"
            />
            <circle cx="28.6" cy="10.4" r="1.6" fill="#F4F7FB" />
        </svg>
    );
}

export function MegaLogo({ className }: { className?: string }) {
    return (
        <span className={cn('inline-flex items-center gap-2.5', className)}>
            <MegaMark className="size-7" />
            <MegaWordmark className="h-4" />
        </span>
    );
}
