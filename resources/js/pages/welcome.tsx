import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    BadgeCheck,
    Check,
    FileSearch,
    Menu,
    MessageSquareText,
    Scale,
    ShieldCheck,
    Sparkles,
    UsersRound,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { InertiaLinkProps } from '@inertiajs/react';
import type {
    ComponentType,
    CSSProperties,
    MouseEvent as ReactMouseEvent,
    ReactNode,
} from 'react';
import {
    AiCapabilities,
    AiLiveFeed,
    AiTicker,
    NeuralNet,
    ThenVsNow,
} from '@/components/home/ai';
import { MatchPreview } from '@/components/home/calculator';
import { EngineDemo } from '@/components/home/engine-demo';
import { Faq } from '@/components/home/faq';
import { useCountUp, useInView, useTilt } from '@/components/home/hooks';
import {
    CarIcon,
    HomeScene,
    HouseIcon,
    PALETTE,
    ShopIcon,
    WalletIcon,
} from '@/components/home/illustrations';
import { JourneyTimeline } from '@/components/home/journey';
import {
    DotGrid,
    Reveal,
    RiseHeadline,
    Squiggle,
    Topography,
} from '@/components/home/patterns';
import { Bust, INK, Person, SKIN } from '@/components/home/people';
import type { PersonLook } from '@/components/home/people';
import { Stories } from '@/components/home/stories';
import { LenderMark } from '@/components/mega/lender-mark';
import { MegaLogo, MegaWordmark } from '@/components/mega/logo';
import { cn } from '@/lib/utils';
import { dashboard, login, register } from '@/routes';

type Href = NonNullable<InertiaLinkProps['href']>;

const BROKERS: PersonLook[] = [
    {
        skin: SKIN.tan,
        hair: '#1E1414',
        hairStyle: 'long',
        top: PALETTE.blue,
        bottom: INK,
    },
    {
        skin: SKIN.light,
        hair: '#B5651D',
        hairStyle: 'short',
        top: PALETTE.sage,
        bottom: INK,
        glasses: true,
    },
    {
        skin: SKIN.deep,
        hair: '#111111',
        hairStyle: 'curly',
        top: PALETTE.coral,
        bottom: INK,
    },
    {
        skin: SKIN.fair,
        hair: '#2A2321',
        hairStyle: 'bun',
        top: PALETTE.plum,
        bottom: INK,
    },
];

const PANEL = [
    ['Harbourline Bank', '#2D7DFF'],
    ['Banksia Bank', '#2FD08A'],
    ['Jarrah Bank', '#FFB547'],
    ['Tidewater Credit Union', '#22D3EE'],
    ['Northline Home Loans', '#A78BFA'],
    ['Kestrel Bank', '#F472B6'],
    ['Mulga Credit Union', '#60A5FA'],
    ['Torque Asset Finance', '#FB923C'],
    ['Ledgerline Capital', '#34D399'],
    ['Coolabah Bank', '#FACC15'],
    ['Southmark Bank', '#6FB1FF'],
    ['Orbital Home Loans', '#FF5C6C'],
] as const;

const LOAN_TYPES: {
    icon: ComponentType;
    title: string;
    body: string;
    checks: string[];
    tint: string;
}[] = [
    {
        icon: HouseIcon,
        title: 'Home loans',
        body: 'Buying, refinancing or investing.',
        checks: [
            'LVR grids by postcode',
            'Mortgage insurance',
            'Serviceability buffers',
        ],
        tint: '#FFE1D6',
    },
    {
        icon: CarIcon,
        title: 'Car & asset',
        body: 'New, used, or the gear your business runs on.',
        checks: ['Asset age limits', 'Balloon rules', 'Loan size & term'],
        tint: '#DCE7FF',
    },
    {
        icon: WalletIcon,
        title: 'Personal loans',
        body: 'Renovations, consolidation, life’s big moments.',
        checks: ['Credit score floors', 'Income minimums', 'Purpose rules'],
        tint: '#E3F0E6',
    },
    {
        icon: ShopIcon,
        title: 'Business loans',
        body: 'From working capital to your next site.',
        checks: ['Time trading', 'Turnover floors', 'Industry policy'],
        tint: '#ECE8FF',
    },
];

const ENGINE_POINTS = [
    {
        icon: Scale,
        title: 'Real policy, not guesses',
        body: 'Each lender’s actual rules: LVR grids, credit floors, income treatment.',
    },
    {
        icon: FileSearch,
        title: 'Reads your documents',
        body: 'And reconciles them, so you are only asked what can’t be verified.',
    },
    {
        icon: MessageSquareText,
        title: 'An advisor that listens',
        body: 'Tell it your story in your own words. It takes notes you confirm.',
    },
    {
        icon: UsersRound,
        title: 'A human signs off',
        body: 'A licensed broker reviews every shortlist before anything goes to a lender.',
    },
];

export default function Welcome() {
    const { auth } = usePage().props;
    const primaryHref = auth.user ? dashboard() : register();

    return (
        <>
            <Head title="Find the lenders that fit you" />
            <div className="min-h-screen overflow-x-clip bg-[#F6F1E8] font-sans text-[#13233D] antialiased selection:bg-[#2F6BFF] selection:text-white">
                <SiteNav signedIn={Boolean(auth.user)} />
                <Hero primaryHref={primaryHref} />
                <PanelStrip />
                <WhyAi />

                <section className="relative px-5 py-24 sm:px-8 lg:py-32">
                    <div className="mx-auto max-w-7xl">
                        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
                            <Eyebrow>Before anything else</Eyebrow>
                            <h2 className="mt-4 font-display text-[clamp(38px,5vw,60px)] leading-[1.02]">
                                Play with the numbers.
                                <br />
                                <em className="text-gradient">
                                    See your options light up.
                                </em>
                            </h2>
                        </Reveal>
                        <Reveal delay={120}>
                            <MatchPreview ctaHref={primaryHref} />
                        </Reveal>
                    </div>
                </section>

                <section
                    id="how"
                    className="relative scroll-mt-20 bg-[#EFE7DA] px-5 py-24 sm:px-8 lg:py-32"
                >
                    <Topography
                        className="absolute top-0 right-0 w-[700px] text-[#13233D]/30"
                        rings={12}
                        seed={3}
                    />
                    <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.85fr_1.4fr]">
                        <div className="lg:sticky lg:top-32 lg:self-start">
                            <Reveal>
                                <Eyebrow>How it works</Eyebrow>
                                <h2 className="mt-4 font-display text-[clamp(38px,5vw,60px)] leading-[1.02]">
                                    About fifteen minutes,
                                    <br />
                                    <em className="text-gradient">
                                        start to shortlist.
                                    </em>
                                </h2>
                                <p className="mt-6 max-w-sm text-lg leading-relaxed text-[#13233D]/70">
                                    One thing per screen. Stop whenever you like
                                    and pick up on any device.
                                </p>
                                <div className="mt-10 flex items-center gap-4">
                                    <div className="flex -space-x-3">
                                        {BROKERS.map((look, i) => (
                                            <Bust
                                                key={i}
                                                look={look}
                                                background={
                                                    [
                                                        '#FFE1D6',
                                                        '#E3F0E6',
                                                        '#DCE7FF',
                                                        '#ECE8FF',
                                                    ][i]
                                                }
                                                className="size-12 rounded-full ring-4 ring-[#EFE7DA]"
                                            />
                                        ))}
                                    </div>
                                    <p className="text-sm leading-snug text-[#13233D]/70">
                                        Licensed local brokers
                                        <br />
                                        finish what MEGA starts.
                                    </p>
                                </div>
                            </Reveal>
                        </div>
                        <JourneyTimeline />
                    </div>
                </section>

                <section
                    id="engine"
                    className="relative overflow-hidden bg-[#0B1628] px-5 py-24 text-white sm:px-8 lg:py-32"
                >
                    <Topography
                        className="absolute -bottom-40 -left-40 w-[900px] text-[#6FB1FF]/40"
                        rings={16}
                        seed={7}
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_75%_40%,rgba(47,107,255,0.25),transparent)]" />
                    <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
                        <Reveal>
                            <Eyebrow className="text-[#9CC2FF]">
                                The MEGA engine
                            </Eyebrow>
                            <h2 className="mt-4 font-display text-[clamp(38px,5vw,62px)] leading-[1.02]">
                                AI that shows its work.
                                <br />
                                <em className="text-white/60">
                                    People who stand behind it.
                                </em>
                            </h2>
                            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">
                                Language models read and explain. Plain,
                                testable code decides what fits, so every match
                                traces back to a clause you can read.
                            </p>
                            <ul className="mt-10 grid gap-6 sm:grid-cols-2">
                                {ENGINE_POINTS.map((point) => (
                                    <li key={point.title}>
                                        <span className="grid size-11 place-items-center rounded-2xl bg-white/[0.07] ring-1 ring-white/10">
                                            <point.icon className="size-5 text-[#9CC2FF]" />
                                        </span>
                                        <p className="mt-4 font-medium">
                                            {point.title}
                                        </p>
                                        <p className="mt-1 text-sm leading-relaxed text-white/55">
                                            {point.body}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </Reveal>
                        <Reveal delay={150}>
                            <EngineDemo />
                        </Reveal>
                    </div>
                </section>

                <section id="loans" className="px-5 py-24 sm:px-8 lg:py-32">
                    <div className="mx-auto max-w-7xl">
                        <Reveal className="flex flex-wrap items-end justify-between gap-6">
                            <div>
                                <Eyebrow>Loan types</Eyebrow>
                                <h2 className="mt-4 font-display text-[clamp(38px,5vw,60px)] leading-[1.02]">
                                    Whatever you’re{' '}
                                    <em className="text-gradient">building.</em>
                                </h2>
                            </div>
                            <p className="max-w-sm text-lg text-[#13233D]/65">
                                Each loan type brings its own questions and
                                lender rules. The experience stays the same.
                            </p>
                        </Reveal>
                        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {LOAN_TYPES.map((type, i) => (
                                <Reveal key={type.title} delay={i * 90}>
                                    <LoanCard {...type} href={primaryHref} />
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-[#EFE7DA] px-5 py-24 sm:px-8 lg:py-32">
                    <div className="mx-auto max-w-7xl">
                        <Reveal className="mb-14 max-w-2xl">
                            <Eyebrow>Real situations</Eyebrow>
                            <h2 className="mt-4 font-display text-[clamp(38px,5vw,60px)] leading-[1.02]">
                                Life isn’t a template.
                                <br />
                                <em className="text-gradient">
                                    Your matches shouldn’t be either.
                                </em>
                            </h2>
                        </Reveal>
                        <Reveal delay={100}>
                            <Stories />
                        </Reveal>
                    </div>
                </section>

                <PromiseSection />

                <section id="faq" className="px-5 py-24 sm:px-8 lg:py-32">
                    <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.6fr]">
                        <Reveal>
                            <Eyebrow>Questions</Eyebrow>
                            <h2 className="mt-4 font-display text-5xl leading-[1.05]">
                                Good questions{' '}
                                <em className="text-gradient">to ask.</em>
                            </h2>
                            <p className="mt-5 max-w-xs text-[#13233D]/65">
                                Anything else? The MEGA advisor answers in plain
                                English, any time during your application.
                            </p>
                        </Reveal>
                        <Reveal delay={100}>
                            <Faq />
                        </Reveal>
                    </div>
                </section>

                <ClosingCta primaryHref={primaryHref} />
                <SiteFooter />
            </div>
        </>
    );
}

function Eyebrow({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <p
            className={cn(
                'inline-flex items-center gap-2 text-xs font-semibold tracking-[0.22em] text-[#2F6BFF] uppercase',
                className,
            )}
        >
            <span className="h-px w-6 bg-current" />
            {children}
        </p>
    );
}

function SiteNav({ signedIn }: { signedIn: boolean }) {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const links = [
        ['Why AI', '#ai'],
        ['How it works', '#how'],
        ['The engine', '#engine'],
        ['Loan types', '#loans'],
        ['FAQ', '#faq'],
    ];

    return (
        <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
            <nav
                className={cn(
                    'mx-auto flex h-16 max-w-7xl items-center justify-between rounded-full px-4 transition-all duration-500 sm:px-6',
                    scrolled
                        ? 'bg-white/80 shadow-[0_10px_40px_-15px_rgba(19,35,61,0.35)] ring-1 ring-[#13233D]/5 backdrop-blur-xl'
                        : 'bg-transparent',
                )}
            >
                <Link
                    href="/"
                    aria-label="MEGA home"
                    className="text-[#13233D]"
                >
                    <MegaLogo />
                </Link>
                <div className="hidden items-center gap-1 md:flex">
                    {links.map(([label, href]) => (
                        <a
                            key={href}
                            href={href}
                            className="rounded-full px-4 py-2 text-sm text-[#13233D]/70 transition hover:bg-[#13233D]/5 hover:text-[#13233D]"
                        >
                            {label}
                        </a>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    {signedIn ? (
                        <Link
                            href={dashboard()}
                            className="inline-flex h-10 items-center rounded-full bg-[#13233D] px-5 text-sm font-medium text-white transition hover:bg-[#2F6BFF]"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                href={login()}
                                className="hidden h-10 items-center rounded-full px-4 text-sm font-medium sm:inline-flex"
                            >
                                Log in
                            </Link>
                            <Link
                                href={register()}
                                className="inline-flex h-10 items-center rounded-full bg-[#13233D] px-5 text-sm font-medium text-white transition hover:bg-[#2F6BFF]"
                            >
                                Get started
                            </Link>
                        </>
                    )}
                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        className="grid size-10 place-items-center rounded-full md:hidden"
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        aria-expanded={open}
                    >
                        {open ? (
                            <X className="size-5" />
                        ) : (
                            <Menu className="size-5" />
                        )}
                    </button>
                </div>
            </nav>
            {open && (
                <div className="mx-auto mt-2 max-w-7xl animate-rise rounded-3xl bg-white p-4 shadow-xl md:hidden">
                    {links.map(([label, href]) => (
                        <a
                            key={href}
                            href={href}
                            onClick={() => setOpen(false)}
                            className="block rounded-2xl px-4 py-3 text-lg"
                        >
                            {label}
                        </a>
                    ))}
                    {!signedIn && (
                        <Link
                            href={login()}
                            className="block rounded-2xl px-4 py-3 text-lg text-[#2F6BFF]"
                        >
                            Log in
                        </Link>
                    )}
                </div>
            )}
        </header>
    );
}

function Hero({ primaryHref }: { primaryHref: Href }) {
    const stageRef = useRef<HTMLDivElement>(null);

    const onMove = (event: ReactMouseEvent<HTMLDivElement>) => {
        const stage = stageRef.current;

        if (!stage) {
            return;
        }

        const rect = stage.getBoundingClientRect();
        stage.style.setProperty(
            '--px',
            ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3),
        );
        stage.style.setProperty(
            '--py',
            ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3),
        );
    };

    const layer = (depth: number) => ({
        transform: `translate(calc(var(--px, 0) * ${depth}px), calc(var(--py, 0) * ${depth}px))`,
    });

    return (
        <section className="relative overflow-hidden px-5 pt-32 pb-20 sm:px-8 lg:pt-40 lg:pb-28">
            <Topography
                className="absolute -top-24 -left-48 w-[820px] text-[#13233D]/25"
                rings={15}
                seed={1}
            />
            <DotGrid className="absolute right-0 bottom-0 h-72 w-1/2 [mask-image:linear-gradient(to_top_left,#000,transparent_70%)] text-[#13233D]/10" />
            <div className="aurora pointer-events-none absolute top-10 right-[10%] size-[480px] rounded-full bg-[#2F6BFF]/20 blur-[110px]" />
            <div className="aurora pointer-events-none absolute right-[35%] bottom-0 size-[360px] rounded-full bg-[#FF7A59]/20 blur-[100px] [animation-delay:-6s]" />
            <div className="aurora pointer-events-none absolute top-1/3 -left-20 size-[320px] rounded-full bg-[#7B6CE0]/15 blur-[100px] [animation-delay:-12s]" />

            <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
                <div>
                    <div className="inline-flex animate-rise items-center gap-2 rounded-full border border-[#13233D]/10 bg-white/70 py-1.5 pr-4 pl-1.5 text-sm backdrop-blur">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#2F6BFF] px-2.5 py-0.5 text-xs font-medium text-white">
                            <Sparkles className="size-3" /> New
                        </span>
                        AI lender matching, built for Australians
                    </div>
                    <RiseHeadline
                        as="h1"
                        delay={120}
                        className="mt-7 font-display text-[clamp(46px,6.8vw,88px)] leading-[0.98] font-extrabold"
                        lines={[
                            ['The', 'right', 'lender'],
                            ['is', 'out', 'there.'],
                            [
                                { text: 'Let’s', className: 'text-gradient' },
                                { text: 'meet', className: 'text-gradient' },
                                { text: 'them.', className: 'text-gradient' },
                            ],
                        ]}
                    />
                    <Squiggle className="draw-in mt-1 h-4 w-[min(400px,72%)] text-[#FF7A59]" />
                    <p className="mt-8 max-w-xl animate-rise text-lg leading-relaxed text-[#13233D]/70 [animation-delay:160ms] sm:text-xl">
                        MEGA reads your situation, checks it against the real
                        policies of 90+ lenders and shows you the three that
                        fit, with the reasons. Then a friendly local broker
                        takes it from there.
                    </p>
                    <div className="mt-10 flex animate-rise flex-wrap items-center gap-4 [animation-delay:240ms]">
                        <Link
                            href={primaryHref}
                            className="group relative inline-flex h-14 items-center gap-3 overflow-hidden rounded-full bg-[#2F6BFF] px-8 text-base font-medium text-white shadow-[0_18px_40px_-14px_rgba(47,107,255,0.9)] transition hover:-translate-y-0.5"
                        >
                            <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.35),transparent)] transition duration-700 group-hover:translate-x-full" />
                            Find my matches
                            <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                        </Link>
                        <a
                            href="#how"
                            className="inline-flex h-14 items-center gap-2 rounded-full border border-[#13233D]/15 px-6 font-medium transition hover:border-[#13233D]/40 hover:bg-white/60"
                        >
                            See how it works
                        </a>
                    </div>
                    <ul className="mt-12 flex animate-rise flex-wrap gap-x-8 gap-y-3 text-sm text-[#13233D]/70 [animation-delay:320ms]">
                        {[
                            'Soft check, no score impact',
                            'Free to see your matches',
                            'A licensed broker reviews every match',
                        ].map((item) => (
                            <li key={item} className="flex items-center gap-2">
                                <span className="grid size-5 place-items-center rounded-full bg-[#8DB89A]/30 text-[#2E6B47]">
                                    <Check className="size-3" strokeWidth={3} />
                                </span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div
                    ref={stageRef}
                    onMouseMove={onMove}
                    className="relative mx-auto w-full max-w-[600px] animate-rise [animation-delay:200ms]"
                >
                    <div
                        style={layer(-14)}
                        className="transition-transform duration-300 ease-out"
                    >
                        <HomeScene className="w-full drop-shadow-[0_30px_40px_rgba(19,35,61,0.12)]" />
                    </div>

                    <FloatCard
                        style={layer(36)}
                        className="-top-2 left-0 sm:-left-6"
                        delay="0.6s"
                        beam
                    >
                        <AiTicker />
                    </FloatCard>

                    <FloatCard
                        style={layer(30)}
                        className="top-[18%] right-0 sm:-right-4"
                        delay="0s"
                    >
                        <p className="text-[11px] font-medium text-[#13233D]/55">
                            Your top 3 matches
                        </p>
                        <div className="mt-2 space-y-1.5">
                            {[
                                ['Jarrah Bank', '#FFB547', '5.76%'],
                                ['Coolabah Bank', '#FACC15', '5.81%'],
                                ['Mulga CU', '#60A5FA', '5.92%'],
                            ].map(([name, color, rateValue], i) => (
                                <div
                                    key={name}
                                    className={cn(
                                        'flex items-center justify-between gap-6 rounded-lg px-2 py-1.5',
                                        i === 0 && 'bg-[#2F6BFF]/10',
                                    )}
                                >
                                    <LenderMark
                                        name={name}
                                        color={color}
                                        size="sm"
                                        className="text-xs text-[#13233D]"
                                    />
                                    <span className="font-mono text-xs">
                                        {rateValue}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </FloatCard>

                    <FloatCard
                        style={layer(40)}
                        className="bottom-[26%] -left-2 sm:-left-8"
                        delay="1.2s"
                    >
                        <div className="flex items-center gap-3">
                            <span className="grid size-9 place-items-center rounded-full bg-[#8DB89A]/30 text-[#2E6B47]">
                                <BadgeCheck className="size-5" />
                            </span>
                            <div>
                                <p className="font-mono text-sm font-medium">
                                    LVR 80%
                                </p>
                                <p className="text-[11px] text-[#13233D]/55">
                                    Within policy for 61 lenders
                                </p>
                            </div>
                        </div>
                    </FloatCard>

                    <FloatCard
                        style={layer(26)}
                        className="right-6 -bottom-6"
                        delay="2.1s"
                    >
                        <div className="flex items-center gap-3">
                            <Bust
                                look={BROKERS[0]}
                                background="#FFE1D6"
                                className="size-10"
                            />
                            <div>
                                <p className="text-sm font-medium">
                                    Priya, your broker
                                </p>
                                <p className="flex items-center gap-1.5 text-[11px] text-[#13233D]/55">
                                    <span className="size-1.5 animate-pulse rounded-full bg-[#2FD08A]" />{' '}
                                    Usually replies in 20 min
                                </p>
                            </div>
                        </div>
                    </FloatCard>
                </div>
            </div>
        </section>
    );
}

function FloatCard({
    children,
    className,
    style,
    delay,
    beam = false,
}: {
    children: ReactNode;
    className?: string;
    style: CSSProperties;
    delay: string;
    beam?: boolean;
}) {
    return (
        <div
            style={style}
            className={cn(
                'absolute z-10 transition-transform duration-300 ease-out',
                className,
            )}
        >
            <div
                className={cn(
                    'animate-float rounded-2xl border border-white bg-white/90 p-3.5 shadow-[0_24px_60px_-20px_rgba(19,35,61,0.45)] backdrop-blur',
                    beam && 'beam',
                )}
                style={{ animationDelay: delay }}
            >
                {children}
            </div>
        </div>
    );
}

function WhyAi() {
    return (
        <section
            id="ai"
            className="relative scroll-mt-20 overflow-hidden px-5 py-24 sm:px-8 lg:py-32"
        >
            <div className="aurora pointer-events-none absolute -top-20 left-1/4 size-[520px] rounded-full bg-[#7B6CE0]/12 blur-[120px]" />
            <div className="relative mx-auto max-w-7xl">
                <div className="grid items-end gap-8 lg:grid-cols-[1.15fr_1fr]">
                    <div>
                        <Reveal>
                            <Eyebrow>Why AI matters here</Eyebrow>
                        </Reveal>
                        <RiseHeadline
                            whenVisible
                            className="mt-4 font-display text-[clamp(40px,5.6vw,74px)] leading-[1]"
                            lines={[
                                ['Lending', 'runs', 'on'],
                                ['thousands', 'of', 'rules.'],
                                [
                                    { text: 'AI', className: 'text-gradient' },
                                    {
                                        text: 'reads',
                                        className: 'text-gradient',
                                    },
                                    {
                                        text: 'them',
                                        className: 'text-gradient',
                                    },
                                    {
                                        text: 'all.',
                                        className: 'text-gradient',
                                    },
                                ],
                            ]}
                        />
                    </div>
                    <Reveal delay={150}>
                        <p className="text-lg leading-relaxed text-[#13233D]/70">
                            Every lender writes its own policy: LVR limits,
                            income rules, credit floors, exceptions. A person
                            can realistically compare a handful. MEGA checks all
                            of them, every time, and shows its working, so your
                            broker spends their time on you instead of on
                            paperwork.
                        </p>
                    </Reveal>
                </div>

                <div className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                    <Reveal>
                        <AiLiveFeed className="h-full" />
                    </Reveal>
                    <div className="grid gap-6">
                        <Reveal delay={120}>
                            <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(145deg,#13233D,#1B2F55)] p-6 text-white">
                                <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.18em] text-white/50 uppercase">
                                    <span>Your details</span>
                                    <span>92 policies</span>
                                    <span className="text-[#9CC2FF]">
                                        Top 3
                                    </span>
                                </div>
                                <NeuralNet className="mt-2 h-56 w-full" />
                            </div>
                        </Reveal>
                        <Reveal delay={200}>
                            <ThenVsNow />
                        </Reveal>
                    </div>
                </div>

                <Reveal delay={100} className="mt-6">
                    <AiCapabilities />
                </Reveal>
            </div>
        </section>
    );
}

function PanelStrip() {
    return (
        <section className="border-y border-[#13233D]/10 bg-white/50 py-7">
            <div className="mx-auto flex max-w-7xl items-center gap-10 px-5 sm:px-8">
                <p className="hidden shrink-0 text-sm leading-tight text-[#13233D]/55 md:block">
                    Checking policies
                    <br />
                    across <span className="font-mono text-[#13233D]">
                        92
                    </span>{' '}
                    lenders
                </p>
                <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
                    <div className="flex w-max animate-marquee gap-12 pr-12 hover:[animation-play-state:paused]">
                        {[...PANEL, ...PANEL].map(([name, color], i) => (
                            <LenderMark
                                key={i}
                                name={name}
                                color={color}
                                size="sm"
                                className="text-[#13233D]/75"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function LoanCard({
    icon: Icon,
    title,
    body,
    checks,
    tint,
    href,
}: (typeof LOAN_TYPES)[number] & { href: Href }) {
    const tilt = useTilt<HTMLAnchorElement>(7);

    return (
        <Link
            href={href}
            ref={tilt.ref}
            onMouseMove={tilt.onMouseMove}
            onMouseLeave={tilt.onMouseLeave}
            className="group relative block h-full overflow-hidden rounded-[28px] border border-[#13233D]/10 bg-white p-7 transition-[transform,box-shadow] duration-300 ease-out hover:shadow-[0_40px_80px_-40px_rgba(19,35,61,0.45)]"
        >
            <span
                className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: `radial-gradient(260px circle at var(--glow-x, 50%) var(--glow-y, 50%), ${tint}, transparent 70%)`,
                }}
            />
            <div className="relative">
                <Icon />
                <h3 className="mt-6 text-2xl font-semibold">{title}</h3>
                <p className="mt-2 text-[#13233D]/65">{body}</p>
                <ul className="mt-6 space-y-2 border-t border-[#13233D]/10 pt-5 text-sm text-[#13233D]/70">
                    {checks.map((check) => (
                        <li key={check} className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-[#2F6BFF]" />
                            {check}
                        </li>
                    ))}
                </ul>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#2F6BFF]">
                    Start here{' '}
                    <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
            </div>
        </Link>
    );
}

function Stat({
    value,
    suffix = '',
    prefix = '',
    label,
}: {
    value: number;
    suffix?: string;
    prefix?: string;
    label: string;
}) {
    const { ref, inView } = useInView<HTMLDivElement>(0.4);
    const count = useCountUp(value, inView);

    return (
        <div ref={ref} className="border-t border-white/15 pt-6">
            <p className="font-display text-6xl">
                {prefix}
                {count}
                {suffix}
            </p>
            <p className="mt-2 text-sm text-white/60">{label}</p>
        </div>
    );
}

function PromiseSection() {
    const promises = [
        'Approve or decline you. Lenders decide; a licensed broker advises.',
        'Show a match without the policy clause it relied on.',
        'Train public AI models on your personal information.',
        'Sell your details or spam you. Marketing is opt-in, always.',
    ];

    return (
        <section className="px-3 sm:px-5">
            <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[40px] bg-[#13233D] px-5 py-20 text-white sm:px-12 lg:py-28">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_22px,rgba(255,255,255,0.025)_22px_23px)]" />
                <div className="absolute -top-32 -right-32 size-96 rounded-full bg-[#2F6BFF]/30 blur-3xl" />
                <div className="relative mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1fr_1.2fr]">
                    <Reveal>
                        <Eyebrow className="text-[#9CC2FF]">
                            Our promise
                        </Eyebrow>
                        <h2 className="mt-4 font-display text-[clamp(40px,5vw,64px)] leading-[1.02]">
                            Four things MEGA
                            <br />
                            will <em className="text-[#FF9C80]">never</em> do.
                        </h2>
                        <p className="mt-6 max-w-sm text-white/60">
                            Every result is labelled indicative, not an offer.
                            Every recommendation has a human name on it.
                        </p>
                        <div className="mt-10 flex items-center gap-3 text-sm text-white/70">
                            <ShieldCheck className="size-5 text-[#8DB89A]" />
                            Your data stays in Australia, encrypted, and yours
                            to export or delete.
                        </div>
                    </Reveal>
                    <ol className="space-y-3">
                        {promises.map((line, i) => (
                            <Reveal key={line} delay={i * 90}>
                                <li className="group flex items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/25 hover:bg-white/[0.07]">
                                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#FF7A59]/15 text-[#FF9C80] transition group-hover:rotate-90">
                                        <X className="size-4" />
                                    </span>
                                    <p className="text-lg">{line}</p>
                                </li>
                            </Reveal>
                        ))}
                    </ol>
                </div>
                <div className="relative mx-auto mt-20 grid max-w-6xl grid-cols-2 gap-8 lg:grid-cols-4">
                    <Stat value={92} label="Lender policies on the panel" />
                    <Stat value={4} label="Loan types at launch" />
                    <Stat
                        value={3}
                        prefix="≤"
                        label="Questions shown at a time"
                    />
                    <Stat value={0} label="Impact on your credit score" />
                </div>
            </div>
        </section>
    );
}

function ClosingCta({ primaryHref }: { primaryHref: Href }) {
    return (
        <section className="px-3 pb-3 sm:px-5 sm:pb-5">
            <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[40px] bg-[#2F6BFF] px-6 py-16 text-white sm:px-14 lg:py-20">
                <Topography
                    className="absolute -top-40 -right-20 w-[800px] text-white/40"
                    rings={14}
                    seed={5}
                />
                <div className="relative grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
                    <div>
                        <h2 className="font-display text-[clamp(42px,6vw,80px)] leading-[0.98]">
                            Your next home starts
                            <br />
                            with{' '}
                            <em className="text-white/75">
                                a better question.
                            </em>
                        </h2>
                        <p className="mt-6 max-w-lg text-lg text-white/80">
                            See the lenders that fit you in minutes, not weeks.
                            Free, private, and no impact on your credit score.
                        </p>
                        <div className="mt-10 flex flex-wrap gap-4">
                            <Link
                                href={primaryHref}
                                className="group inline-flex h-14 items-center gap-3 rounded-full bg-white px-8 font-medium text-[#13233D] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-14px_rgba(0,0,0,0.5)]"
                            >
                                Find my matches
                                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                            </Link>
                            <a
                                href="#faq"
                                className="inline-flex h-14 items-center rounded-full border border-white/40 px-7 font-medium transition hover:bg-white/10"
                            >
                                Read the FAQ
                            </a>
                        </div>
                    </div>
                    <svg
                        viewBox="0 0 320 300"
                        className="mx-auto w-full max-w-[340px]"
                        role="img"
                        aria-label="A broker waving hello"
                    >
                        <circle
                            cx="160"
                            cy="160"
                            r="130"
                            fill="#FFFFFF"
                            fillOpacity="0.14"
                        />
                        <circle
                            cx="160"
                            cy="160"
                            r="96"
                            fill="#FFFFFF"
                            fillOpacity="0.12"
                        />
                        <g transform="translate(232 70)">
                            <rect
                                x="-46"
                                y="-28"
                                width="92"
                                height="44"
                                rx="16"
                                fill="#FFFFFF"
                            />
                            <path d="M-10 16 L-2 28 L4 16 Z" fill="#FFFFFF" />
                            <text
                                x="0"
                                y="0"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontFamily="Bricolage Grotesque, sans-serif"
                                fontWeight="700"
                                fontSize="22"
                                fill={INK}
                            >
                                G’day!
                            </text>
                        </g>
                        <Person
                            x={150}
                            y={290}
                            scale={1.05}
                            look={{ ...BROKERS[0], pose: 'wave' }}
                        />
                    </svg>
                </div>
            </div>
        </section>
    );
}

function SiteFooter() {
    const columns = [
        ['Product', ['How it works', 'The engine', 'Loan types', 'FAQ']],
        ['Company', ['About', 'Brokers', 'Careers', 'Contact']],
        ['Legal', ['Privacy policy', 'Credit guide', 'Terms', 'Complaints']],
    ] as const;

    return (
        <footer className="px-5 pt-20 pb-10 sm:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
                    <div>
                        <MegaWordmark className="h-6 text-[#13233D]" />
                        <p className="mt-5 max-w-xs font-display text-xl text-[#13233D]/70">
                            Smarter matches. Brighter futures.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                        {columns.map(([title, items]) => (
                            <div key={title}>
                                <p className="text-sm font-semibold">{title}</p>
                                <ul className="mt-4 space-y-2.5 text-sm text-[#13233D]/60">
                                    {items.map((item) => (
                                        <li key={item}>
                                            <a
                                                href="#"
                                                className="transition hover:text-[#2F6BFF]"
                                            >
                                                {item}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-16 flex flex-wrap justify-between gap-4 border-t border-[#13233D]/10 pt-6 text-xs text-[#13233D]/50">
                    <p>
                        © {new Date().getFullYear()} MEGA. Results are
                        indicative and not an offer of credit.
                    </p>
                    <p>Lenders shown on this page are fictional examples.</p>
                </div>
            </div>
        </footer>
    );
}
