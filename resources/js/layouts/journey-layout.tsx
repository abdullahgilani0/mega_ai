import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import { MegaAvatar } from '@/components/mega/avatar';
import { MegaLogo } from '@/components/mega/logo';
import { NotificationBell } from '@/components/mega/notification-bell';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import journey from '@/routes/journey';
import type { JourneySummary, StageKey } from '@/types/mega';

const STAGE_ROUTES: Partial<
    Record<StageKey, (application: string) => { url: string; method: 'get' }>
> = {
    consent: journey.consent,
    identity: journey.identity,
    documents: journey.documents,
    advisor: journey.advisor,
    assessment: journey.assessment,
    questions: journey.questions,
    reveal: journey.reveal,
    sign: journey.sign,
    finish: journey.finish,
};

export default function JourneyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useFlashToast();
    const { props, url } = usePage<{ application?: JourneySummary }>();
    const application = props.application;
    const [stepsOpen, setStepsOpen] = useState(false);

    const stages = application?.stages ?? [];
    const viewing =
        stages.find((stage) => url.includes(`/${routeSegment(stage.key)}`)) ??
        stages.find((stage) => stage.current);
    const position = viewing ? stages.indexOf(viewing) + 1 : 0;
    const progress = stages.length ? (position / stages.length) * 100 : 0;
    const advisorReached = stages.find((s) => s.key === 'advisor')?.reached;

    return (
        <div className="min-h-dvh bg-background">
            <div
                className="fixed inset-x-0 top-0 z-50 h-[3px] bg-border"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                aria-label="Application progress"
            >
                <div
                    className="h-full bg-mega shadow-[0_0_12px_var(--mega-accent-bright)] transition-[width] duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <header className="sticky top-[3px] z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
                    <Link href={dashboard()} aria-label="MEGA dashboard">
                        <MegaLogo />
                    </Link>

                    {application && viewing && (
                        <button
                            type="button"
                            onClick={() => setStepsOpen((open) => !open)}
                            className="flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                            aria-expanded={stepsOpen}
                        >
                            <span className="num">
                                {position}/{stages.length}
                            </span>
                            <span className="hidden text-foreground sm:inline">
                                {viewing.label}
                            </span>
                            <ChevronDown
                                className={cn(
                                    'size-3.5 transition',
                                    stepsOpen && 'rotate-180',
                                )}
                            />
                        </button>
                    )}

                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <Link
                            href={dashboard()}
                            className="hidden text-xs text-muted-foreground hover:text-foreground sm:block"
                        >
                            Save & exit
                        </Link>
                        <MegaAvatar
                            index={
                                (props.auth as { avatar?: number }).avatar ?? 0
                            }
                            className="size-9"
                        />
                    </div>
                </div>

                {stepsOpen && application && (
                    <nav className="border-t border-border/60 bg-background">
                        <ol className="mx-auto grid max-w-6xl gap-1 px-5 py-4 sm:grid-cols-3 lg:grid-cols-5">
                            {stages.map((stage, i) => {
                                const route = STAGE_ROUTES[stage.key];
                                const content = (
                                    <>
                                        <span className="num text-[10px] text-muted-foreground">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <span>{stage.label}</span>
                                    </>
                                );

                                return (
                                    <li key={stage.key}>
                                        {stage.reached && route ? (
                                            <Link
                                                href={route(application.id)}
                                                onClick={() =>
                                                    setStepsOpen(false)
                                                }
                                                className={cn(
                                                    'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent',
                                                    stage === viewing &&
                                                        'bg-accent text-mega-bright',
                                                )}
                                            >
                                                {content}
                                            </Link>
                                        ) : (
                                            <span className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground/60">
                                                {content}
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                        <button
                            type="button"
                            onClick={() => setStepsOpen(false)}
                            className="sr-only"
                        >
                            <X /> Close steps
                        </button>
                    </nav>
                )}
            </header>

            <main>{children}</main>

            {application &&
                advisorReached &&
                !url.includes('/advisor') &&
                !url.includes('/assessment') && (
                    <Link
                        href={journey.advisor(application.id)}
                        className="fixed right-5 bottom-5 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2.5 text-sm shadow-lg backdrop-blur transition hover:border-mega/50"
                    >
                        <MessageCircle className="size-4 text-mega-bright" />
                        Ask the advisor
                    </Link>
                )}
        </div>
    );
}

function routeSegment(key: StageKey): string {
    return key === 'reveal' ? 'matches' : key;
}
