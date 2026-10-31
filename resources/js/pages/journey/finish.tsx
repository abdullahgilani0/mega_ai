import { Form, Head } from '@inertiajs/react';
import { ArrowRight, BadgeCheck, FileText, MapPin } from 'lucide-react';
import InputError from '@/components/input-error';
import {
    IndicativeNote,
    Panel,
    StepContainer,
    StepHeading,
} from '@/components/mega/journey';
import { LenderMark } from '@/components/mega/lender-mark';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { money, rate } from '@/lib/format';
import journey from '@/routes/journey';
import type { JourneySummary, MatchCard } from '@/types/mega';

type Props = {
    application: JourneySummary;
    selected: MatchCard | null;
    documentCount: number;
    signatures: { title: string; signedAt: string }[];
    openQuestions: number;
};

export default function Finish({
    application,
    selected,
    documentCount,
    signatures,
    openQuestions,
}: Props) {
    return (
        <>
            <Head title="Finish" />
            <StepContainer>
                <StepHeading
                    eyebrow="Final check"
                    title="Ready to meet your broker"
                    description="Confirm the summary below. MEGA then allocates a licensed broker who covers your area and loan type."
                />

                <Panel className="space-y-6">
                    <div className="flex items-baseline justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {application.loanPackLabel}
                            </p>
                            <p className="num mt-1 text-3xl">
                                {money(application.amount)}
                            </p>
                        </div>
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="size-4" />
                            {application.state} {application.postcode}
                        </p>
                    </div>

                    <div className="border-t border-border pt-5">
                        <p className="text-xs text-muted-foreground">
                            Your chosen option
                        </p>
                        {selected ? (
                            <div className="mt-3 flex items-center justify-between gap-4">
                                <LenderMark
                                    name={selected.lender.name}
                                    color={selected.lender.color}
                                />
                                <span className="num text-sm">
                                    {rate(selected.rateMin)} –{' '}
                                    {rate(selected.rateMax)}
                                </span>
                            </div>
                        ) : (
                            <p className="mt-2 text-sm">
                                Your broker will recommend the best option.
                            </p>
                        )}
                    </div>

                    <div className="grid gap-3 border-t border-border pt-5 text-sm sm:grid-cols-2">
                        <p className="flex items-center gap-2">
                            <FileText className="size-4 text-muted-foreground" />
                            {documentCount} document
                            {documentCount === 1 ? '' : 's'} on file
                        </p>
                        {signatures.map((signature) => (
                            <p
                                key={signature.title}
                                className="flex items-center gap-2"
                            >
                                <BadgeCheck className="size-4 text-ok" />
                                {signature.title}
                            </p>
                        ))}
                    </div>

                    {openQuestions > 0 && (
                        <p className="rounded-xl bg-warn/10 p-3 text-sm text-warn">
                            {openQuestions} question
                            {openQuestions === 1 ? '' : 's'} will be picked up
                            by your broker.
                        </p>
                    )}
                </Panel>

                <Form
                    {...journey.finish.store.form(application.id)}
                    className="mt-8 space-y-3"
                >
                    {({ processing, errors }) => (
                        <>
                            <Button
                                type="submit"
                                size="lg"
                                className="h-12 w-full rounded-full shadow-[0_8px_30px_-8px_var(--mega-accent)]"
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Finish application
                                <ArrowRight className="size-4" />
                            </Button>
                            <InputError message={errors.signatures} />
                            <IndicativeNote className="text-center" />
                        </>
                    )}
                </Form>
            </StepContainer>
        </>
    );
}
