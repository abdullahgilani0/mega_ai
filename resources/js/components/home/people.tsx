import { useId } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const INK = '#13233D';

export const SKIN = {
    light: '#F6D3B8',
    fair: '#EBB993',
    tan: '#C98C61',
    brown: '#9A6141',
    deep: '#6A4029',
} as const;

export type HairStyle = 'short' | 'bun' | 'long' | 'curly' | 'bald' | 'bob';
export type Pose = 'stand' | 'raise' | 'wave' | 'hip';

export type PersonLook = {
    skin: string;
    hair: string;
    hairStyle: HairStyle;
    top: string;
    bottom: string;
    pose?: Pose;
    glasses?: boolean;
    beard?: boolean;
};

/**
 * An original flat-vector person. Local origin is between the feet; about 230 units tall.
 * Anything passed as children is drawn in the raised hand (at 0,0 of the hand).
 */
export function Person({
    x,
    y,
    scale = 1,
    flip = false,
    look,
    children,
}: {
    x: number;
    y: number;
    scale?: number;
    flip?: boolean;
    look: PersonLook;
    children?: ReactNode;
}) {
    const { skin, hair, hairStyle, top, bottom, pose = 'stand' } = look;
    const raisedHand: [number, number] =
        pose === 'raise'
            ? [40, -222]
            : pose === 'wave'
              ? [52, -212]
              : [32, -96];

    return (
        <g
            transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}
        >
            <ellipse cx="0" cy="2" rx="34" ry="6" fill={INK} opacity="0.12" />

            {/* Shoes and legs */}
            <ellipse cx="-10" cy="-4" rx="11" ry="5.5" fill={INK} />
            <ellipse cx="11" cy="-4" rx="11" ry="5.5" fill={INK} />
            <path
                d="M-19 -96 L-17 -6 L-3 -6 L0 -62 L3 -6 L17 -6 L19 -96 Z"
                fill={bottom}
            />

            {/* Back arm */}
            <path
                d={
                    pose === 'hip'
                        ? 'M-24 -152 L-40 -122 L-26 -100'
                        : 'M-24 -152 Q-34 -126 -31 -100'
                }
                stroke={top}
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <circle
                cx={pose === 'hip' ? -26 : -31}
                cy="-98"
                r="6.5"
                fill={skin}
            />

            {/* Hair behind the head */}
            {hairStyle === 'long' && (
                <path
                    d="M-20 -196 C-24 -226 24 -226 20 -196 L23 -150 Q12 -150 10 -160 L-10 -160 Q-12 -150 -23 -150 Z"
                    fill={hair}
                />
            )}

            {/* Torso */}
            <path
                d="M-27 -162 Q-31 -150 -29 -92 L29 -92 Q31 -150 27 -162 Q0 -174 -27 -162 Z"
                fill={top}
            />
            <path
                d="M-9 -166 Q0 -156 9 -166"
                stroke={INK}
                strokeOpacity="0.25"
                strokeWidth="2"
                fill="none"
            />

            {/* Front arm */}
            <path
                d={
                    pose === 'raise'
                        ? 'M24 -152 Q40 -176 40 -214'
                        : pose === 'wave'
                          ? 'M24 -152 Q46 -170 52 -204'
                          : 'M24 -152 Q34 -126 32 -100'
                }
                stroke={top}
                strokeWidth="14"
                strokeLinecap="round"
                fill="none"
            />
            <circle cx={raisedHand[0]} cy={raisedHand[1]} r="7" fill={skin} />
            {children && (
                <g transform={`translate(${raisedHand[0]} ${raisedHand[1]})`}>
                    {children}
                </g>
            )}

            {/* Neck and head */}
            <rect x="-6.5" y="-176" width="13" height="16" rx="4" fill={skin} />
            <circle cx="0" cy="-194" r="19" fill={skin} />
            <circle cx="-19" cy="-192" r="4" fill={skin} />
            <circle cx="19" cy="-192" r="4" fill={skin} />

            {/* Face */}
            <circle cx="-6.5" cy="-195" r="2" fill={INK} />
            <circle cx="6.5" cy="-195" r="2" fill={INK} />
            <path
                d="M-6 -185 Q0 -180 6 -185"
                stroke={INK}
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
            />
            <circle cx="-11" cy="-187" r="3.2" fill="#FF7A59" opacity="0.28" />
            <circle cx="11" cy="-187" r="3.2" fill="#FF7A59" opacity="0.28" />
            {look.beard && (
                <path
                    d="M-17 -192 Q-16 -172 0 -170 Q16 -172 17 -192 Q12 -180 0 -179 Q-12 -180 -17 -192 Z"
                    fill={hair}
                />
            )}
            {look.glasses && (
                <g stroke={INK} strokeWidth="1.6" fill="none">
                    <circle cx="-7" cy="-195" r="5" />
                    <circle cx="7" cy="-195" r="5" />
                    <path d="M-2 -195 L2 -195" />
                </g>
            )}

            {/* Hair */}
            {(hairStyle === 'short' || hairStyle === 'bun') && (
                <path
                    d="M-20 -194 C-22 -219 22 -221 20 -196 C14 -206 -2 -210 -16 -200 Z"
                    fill={hair}
                />
            )}
            {hairStyle === 'bun' && (
                <circle cx="2" cy="-217" r="9" fill={hair} />
            )}
            {hairStyle === 'long' && (
                <path
                    d="M-20 -194 C-21 -221 21 -221 20 -194 C10 -210 -6 -206 -20 -194 Z"
                    fill={hair}
                />
            )}
            {hairStyle === 'bob' && (
                <path
                    d="M-23 -178 C-28 -222 28 -222 23 -178 L17 -178 C16 -196 10 -204 0 -206 C-8 -202 -16 -196 -17 -178 Z"
                    fill={hair}
                />
            )}
            {hairStyle === 'curly' &&
                [
                    [-16, -204],
                    [-7, -212],
                    [4, -213],
                    [14, -206],
                    [19, -195],
                    [-20, -193],
                ].map(([cx, cy]) => (
                    <circle key={`${cx}`} cx={cx} cy={cy} r="8.5" fill={hair} />
                ))}
        </g>
    );
}

/**
 * Head-and-shoulders portrait of a Person, inside a tinted circle.
 */
export function Bust({
    look,
    background,
    className,
}: {
    look: PersonLook;
    background: string;
    className?: string;
}) {
    const clip = useId();

    return (
        <svg
            viewBox="-48 -244 96 96"
            className={cn('size-14', className)}
            aria-hidden
        >
            <defs>
                <clipPath id={clip}>
                    <circle cx="0" cy="-196" r="48" />
                </clipPath>
            </defs>
            <circle cx="0" cy="-196" r="48" fill={background} />
            <g clipPath={`url(#${clip})`}>
                <Person x={0} y={0} look={{ ...look, pose: 'stand' }} />
            </g>
        </svg>
    );
}
