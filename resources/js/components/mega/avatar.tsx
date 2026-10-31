import { cn } from '@/lib/utils';

const VISORS = [
    ['#6FB1FF', '#2D7DFF'],
    ['#7CF0C5', '#16A877'],
    ['#FFD27A', '#E39A12'],
    ['#C9B6FF', '#7C5CFF'],
    ['#FF9FB0', '#E2445E'],
    ['#9BE8FF', '#1BA7CF'],
];

const SUITS = ['#E8EDF5', '#C9D3E2', '#F5EFE4', '#D9E6F2'];

/**
 * One of 24 original abstract astronaut-style avatars. Deterministic from the index:
 * never photos, and never based on ethnicity, gender or age.
 */
export function MegaAvatar({
    index,
    className,
    title,
}: {
    index: number;
    className?: string;
    title?: string;
}) {
    const i = ((index % 24) + 24) % 24;
    const [visorLight, visorDark] = VISORS[i % VISORS.length];
    const suit = SUITS[Math.floor(i / 6) % SUITS.length];
    const antenna = i % 3;
    const id = `av-${i}`;

    return (
        <svg
            viewBox="0 0 64 64"
            className={cn('size-12', className)}
            role={title ? 'img' : undefined}
            aria-label={title}
            aria-hidden={title ? undefined : true}
        >
            <defs>
                <linearGradient id={`${id}-v`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={visorLight} />
                    <stop offset="100%" stopColor={visorDark} />
                </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="31" fill="#0C1016" />
            <path d="M14 60c2-11 9-17 18-17s16 6 18 17" fill={suit} />
            <circle cx="32" cy="27" r="15" fill={suit} />
            <rect
                x="21"
                y="20"
                width="22"
                height="14"
                rx="7"
                fill={`url(#${id}-v)`}
            />
            <path
                d="M25 23.5c2-1.6 5-2 8-1.4"
                stroke="#fff"
                strokeOpacity=".7"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
            />
            {antenna === 0 && (
                <>
                    <path d="M32 12V6" stroke={suit} strokeWidth="2" />
                    <circle cx="32" cy="5" r="2.4" fill={visorLight} />
                </>
            )}
            {antenna === 1 && (
                <rect
                    x="44"
                    y="22"
                    width="5"
                    height="9"
                    rx="2.5"
                    fill={visorDark}
                />
            )}
            {antenna === 2 && (
                <circle
                    cx="32"
                    cy="27"
                    r="17.5"
                    fill="none"
                    stroke={visorLight}
                    strokeOpacity=".5"
                    strokeDasharray="2 3"
                />
            )}
            <rect
                x="27"
                y="48"
                width="10"
                height="5"
                rx="1.5"
                fill={visorDark}
                opacity=".8"
            />
        </svg>
    );
}
