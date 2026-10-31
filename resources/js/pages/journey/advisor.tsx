import { Form, Head, router, useForm } from '@inertiajs/react';
import { ArrowRight, Check, Info, Mic, SendHorizontal, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { MegaOrb } from '@/components/mega/orb';
import { StepContainer, StepHeading } from '@/components/mega/journey';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import journey from '@/routes/journey';
import type { JourneySummary } from '@/types/mega';

type Props = {
    application: JourneySummary;
    messages: { id: number; role: 'user' | 'assistant'; body: string }[];
    notes: {
        id: number;
        field: string | null;
        value: string | null;
        fact: string;
        confirmed: boolean;
    }[];
};

const STARTERS = [
    'I have two kids and earn $120k a year',
    'We spend about $3,500 a month',
    'The property is worth $850k',
    'Will this affect my credit score?',
];

export default function Advisor({ application, messages, notes }: Props) {
    const form = useForm({ body: '' });
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages.length]);

    function send(event?: FormEvent, text?: string) {
        event?.preventDefault();
        const body = text ?? form.data.body;

        if (!body.trim()) {
            return;
        }

        form.transform(() => ({ body }));
        form.post(journey.advisor.message.url(application.id), {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    }

    function decide(noteId: number, action: 'confirm' | 'dismiss') {
        router.patch(
            journey.advisor.notes.update.url({
                application: application.id,
                note: noteId,
            }),
            { action },
            { preserveScroll: true },
        );
    }

    const pending = notes.filter((note) => !note.confirmed);
    const confirmed = notes.filter((note) => note.confirmed);

    return (
        <>
            <Head title="Your situation" />
            <StepContainer wide>
                <StepHeading
                    eyebrow="Your situation"
                    title="Tell MEGA in your own words"
                    description="Your goals, who depends on you, job changes, anything that worries you. The advisor turns it into notes you confirm."
                />

                <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    <section className="flex min-h-[520px] flex-col rounded-2xl border border-border bg-card/60">
                        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
                            <MegaOrb className="w-7" />
                            <div>
                                <p className="text-sm font-medium">
                                    MEGA advisor
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    AI assistant · cannot approve loans or give
                                    personal credit advice
                                </p>
                            </div>
                        </div>

                        <div
                            className="flex-1 space-y-4 overflow-y-auto px-5 py-5"
                            aria-live="polite"
                        >
                            {messages.length === 0 && (
                                <p className="max-w-md rounded-2xl rounded-tl-sm bg-accent px-4 py-3 text-sm leading-relaxed">
                                    Hi, I am the MEGA advisor. I am an AI
                                    assistant: I can explain each step and note
                                    down your situation, but a licensed broker
                                    reviews every recommendation. What are you
                                    hoping to do?
                                </p>
                            )}
                            {messages.map((message) => (
                                <p
                                    key={message.id}
                                    className={cn(
                                        'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line',
                                        message.role === 'user'
                                            ? 'ml-auto rounded-tr-sm bg-mega text-white'
                                            : 'rounded-tl-sm bg-accent',
                                    )}
                                >
                                    {message.body}
                                </p>
                            ))}
                            {form.processing && (
                                <p className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm text-muted-foreground">
                                    <Spinner className="size-3.5" /> Thinking…
                                </p>
                            )}
                            <div ref={endRef} />
                        </div>

                        {messages.length === 0 && (
                            <div className="flex flex-wrap gap-2 px-5 pb-3">
                                {STARTERS.map((starter) => (
                                    <button
                                        key={starter}
                                        type="button"
                                        onClick={() => send(undefined, starter)}
                                        className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-mega/50 hover:text-foreground"
                                    >
                                        {starter}
                                    </button>
                                ))}
                            </div>
                        )}

                        <form
                            onSubmit={send}
                            className="flex items-center gap-2 border-t border-border p-3"
                        >
                            <button
                                type="button"
                                disabled
                                title="Voice is coming soon"
                                className="grid size-10 place-items-center rounded-full text-muted-foreground/50"
                            >
                                <Mic className="size-4" />
                                <span className="sr-only">
                                    Voice (coming soon)
                                </span>
                            </button>
                            <label htmlFor="advisor-input" className="sr-only">
                                Message the advisor
                            </label>
                            <input
                                id="advisor-input"
                                value={form.data.body}
                                onChange={(e) =>
                                    form.setData('body', e.target.value)
                                }
                                placeholder="Type your situation…"
                                maxLength={1000}
                                className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="size-10 rounded-full"
                                disabled={
                                    form.processing || !form.data.body.trim()
                                }
                            >
                                <SendHorizontal className="size-4" />
                                <span className="sr-only">Send</span>
                            </Button>
                        </form>
                    </section>

                    <aside className="space-y-4">
                        <div className="rounded-2xl border border-border p-5">
                            <p className="eyebrow text-muted-foreground">
                                Notes to confirm
                            </p>
                            {pending.length === 0 ? (
                                <p className="mt-3 text-sm text-muted-foreground">
                                    Notes appear here as you talk. Nothing is
                                    used until you confirm it.
                                </p>
                            ) : (
                                <ul className="mt-3 space-y-2">
                                    {pending.map((note) => (
                                        <li
                                            key={note.id}
                                            className="flex items-center gap-2 rounded-xl border border-mega/30 bg-mega/[0.06] p-3 text-sm"
                                        >
                                            <span className="flex-1">
                                                {note.fact}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    decide(note.id, 'confirm')
                                                }
                                                className="grid size-8 place-items-center rounded-full bg-ok/15 text-ok hover:bg-ok/25"
                                                aria-label={`Confirm: ${note.fact}`}
                                            >
                                                <Check className="size-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    decide(note.id, 'dismiss')
                                                }
                                                className="grid size-8 place-items-center rounded-full bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
                                                aria-label={`Dismiss: ${note.fact}`}
                                            >
                                                <X className="size-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {confirmed.length > 0 && (
                            <div className="rounded-2xl border border-border p-5">
                                <p className="eyebrow text-muted-foreground">
                                    Confirmed
                                </p>
                                <ul className="mt-3 space-y-2 text-sm">
                                    {confirmed.map((note) => (
                                        <li
                                            key={note.id}
                                            className="flex gap-2"
                                        >
                                            <Check className="mt-0.5 size-4 shrink-0 text-ok" />
                                            {note.fact}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <p className="flex gap-2 px-1 text-xs text-muted-foreground">
                            <Info className="size-4 shrink-0" />
                            Messages are only shared with your broker if you
                            allowed transcripts in your consents.
                        </p>

                        <Form
                            {...journey.advisor.continue.form(application.id)}
                        >
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="h-12 w-full rounded-full shadow-[0_8px_30px_-8px_var(--mega-accent)]"
                                    disabled={processing}
                                >
                                    {processing && <Spinner />}
                                    Start my MEGA assessment
                                    <ArrowRight className="size-4" />
                                </Button>
                            )}
                        </Form>
                    </aside>
                </div>
            </StepContainer>
        </>
    );
}
