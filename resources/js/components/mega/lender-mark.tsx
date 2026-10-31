import { cn } from '@/lib/utils';

/**
 * Clean text wordmark used when a lender's logo is not approved for display.
 */
export function LenderMark({
    name,
    color,
    size = 'md',
    className,
}: {
    name: string;
    color: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const initials = name
        .split(' ')
        .filter((word) => /^[A-Z]/.test(word))
        .slice(0, 2)
        .map((word) => word[0])
        .join('');

    return (
        <span
            className={cn(
                'inline-flex min-w-0 items-center gap-2.5',
                className,
            )}
        >
            <span
                className={cn(
                    'grid shrink-0 place-items-center rounded-md font-semibold text-white',
                    size === 'sm' && 'size-6 text-[10px]',
                    size === 'md' && 'size-8 text-xs',
                    size === 'lg' && 'size-11 text-sm',
                )}
                style={{
                    background: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 55%, #05070a))`,
                }}
                aria-hidden
            >
                {initials}
            </span>
            <span
                className={cn(
                    'truncate font-medium',
                    size === 'lg' && 'text-lg',
                    size === 'sm' && 'text-sm',
                )}
            >
                {name}
            </span>
        </span>
    );
}
