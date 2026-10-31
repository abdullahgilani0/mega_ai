import { Form, Head, Link, router } from '@inertiajs/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StepContainer } from '@/components/mega/journey';
import {
    MegaScene,
    SimpleAssessment,
    useMegaReplay,
} from '@/components/mega/mega-scene';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import journey from '@/routes/journey';
import type { JourneySummary, MegaEvent } from '@/types/mega';

type Props = {
    application: JourneySummary;
    run: { id: number; total: number; passed: number } | null;
    events: MegaEvent[];
    avatar: number;
    next: 'questions' | 'reveal' | null;
};

const SIMPLE_KEY = 'mega.simple-mode';

export default function Assessment({
    application,
    run,
    events,
    avatar,
    next,
}: Props) {
    const play =
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).has('play');
    const [simple, setSimple] = useState(false);
    const { sceneRef, summary } = useMegaReplay(events, play);

    useEffect(() => {
        try {
            const reduced = window.matchMedia(
                '(prefers-reduced-motion: reduce)',
            ).matches;
            setSimple(localStorage.getItem(SIMPLE_KEY) === '1' || reduced);
        } catch {
            setSimple(false);
        }
    }, []);

    const finished = run !== null && summary.next !== null;
    const destination =
        next === 'questions'
            ? journey.questions(application.id)
            : journey.reveal(application.id);

    useEffect(() => {
        if (!play || !finished) {
            return;
        }

        const timer = setTimeout(() => router.visit(destination), 2200);

        return () => clearTimeout(timer);
    }, [play, finished, destination]);

    function toggleSimple() {
        const value = !simple;
        setSimple(value);
        try {
            localStorage.setItem(SIMPLE_KEY, value ? '1' : '0');
        } catch {
            // Storage may be unavailable; the toggle still works for this visit.
        }
    }

    return (
        <>
            <Head title="MEGA assessment" />
            <StepContainer wide className="sm:py-10">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="eyebrow text-mega-bright">
                            MEGA assessment
                        </p>
                        <h1 className="mt-2 font-display text-4xl sm:text-5xl">
                            {finished
                                ? summary.next === 'questions'
                                    ? 'Almost there'
                                    : 'Lenders matched'
                                : 'Matching you with real lender policies'}
                        </h1>
                    </div>
                    <button
                        type="button"
                        onClick={toggleSimple}
                        className="rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                        aria-pressed={simple}
                    >
                        Simple mode {simple ? 'on' : 'off'}
                    </button>
                </div>

                <p className="sr-only" aria-live="polite">
                    {summary.status}
                </p>

                {simple ? (
                    <SimpleAssessment summary={summary} />
                ) : (
                    <MegaScene
                        sceneRef={sceneRef}
                        summary={summary}
                        avatarIndex={avatar}
                    />
                )}

                <div className="mt-8 flex flex-col items-center gap-4 text-center">
                    {run === null ? (
                        <>
                            <p className="max-w-lg text-muted-foreground">
                                MEGA will evaluate every lender on the panel
                                against your details, in code, and show its
                                progress live. It takes a few seconds.
                            </p>
                            <Form
                                {...journey.assessment.store.form(
                                    application.id,
                                )}
                            >
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="h-12 rounded-full px-8 shadow-[0_8px_30px_-8px_var(--mega-accent)]"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <Spinner />
                                        ) : (
                                            <Sparkles className="size-4" />
                                        )}
                                        Start assessment
                                    </Button>
                                )}
                            </Form>
                        </>
                    ) : finished ? (
                        <Button
                            asChild
                            size="lg"
                            className="h-12 rounded-full px-8"
                        >
                            <Link href={destination}>
                                {summary.next === 'questions'
                                    ? 'Answer a few questions'
                                    : 'See my matches'}
                                <ArrowRight className="size-4" />
                            </Link>
                        </Button>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Every movement above is a real step from the engine.
                        </p>
                    )}
                </div>
            </StepContainer>
        </>
    );
}
