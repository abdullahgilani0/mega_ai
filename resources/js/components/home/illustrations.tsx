import type { ReactNode } from 'react';
import { INK, Person, SKIN } from './people';
import type { PersonLook } from './people';

export const PALETTE = {
    paper: '#F6F1E8',
    sand: '#EADFCB',
    blue: '#2F6BFF',
    sky: '#D9E5FF',
    coral: '#FF7A59',
    sage: '#8DB89A',
    sun: '#FFC861',
    plum: '#7B6CE0',
} as const;

const KEY = (
    <g transform="translate(-4 -24) rotate(-20)">
        <circle
            cx="0"
            cy="0"
            r="9"
            fill={PALETTE.sun}
            stroke={INK}
            strokeWidth="2"
        />
        <circle cx="0" cy="0" r="3" fill={PALETTE.paper} />
        <rect
            x="-2"
            y="8"
            width="4"
            height="22"
            rx="2"
            fill={PALETTE.sun}
            stroke={INK}
            strokeWidth="2"
        />
        <rect
            x="2"
            y="20"
            width="7"
            height="4"
            fill={PALETTE.sun}
            stroke={INK}
            strokeWidth="1.6"
        />
    </g>
);

export const HERO_PEOPLE: Record<'a' | 'b', PersonLook> = {
    a: {
        skin: SKIN.tan,
        hair: '#2B1A12',
        hairStyle: 'bun',
        top: PALETTE.blue,
        bottom: INK,
        pose: 'raise',
    },
    b: {
        skin: SKIN.light,
        hair: '#8B5A2B',
        hairStyle: 'short',
        top: PALETTE.sun,
        bottom: '#3D4F6B',
        beard: true,
    },
};

/**
 * Hero scene: a couple holding the key to their new home.
 */
export function HomeScene({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 600 520"
            className={className}
            role="img"
            aria-label="A couple holding the key to their new home"
        >
            <circle cx="320" cy="250" r="225" fill={PALETTE.sky} />
            <circle
                cx="320"
                cy="250"
                r="225"
                fill="url(#hero-stripes)"
                opacity="0.5"
            />
            <defs>
                <pattern
                    id="hero-stripes"
                    width="14"
                    height="14"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(35)"
                >
                    <rect width="2" height="14" fill="#FFFFFF" />
                </pattern>
            </defs>

            <circle cx="470" cy="110" r="36" fill={PALETTE.sun} />
            <g stroke={PALETTE.sun} strokeWidth="4" strokeLinecap="round">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <line
                        key={angle}
                        x1={470 + Math.cos((angle * Math.PI) / 180) * 48}
                        y1={110 + Math.sin((angle * Math.PI) / 180) * 48}
                        x2={470 + Math.cos((angle * Math.PI) / 180) * 58}
                        y2={110 + Math.sin((angle * Math.PI) / 180) * 58}
                    />
                ))}
            </g>
            <g fill="#FFFFFF">
                <ellipse cx="140" cy="120" rx="38" ry="14" />
                <ellipse cx="168" cy="110" rx="26" ry="16" />
                <ellipse cx="380" cy="70" rx="30" ry="10" />
            </g>

            <ellipse cx="320" cy="468" rx="270" ry="30" fill={PALETTE.sand} />

            {/* House */}
            <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
                <rect x="372" y="168" width="26" height="60" fill="#E2603F" />
                <rect x="210" y="262" width="250" height="198" fill="#FFFFFF" />
                <path d="M188 274 L335 160 L482 274 Z" fill={PALETTE.coral} />
                <circle cx="335" cy="228" r="16" fill="#FFE3A3" />
                <rect
                    x="235"
                    y="300"
                    width="54"
                    height="48"
                    rx="3"
                    fill="#FFE3A3"
                />
                <path d="M262 300 V348 M235 324 H289" />
                <rect
                    x="382"
                    y="300"
                    width="54"
                    height="48"
                    rx="3"
                    fill="#FFE3A3"
                />
                <path d="M409 300 V348 M382 324 H436" />
                <rect
                    x="310"
                    y="362"
                    width="50"
                    height="98"
                    rx="4"
                    fill={PALETTE.blue}
                />
                <circle cx="349" cy="414" r="3.5" fill={PALETTE.sun} />
                <path d="M300 460 H370" />
            </g>
            <rect
                x="320"
                y="374"
                width="30"
                height="20"
                rx="2"
                fill="#FFFFFF"
                opacity="0.25"
            />

            {/* Tree and bushes */}
            <rect
                x="512"
                y="360"
                width="12"
                height="100"
                rx="4"
                fill="#8A5A3C"
            />
            <circle
                cx="518"
                cy="330"
                r="44"
                fill={PALETTE.sage}
                stroke={INK}
                strokeWidth="3"
            />
            <circle cx="500" cy="348" r="22" fill="#77A685" />
            <g stroke={INK} strokeWidth="3" fill={PALETTE.sage}>
                <circle cx="198" cy="446" r="18" />
                <circle cx="222" cy="452" r="14" />
                <circle cx="448" cy="450" r="15" />
            </g>

            {/* Fence */}
            <g stroke={INK} strokeWidth="2.5" fill="#FFFFFF">
                {[40, 64, 88, 112, 136].map((x) => (
                    <path
                        key={x}
                        d={`M${x} 462 V418 L${x + 8} 408 L${x + 16} 418 V462 Z`}
                    />
                ))}
                <rect x="34" y="428" width="122" height="8" />
            </g>

            {/* People */}
            <Person x={118} y={472} scale={0.98} look={HERO_PEOPLE.a}>
                {KEY}
            </Person>
            <Person x={180} y={474} scale={1.04} look={HERO_PEOPLE.b} />

            {/* Little dog */}
            <g
                transform="translate(250 470)"
                stroke={INK}
                strokeWidth="2.5"
                strokeLinejoin="round"
            >
                <path
                    d="M-26 -6 Q-28 -30 -6 -30 L14 -30 Q20 -44 30 -40 Q38 -36 34 -24 Q30 -16 22 -18 L20 -6 Z"
                    fill="#E7B98A"
                />
                <path d="M-26 -22 Q-36 -30 -34 -38" fill="none" />
                <path d="M26 -40 L22 -52 L32 -44" fill="#C98C61" />
                <circle cx="28" cy="-31" r="1.8" fill={INK} stroke="none" />
            </g>
        </svg>
    );
}

function IconFrame({ children, tint }: { children: ReactNode; tint: string }) {
    return (
        <svg viewBox="0 0 120 100" className="h-24 w-auto" aria-hidden>
            <ellipse cx="60" cy="56" rx="50" ry="42" fill={tint} />
            <g
                stroke={INK}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
            >
                {children}
            </g>
        </svg>
    );
}

export function HouseIcon() {
    return (
        <IconFrame tint="#FFE1D6">
            <path d="M28 52 L60 26 L92 52" fill={PALETTE.coral} />
            <rect x="36" y="50" width="48" height="36" fill="#FFFFFF" />
            <rect x="54" y="64" width="13" height="22" fill={PALETTE.blue} />
            <rect x="41" y="57" width="10" height="9" fill="#FFE3A3" />
        </IconFrame>
    );
}

export function CarIcon() {
    return (
        <IconFrame tint="#DCE7FF">
            <path
                d="M22 70 L26 56 Q30 46 42 46 L76 46 Q86 46 92 56 L100 60 Q104 62 104 68 L104 72 L22 72 Z"
                fill={PALETTE.blue}
            />
            <path
                d="M42 50 L50 50 L50 58 L34 58 Q36 50 42 50 Z M56 50 L74 50 Q80 50 84 58 L56 58 Z"
                fill="#FFFFFF"
            />
            <circle cx="42" cy="74" r="9" fill={INK} />
            <circle cx="86" cy="74" r="9" fill={INK} />
            <circle cx="42" cy="74" r="3" fill="#FFFFFF" />
            <circle cx="86" cy="74" r="3" fill="#FFFFFF" />
        </IconFrame>
    );
}

export function WalletIcon() {
    return (
        <IconFrame tint="#E3F0E6">
            <rect
                x="26"
                y="40"
                width="64"
                height="42"
                rx="8"
                fill={PALETTE.sage}
            />
            <path
                d="M26 48 Q26 36 40 34 L78 28 Q84 28 84 34 L84 40"
                fill="#FFFFFF"
            />
            <rect x="72" y="52" width="24" height="16" rx="5" fill="#FFFFFF" />
            <circle cx="80" cy="60" r="3" fill={INK} />
            <circle cx="96" cy="34" r="9" fill={PALETTE.sun} />
            <path d="M96 30 V38" />
        </IconFrame>
    );
}

export function ShopIcon() {
    return (
        <IconFrame tint="#ECE8FF">
            <rect x="30" y="46" width="60" height="40" fill="#FFFFFF" />
            <path d="M26 46 L32 30 L88 30 L94 46 Z" fill={PALETTE.plum} />
            <path d="M40 30 L38 46 M54 30 L54 46 M68 30 L70 46 M80 30 L84 46" />
            <rect x="38" y="56" width="20" height="16" fill="#FFE3A3" />
            <rect x="64" y="56" width="16" height="30" fill={PALETTE.coral} />
        </IconFrame>
    );
}

export function PhoneScanIcon() {
    return (
        <IconFrame tint="#DCE7FF">
            <rect x="42" y="18" width="38" height="68" rx="8" fill="#FFFFFF" />
            <circle cx="61" cy="46" r="10" fill={SKIN.fair} />
            <path d="M51 66 Q61 56 71 66" fill={PALETTE.blue} />
            <path
                d="M48 30 V26 H52 M74 30 V26 H70 M48 62 V66 H52 M74 62 V66 H70"
                stroke={PALETTE.blue}
            />
            <circle cx="61" cy="80" r="2" fill={INK} />
        </IconFrame>
    );
}

export function DocsIcon() {
    return (
        <IconFrame tint="#FFF0CC">
            <rect
                x="30"
                y="26"
                width="42"
                height="54"
                rx="4"
                fill="#FFFFFF"
                transform="rotate(-8 51 53)"
            />
            <rect x="40" y="22" width="42" height="54" rx="4" fill="#FFFFFF" />
            <path d="M48 34 H74 M48 42 H74 M48 50 H66" />
            <circle cx="80" cy="66" r="12" fill={PALETTE.sky} />
            <path d="M89 75 L98 84" strokeWidth="4" />
        </IconFrame>
    );
}

export function ThreeCardsIcon() {
    return (
        <IconFrame tint="#E3F0E6">
            <rect x="22" y="34" width="26" height="40" rx="5" fill="#FFFFFF" />
            <rect
                x="47"
                y="24"
                width="28"
                height="50"
                rx="5"
                fill={PALETTE.blue}
            />
            <rect x="74" y="34" width="26" height="40" rx="5" fill="#FFFFFF" />
            <path d="M54 48 L60 54 L69 42" stroke="#FFFFFF" strokeWidth="3.5" />
        </IconFrame>
    );
}

export function HandshakeIcon() {
    return (
        <IconFrame tint="#FFE1D6">
            <path
                d="M18 52 L38 40 L56 48 L46 58 Q42 62 48 64 L62 56"
                fill="none"
            />
            <path
                d="M102 52 L82 40 L64 44 L50 56 Q46 60 52 64 L70 72 Q76 74 80 70 L92 60"
                fill={SKIN.tan}
            />
            <path
                d="M18 52 L38 40 L56 48 L46 58 Q42 62 48 64 L62 56 L72 64"
                fill={SKIN.light}
            />
            <path
                d="M14 46 L24 64 M106 46 L96 64"
                strokeWidth="5"
                stroke={PALETTE.blue}
            />
        </IconFrame>
    );
}
