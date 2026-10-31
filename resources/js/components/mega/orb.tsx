import { cn } from '@/lib/utils';

type Props = {
    className?: string;
    label?: string;
    intensity?: 'idle' | 'working';
};

/**
 * The MEGA core as a lightweight CSS/SVG orb: deep-blue glowing body, light rolling
 * around its surface, a soft rim and thin concentric rings. Used outside the live scene.
 */
export function MegaOrb({ className, label, intensity = 'idle' }: Props) {
    return (
        <div
            className={cn('relative aspect-square select-none', className)}
            aria-hidden={label ? undefined : true}
        >
            <div className="absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,rgba(45,125,255,0.35),transparent_62%)] blur-2xl" />

            {[0, 1, 2].map((ring) => (
                <div
                    key={ring}
                    className="absolute rounded-full border border-[#6FB1FF]/15"
                    style={{ inset: `${-8 - ring * 9}%` }}
                />
            ))}

            <div className="absolute inset-0 overflow-hidden rounded-full bg-[radial-gradient(circle_at_38%_32%,#BFD9FF_0%,#4D96FF_18%,#1D5BE0_42%,#0A2A78_72%,#061636_100%)] shadow-[inset_0_0_40px_rgba(111,177,255,0.55),0_0_60px_rgba(45,125,255,0.45)]">
                <div
                    className={cn(
                        'absolute inset-[-30%] animate-orb-spin bg-[conic-gradient(from_0deg,transparent_0deg,rgba(207,227,255,0.55)_40deg,transparent_95deg,transparent_200deg,rgba(111,177,255,0.4)_250deg,transparent_300deg)] mix-blend-screen blur-md',
                        intensity === 'working' && '[animation-duration:5s]',
                    )}
                />
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_120%,rgba(111,177,255,0.45),transparent_55%)]" />
                <svg
                    className="absolute inset-0 size-full animate-orb-pulse opacity-60"
                    viewBox="0 0 100 100"
                >
                    {[18, 30, 42].map((r) => (
                        <ellipse
                            key={r}
                            cx="50"
                            cy="50"
                            rx={r}
                            ry={r * 0.36}
                            fill="none"
                            stroke="#CFE3FF"
                            strokeOpacity="0.25"
                            strokeWidth="0.4"
                            transform={`rotate(${r} 50 50)`}
                        />
                    ))}
                </svg>
            </div>

            {label && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[clamp(14px,4cqw,28px)] font-light tracking-[0.35em] text-white drop-shadow-[0_0_12px_rgba(111,177,255,0.9)]">
                        {label}
                    </span>
                </div>
            )}
        </div>
    );
}
