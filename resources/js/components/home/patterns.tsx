import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useInView } from './hooks';

/**
 * Procedural topographic contour lines: the MEGA "terrain" motif.
 */
export function Topography({
    className,
    rings = 14,
    seed = 1,
}: {
    className?: string;
    rings?: number;
    seed?: number;
}) {
    const paths = Array.from({ length: rings }, (_, ring) => {
        const base = 30 + ring * 26;
        const points = Array.from({ length: 72 }, (_, i) => {
            const a = (i / 72) * Math.PI * 2;
            const wobble =
                1 +
                0.09 * Math.sin(3 * a + ring * 0.35 + seed) +
                0.06 * Math.sin(5 * a - ring * 0.2 + seed * 2) +
                0.03 * Math.sin(9 * a + seed);
            const r = base * wobble;

            return [300 + r * Math.cos(a) * 1.25, 300 + r * Math.sin(a)];
        });

        return (
            points
                .map(
                    ([x, y], i) =>
                        `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`,
                )
                .join(' ') + 'Z'
        );
    });

    return (
        <svg
            viewBox="0 0 600 600"
            fill="none"
            aria-hidden
            className={cn('pointer-events-none', className)}
        >
            {paths.map((d, i) => (
                <path
                    key={i}
                    d={d}
                    stroke="currentColor"
                    strokeWidth={i % 4 === 0 ? 1.2 : 0.7}
                    strokeOpacity={i % 4 === 0 ? 0.55 : 0.3}
                />
            ))}
        </svg>
    );
}

export function DotGrid({ className }: { className?: string }) {
    return (
        <div
            aria-hidden
            className={cn(
                'pointer-events-none bg-[radial-gradient(currentColor_1px,transparent_1.4px)] [background-size:18px_18px]',
                className,
            )}
        />
    );
}

export function Squiggle({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 200 20"
            fill="none"
            aria-hidden
            className={className}
            preserveAspectRatio="none"
        >
            <path
                d="M2 12 C 20 2, 30 18, 48 10 S 80 2, 98 11 S 132 19, 150 9 S 182 3, 198 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}

/**
 * Fades and lifts its children into place when scrolled into view.
 */
export function Reveal({
    children,
    delay = 0,
    className,
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}) {
    const { ref, inView } = useInView<HTMLDivElement>(0.15);

    return (
        <div
            ref={ref}
            className={cn(
                'transition-[opacity,transform,filter] duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
                inView
                    ? 'blur-0 translate-y-0 scale-100 opacity-100'
                    : 'translate-y-10 scale-[0.98] opacity-0 blur-[6px]',
                className,
            )}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

/**
 * Headline whose words rise out of a mask one after another. Pass lines as arrays
 * of words; a word wrapped in an object gets its own class (e.g. gradient text).
 */
export function RiseHeadline({
    lines,
    className,
    delay = 0,
    whenVisible = false,
    as: Tag = 'h2',
}: {
    lines: (string | { text: string; className: string })[][];
    className?: string;
    delay?: number;
    whenVisible?: boolean;
    as?: 'h1' | 'h2';
}) {
    const { ref, inView } = useInView<HTMLHeadingElement>(0.3);
    const play = !whenVisible || inView;
    let index = 0;

    return (
        <Tag ref={ref} className={className}>
            {lines.map((line, l) => (
                <span key={l} className="block">
                    {line.map((word) => {
                        const text =
                            typeof word === 'string' ? word : word.text;
                        const extra =
                            typeof word === 'string' ? '' : word.className;
                        const order = index++;

                        return (
                            <span key={`${l}-${order}`} className="word-mask">
                                <span
                                    className={cn(
                                        play ? 'word-rise' : 'opacity-0',
                                        extra,
                                    )}
                                    style={{
                                        animationDelay: `${delay + order * 70}ms`,
                                    }}
                                >
                                    {text}&nbsp;
                                </span>
                            </span>
                        );
                    })}
                </span>
            ))}
        </Tag>
    );
}
