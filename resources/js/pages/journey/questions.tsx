import { Form, Head, router } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    FileUp,
    HelpCircle,
    RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { StepContainer, StepHeading } from '@/components/mega/journey';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import journey from '@/routes/journey';
import type { JourneySummary } from '@/types/mega';

type Gap = {
    id: number;
    kind: string;
    field: string | null;
    prompt: string;
    input: 'money' | 'count' | 'months' | 'years' | 'document';
};

type Props = {
    application: JourneySummary;
    gaps: Gap[];
    remaining: number;
    resolved: number;
};

const SUFFIX = { months: 'months', years: 'years', count: 'people' } as const;

export default function Questions({
    application,
    gaps,
    remaining,
    resolved,
}: Props) {
    return (
        <>
            <Head title="A few questions" />
            <StepContainer>
                {gaps.length === 0 ? (
                    <div className="animate-rise text-center">
                        <CheckCircle2 className="mx-auto size-14 text-ok" />
                        <h1 className="mt-6 font-display text-5xl">
                            That is everything
                        </h1>
                        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                            MEGA re-checks only what changed. Your matches are
                            seconds away.
                        </p>
                        <Form
                            {...journey.assessment.store.form(application.id)}
                            className="mt-10"
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
                                        <RefreshCw className="size-4" />
                                    )}
                                    Re-run MEGA
                                </Button>
                            )}
                        </Form>
                    </div>
                ) : (
                    <>
                        <StepHeading
                            eyebrow={`Questions · ${resolved} answered, ${remaining} to go`}
                            title="Just a few things MEGA could not verify"
                            description="We only ask what your documents and bank data could not answer, and never more than three at a time."
                        />
                        <div className="space-y-4">
                            {gaps.map((gap, i) => (
                                <GapCard
                                    key={gap.id}
                                    gap={gap}
                                    applicationId={application.id}
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>
                    </>
                )}
            </StepContainer>
        </>
    );
}

function GapCard({
    gap,
    applicationId,
    autoFocus,
}: {
    gap: Gap;
    applicationId: string;
    autoFocus: boolean;
}) {
    const [value, setValue] = useState('');
    const action = journey.questions.resolve.form({
        application: applicationId,
        gap: gap.id,
    });

    return (
        <div className="animate-rise rounded-2xl border border-border bg-card/70 p-6">
            <p className="text-lg">{gap.prompt}</p>
            <Form
                {...action}
                options={{ preserveScroll: true }}
                className="mt-5"
            >
                {({ errors, processing }) => (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        {gap.input === 'document' ? (
                            <label className="flex h-12 flex-1 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border px-4 text-sm text-muted-foreground hover:border-mega/60">
                                <FileUp className="size-4 text-mega-bright" />
                                {value || 'Choose a file'}
                                <input
                                    type="file"
                                    name="file"
                                    accept="application/pdf,image/*"
                                    className="sr-only"
                                    onChange={(e) =>
                                        setValue(
                                            e.target.files?.[0]?.name ?? '',
                                        )
                                    }
                                />
                            </label>
                        ) : (
                            <div className="relative flex-1">
                                {gap.input === 'money' && (
                                    <span className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">
                                        $
                                    </span>
                                )}
                                <input
                                    name="value"
                                    inputMode="numeric"
                                    autoFocus={autoFocus}
                                    value={value}
                                    onChange={(e) =>
                                        setValue(
                                            e.target.value.replace(
                                                /[^\d.]/g,
                                                '',
                                            ),
                                        )
                                    }
                                    className="num h-12 w-full rounded-xl border border-input bg-transparent pr-20 pl-8 text-lg outline-none focus:border-mega"
                                    aria-label={gap.prompt}
                                />
                                {gap.input !== 'money' && (
                                    <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted-foreground">
                                        {SUFFIX[gap.input]}
                                    </span>
                                )}
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="h-12 rounded-xl px-6"
                            disabled={processing || value === ''}
                        >
                            {processing ? (
                                <Spinner />
                            ) : (
                                <ArrowRight className="size-4" />
                            )}
                            Save
                        </Button>
                        <InputError message={errors.value ?? errors.file} />
                    </div>
                )}
            </Form>
            <button
                type="button"
                onClick={() =>
                    router.post(
                        action.action,
                        { cannot_answer: true },
                        { preserveScroll: true },
                    )
                }
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
                <HelpCircle className="size-3.5" />
                I can't answer this, ask my broker
            </button>
        </div>
    );
}
