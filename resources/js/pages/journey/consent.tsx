import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { StepContainer, StepHeading } from '@/components/mega/journey';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import journey from '@/routes/journey';
import type { JourneySummary } from '@/types/mega';

type ConsentItem = {
    type: string;
    title: string;
    description: string;
    required: boolean;
    granted: boolean;
};

type Props = {
    application: JourneySummary;
    consents: ConsentItem[];
    textVersion: string;
    typicalLenders: number;
};

export default function Consent({
    application,
    consents,
    textVersion,
    typicalLenders,
}: Props) {
    const form = useForm<{ consents: Record<string, boolean> }>({
        consents: Object.fromEntries(
            consents.map((consent) => [consent.type, consent.granted]),
        ),
    });

    const requiredMissing = consents.some(
        (consent) => consent.required && !form.data.consents[consent.type],
    );

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(journey.consent.store.url(application.id));
    }

    return (
        <>
            <Head title="Your consent" />
            <StepContainer>
                <div className="mb-8 flex animate-rise items-center gap-3 rounded-xl border border-mega/30 bg-mega/10 px-4 py-3 text-sm">
                    <Sparkles className="size-4 shrink-0 text-mega-bright" />
                    <p>
                        <span className="num font-medium">
                            {typicalLenders}
                        </span>{' '}
                        lenders on our panel typically lend for a{' '}
                        {application.loanPackLabel.toLowerCase()} of{' '}
                        {money(application.amount)}.
                    </p>
                </div>

                <StepHeading
                    eyebrow="Before we start"
                    title="Your information, your say"
                    description="Plain language, one place. Required items let us assess your application; optional ones never block you."
                />

                <form onSubmit={submit} className="space-y-3">
                    {consents.map((consent) => {
                        const checked = form.data.consents[consent.type];

                        return (
                            <label
                                key={consent.type}
                                className={cn(
                                    'flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition',
                                    checked
                                        ? 'border-mega/50 bg-mega/[0.06]'
                                        : 'border-border hover:border-foreground/25',
                                )}
                            >
                                <span className="relative mt-0.5 inline-flex">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={checked}
                                        onChange={(e) =>
                                            form.setData('consents', {
                                                ...form.data.consents,
                                                [consent.type]:
                                                    e.target.checked,
                                            })
                                        }
                                    />
                                    <span className="h-6 w-10 rounded-full bg-border transition peer-checked:bg-mega peer-focus-visible:ring-2 peer-focus-visible:ring-ring" />
                                    <span className="absolute top-1 left-1 size-4 rounded-full bg-white transition peer-checked:translate-x-4" />
                                </span>
                                <span className="flex-1">
                                    <span className="flex flex-wrap items-center gap-2 font-medium">
                                        {consent.title}
                                        <span
                                            className={cn(
                                                'rounded-full px-2 py-0.5 text-[10px] tracking-wide uppercase',
                                                consent.required
                                                    ? 'bg-foreground/10 text-foreground/70'
                                                    : 'bg-ok/15 text-ok',
                                            )}
                                        >
                                            {consent.required
                                                ? 'Required'
                                                : 'Optional'}
                                        </span>
                                    </span>
                                    <span className="mt-1 block text-sm text-muted-foreground">
                                        {consent.description}
                                    </span>
                                    <InputError
                                        message={
                                            form.errors[
                                                `consents.${consent.type}` as keyof typeof form.errors
                                            ]
                                        }
                                        className="mt-2"
                                    />
                                </span>
                            </label>
                        );
                    })}

                    <p className="pt-2 text-xs text-muted-foreground">
                        Consent text version{' '}
                        <span className="num">{textVersion}</span>. We record
                        the time, IP address and device with your choices. You
                        can withdraw optional consents any time from your
                        privacy centre.
                    </p>

                    <Button
                        type="submit"
                        size="lg"
                        className="mt-6 h-12 w-full rounded-full text-[15px]"
                        disabled={form.processing || requiredMissing}
                    >
                        {form.processing && <Spinner />}
                        Agree and continue
                        <ArrowRight className="size-4" />
                    </Button>
                </form>
            </StepContainer>
        </>
    );
}
