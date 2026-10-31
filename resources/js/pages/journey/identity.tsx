import { Form, Head, Link, usePoll } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeCheck,
    Camera,
    IdCard,
    Smartphone,
    UserRoundSearch,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { StepContainer, StepHeading, Panel } from '@/components/mega/journey';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import journey from '@/routes/journey';
import type { JourneySummary } from '@/types/mega';

type Check = {
    id: number;
    result: 'pending' | 'verified' | 'retry' | 'manual_review';
    documentType: string;
    attempt: number;
    advice: string | null;
    completedOn: string | null;
};

type Props = {
    application: JourneySummary;
    check: Check | null;
    attemptsRemaining: number;
    handoff: { url: string; qrSvg: string } | null;
};

export default function Identity({
    application,
    check,
    attemptsRemaining,
    handoff,
}: Props) {
    const done =
        check?.result === 'verified' || check?.result === 'manual_review';

    return (
        <>
            <Head title="Verify your identity" />
            <StepContainer>
                {done ? (
                    <Outcome application={application} check={check} />
                ) : check?.result === 'pending' && handoff ? (
                    <FaceStep application={application} handoff={handoff} />
                ) : (
                    <CaptureStep
                        application={application}
                        check={check}
                        attemptsRemaining={attemptsRemaining}
                    />
                )}
            </StepContainer>
        </>
    );
}

function CaptureStep({
    application,
    check,
    attemptsRemaining,
}: {
    application: JourneySummary;
    check: Check | null;
    attemptsRemaining: number;
}) {
    const [type, setType] = useState('driver_licence');
    const [fileName, setFileName] = useState<string | null>(null);

    return (
        <>
            <StepHeading
                eyebrow="Identity · 1 of 2"
                title="Photograph your ID"
                description="A driver licence or passport. Lay it flat, in good light, with all four corners in frame."
            />

            {check?.result === 'retry' && (
                <div className="mb-6 rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm">
                    <p className="font-medium">{check.advice}</p>
                    <p className="mt-1 text-muted-foreground">
                        {attemptsRemaining} attempt
                        {attemptsRemaining === 1 ? '' : 's'} left before a
                        person checks it for you.
                    </p>
                </div>
            )}

            <Form
                {...journey.identity.start.form(application.id)}
                className="space-y-6"
            >
                {({ errors, processing }) => (
                    <>
                        <input
                            type="hidden"
                            name="document_type"
                            value={type}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                ['driver_licence', 'Driver licence'],
                                ['passport', 'Passport'],
                            ].map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setType(value)}
                                    aria-pressed={type === value}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl border p-4 text-left transition',
                                        type === value
                                            ? 'border-mega bg-mega/10'
                                            : 'border-border hover:border-foreground/30',
                                    )}
                                >
                                    <IdCard className="size-5 text-mega-bright" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        <label className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-14 text-center transition hover:border-mega/60 hover:bg-mega/[0.04]">
                            <span className="grid size-14 place-items-center rounded-full bg-mega/15">
                                <Camera className="size-6 text-mega-bright" />
                            </span>
                            <span className="font-medium">
                                {fileName ?? 'Take a photo or choose a file'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                JPG, PNG, HEIC or PDF · up to 15 MB
                            </span>
                            <input
                                type="file"
                                name="id_image"
                                accept="image/*,application/pdf"
                                capture="environment"
                                className="sr-only"
                                onChange={(e) =>
                                    setFileName(
                                        e.target.files?.[0]?.name ?? null,
                                    )
                                }
                            />
                        </label>
                        <InputError message={errors.id_image} />

                        <Button
                            type="submit"
                            size="lg"
                            className="h-12 w-full rounded-full"
                            disabled={processing || !fileName}
                        >
                            {processing && <Spinner />}
                            Check my ID
                            <ArrowRight className="size-4" />
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

function FaceStep({
    application,
    handoff,
}: {
    application: JourneySummary;
    handoff: { url: string; qrSvg: string };
}) {
    const [onPhone, setOnPhone] = useState(false);

    useEffect(() => {
        setOnPhone(window.matchMedia('(pointer: coarse)').matches);
    }, []);

    usePoll(2500, { only: ['check', 'handoff', 'application'] });

    const thisDevice = (
        <Form {...journey.identity.complete.form(application.id)}>
            {({ processing }) => (
                <Button
                    type="submit"
                    size="lg"
                    variant={onPhone ? 'default' : 'outline'}
                    className="h-12 w-full rounded-full"
                    disabled={processing}
                >
                    {processing ? (
                        <Spinner />
                    ) : (
                        <Smartphone className="size-4" />
                    )}
                    Scan my face on this device
                </Button>
            )}
        </Form>
    );

    return (
        <>
            <StepHeading
                eyebrow="Identity · 2 of 2"
                title="A quick face scan"
                description="A certified check compares a short selfie video with your ID photo. We keep the result, not the scan."
            />

            {onPhone ? (
                thisDevice
            ) : (
                <div className="grid gap-6 sm:grid-cols-[240px_1fr] sm:items-center">
                    <div
                        className="rounded-2xl bg-white p-3 [&_svg]:h-auto [&_svg]:w-full"
                        aria-label="QR code to continue on your phone"
                        role="img"
                        dangerouslySetInnerHTML={{ __html: handoff.qrSvg }}
                    />
                    <div>
                        <p className="font-medium">
                            Scan with your phone camera
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            The link is single-use and expires in 10 minutes.
                            This page updates by itself when your phone
                            finishes.
                        </p>
                        <p className="mt-5 inline-flex items-center gap-2 text-sm text-mega-bright">
                            <span className="size-2 animate-pulse rounded-full bg-mega-bright" />
                            Waiting for your phone…
                        </p>
                        <div className="mt-8">{thisDevice}</div>
                    </div>
                </div>
            )}
        </>
    );
}

function Outcome({
    application,
    check,
}: {
    application: JourneySummary;
    check: Check;
}) {
    const verified = check.result === 'verified';

    return (
        <Panel className="animate-rise p-10 text-center">
            <span
                className={cn(
                    'mx-auto grid size-16 place-items-center rounded-full',
                    verified
                        ? 'bg-ok/15 text-ok'
                        : 'bg-mega/15 text-mega-bright',
                )}
            >
                {verified ? (
                    <BadgeCheck className="size-8" />
                ) : (
                    <UserRoundSearch className="size-8" />
                )}
            </span>
            <h1 className="mt-6 font-display text-4xl">
                {verified
                    ? 'Identity verified'
                    : 'A person will confirm your ID'}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                {verified
                    ? 'Thank you. Your soft credit check is now running in the background.'
                    : 'Our team will finish checking your ID shortly. You can keep going in the meantime.'}
            </p>
            <Button asChild size="lg" className="mt-8 h-12 rounded-full px-8">
                <Link href={journey.documents(application.id)}>
                    Continue to documents
                    <ArrowRight className="size-4" />
                </Link>
            </Button>
        </Panel>
    );
}
