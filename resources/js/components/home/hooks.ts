import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

/**
 * True once the element has scrolled into view (fires once).
 */
export function useInView<T extends Element>(threshold = 0.2) {
    const ref = useRef<T>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const element = ref.current;

        if (!element) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { threshold },
        );
        observer.observe(element);

        return () => observer.disconnect();
    }, [threshold]);

    return { ref, inView };
}

/**
 * Counts from 0 to the target once active, easing out.
 */
export function useCountUp(target: number, active: boolean, duration = 1400) {
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (!active) {
            return;
        }

        let frame = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));

            if (t < 1) {
                frame = requestAnimationFrame(tick);
            }
        };
        frame = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(frame);
    }, [target, active, duration]);

    return value;
}

/**
 * Subtle 3D tilt that follows the pointer. Writes styles directly to avoid re-renders.
 */
export function useTilt<T extends HTMLElement>(strength = 8) {
    const ref = useRef<T>(null);

    const onMouseMove = (event: ReactMouseEvent<T>) => {
        const element = ref.current;

        if (!element) {
            return;
        }

        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        element.style.transform = `perspective(900px) rotateX(${(-y * strength).toFixed(2)}deg) rotateY(${(x * strength).toFixed(2)}deg) translateY(-4px)`;
        element.style.setProperty(
            '--glow-x',
            `${((x + 0.5) * 100).toFixed(1)}%`,
        );
        element.style.setProperty(
            '--glow-y',
            `${((y + 0.5) * 100).toFixed(1)}%`,
        );
    };

    const onMouseLeave = () => {
        if (ref.current) {
            ref.current.style.transform = '';
        }
    };

    return { ref, onMouseMove, onMouseLeave };
}

/**
 * 0 → 1 as the element scrolls through the middle of the viewport.
 */
export function useScrollProgress<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let frame = 0;
        const update = () => {
            frame = 0;
            const element = ref.current;

            if (!element) {
                return;
            }

            const rect = element.getBoundingClientRect();
            const viewport = window.innerHeight;
            const raw = (viewport * 0.55 - rect.top) / rect.height;
            setProgress(Math.max(0, Math.min(1, raw)));
        };
        const onScroll = () => {
            if (!frame) {
                frame = requestAnimationFrame(update);
            }
        };

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    return { ref, progress };
}
