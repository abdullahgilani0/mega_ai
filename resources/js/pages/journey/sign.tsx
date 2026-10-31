import { Form, Head, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    FileSignature,
    ShieldCheck,
    Smartphone,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { StepContainer, StepHeading } from '@/components/mega/journey';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { dateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import journey from '@/routes/journey';
import type { JourneySummary } from '@/types/mega';

type DisclosureDoc = {
    id: number;
    key: string;
    title: string;
    version: number;
    summary: string;
    body: string;
    signedAt: string | null;
    hash: string | null;
};

type Props = {
    application: JourneySummary;
    signerName: string;
    documents: DisclosureDoc[];
    stepUpValid: boolean;
};

export default function Sign({
    application,
    signerName,
    documents,
    stepUpValid,
}: Props) {
    const firstOpen = documents.find((doc) => !doc.signedAt)?.id ?? null;
    const [active, setActive] = useState<number | null>(firstOpen);
    const signedCount = documents.filter((doc) => doc.signedAt).length;

    useEffect(() => setActive(firstOpen), [firstOpen]);

    return (
        <>
            <Head title="Credit guide and signature" />
            <StepContainer>
                <StepHeading
                    eyebrow={`Sign · ${signedCount} of ${documents.length}`}
                    title="Read, then sign"
                    description="A short summary sits on top of each document; the full text is below. Type your name to sign."
                />

                {signedCount < documents.length && (
                    <StepUp
                        applicationId={application.id}
                        valid={stepUpValid}
                    />
                )}

                <ol className="space-y-3">
                    {documents.map((doc, i) => (
                        <li key={doc.id}>
                            <DisclosureItem
                                doc={doc}
                                index={i}
                                open={active === doc.id}
                                onToggle={() =>
                                    setActive(active === doc.id ? null : doc.id)
                                }
                                applicationId={application.id}
                                signerName={signerName}
                            />
                        </li>
                    ))}
                </ol>

                <p className="mt-8 flex items-start gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="size-4 shrink-0" />
                    Each signature records a SHA-256 fingerprint of the exact
                    document, the time, your IP address and device. You can
                    reopen every signed document from your dashboard.
                </p>
            </StepContainer>
        </>
    );
}

function DisclosureItem({
    doc,
    index,
    open,
    onToggle,
    applicationId,
    signerName,
}: {
    doc: DisclosureDoc;
    index: number;
    open: boolean;
    onToggle: () => void;
    applicationId: string;
    signerName: string;
}) {
    const openedAt = useRef<number>(Date.now());
    const [acknowledged, setAcknowledged] = useState(false);

    useEffect(() => {
        if (open) {
            openedAt.current = Date.now();
        }
    }, [open]);

    return (
        <div
            className={cn(
                'rounded-2xl border transition',
                open ? 'border-mega/50 bg-card' : 'border-border',
            )}
        >
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center gap-4 p-5 text-left"
                aria-expanded={open}
            >
                <span
                    className={cn(
                        'grid size-10 shrink-0 place-items-center rounded-full',
                        doc.signedAt
                            ? 'bg-ok/15 text-ok'
                            : 'bg-mega/15 text-mega-bright',
                    )}
                >
                    {doc.signedAt ? (
                        <BadgeCheck className="size-5" />
                    ) : (
                        <span className="num text-sm">{index + 1}</span>
                    )}
                </span>
                <span className="flex-1">
                    <span className="block font-medium">{doc.title}</span>
                    <span className="text-xs text-muted-foreground">
                        {doc.signedAt
                            ? `Signed ${dateTime(doc.signedAt)} · ${doc.hash?.slice(0, 12)}…`
                            : `Version ${doc.version}`}
                    </span>
                </span>
            </button>

            {open && (
                <div className="border-t border-border px-5 pb-5">
                    <p className="mt-5 rounded-xl bg-mega/10 p-4 text-sm">
                        <span className="font-medium">In short: </span>
                        {doc.summary}
                    </p>
                    <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-border p-4 text-sm leading-relaxed whitespace-pre-line text-foreground/85">
                        {doc.body}
                    </div>

                    {!doc.signedAt && (
                        <Form
                            {...journey.sign.store.form({
                                application: applicationId,
                                template: doc.id,
                            })}
                            transform={(data) => ({
                                ...data,
                                seconds_on_page: Math.round(
                                    (Date.now() - openedAt.current) / 1000,
                                ),
                            })}
                            options={{ preserveScroll: true }}
                            className="mt-5 space-y-4"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <label className="flex items-start gap-3 text-sm">
                                        <input
                                            type="checkbox"
                                            name="acknowledged"
                                            value="1"
                                            checked={acknowledged}
                                            onChange={(e) =>
                                                setAcknowledged(
                                                    e.target.checked,
                                                )
                                            }
                                            className="mt-0.5 size-4 accent-[var(--mega-accent)]"
                                        />
                                        I have read this document and agree to
                                        sign it electronically.
                                    </label>
                                    <InputError message={errors.acknowledged} />
                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <input
                                            name="signed_name"
                                            placeholder={`Type “${signerName}”`}
                                            autoComplete="name"
                                            className="h-12 flex-1 rounded-xl border border-input bg-transparent px-4 font-hand text-2xl outline-none focus:border-mega"
                                            aria-label="Type your full name to sign"
                                        />
                                        <Button
                                            type="submit"
                                            className="h-12 rounded-xl px-6"
                                            disabled={
                                                processing || !acknowledged
                                            }
                                        >
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <FileSignature className="size-4" />
                                            )}
                                            Sign
                                        </Button>
                                    </div>
                                    <InputError
                                        message={
                                            errors.signed_name ??
                                            (errors as Record<string, string>)
                                                .step_up
                                        }
                                    />
                                </>
                            )}
                        </Form>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Before signing, the borrower confirms it's them with a code sent to their verified mobile.
 */
function StepUp({
    applicationId,
    valid,
}: {
    applicationId: string;
    valid: boolean;
}) {
    const page = usePage();
    const devCode = (page.flash as { devCode?: string } | undefined)?.devCode;
    const [sent, setSent] = useState(false);

    if (valid) {
        return (
            <p className="mb-6 flex items-center gap-2 rounded-xl border border-ok/40 bg-ok/10 px-4 py-3 text-sm">
                <ShieldCheck className="size-4 text-ok" /> Identity confirmed
                for signing.
            </p>
        );
    }

    return (
        <div className="mb-6 rounded-2xl border border-mega/40 bg-mega/[0.06] p-5">
            <p className="flex items-center gap-2 font-medium">
                <Smartphone className="size-4 text-mega-bright" /> Confirm it’s
                you before signing
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
                We’ll text a 6-digit code to your verified mobile.
            </p>
            {devCode && (
                <p className="mt-3 rounded-md border border-dashed border-warn/50 px-3 py-2 text-xs text-warn">
                    Local development only: your code is{' '}
                    <span className="num font-semibold">{devCode}</span>
                </p>
            )}
            {!sent ? (
                <Form
                    {...journey.sign.stepUp.form(applicationId)}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setSent(true)}
                    className="mt-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <Button type="submit" disabled={processing}>
                                {processing && <Spinner />} Send code
                            </Button>
                            <InputError
                                message={errors.code}
                                className="mt-2"
                            />
                        </>
                    )}
                </Form>
            ) : (
                <Form
                    {...journey.sign.stepUp.confirm.form(applicationId)}
                    options={{ preserveScroll: true }}
                    className="mt-4 flex flex-wrap gap-2"
                >
                    {({ processing, errors }) => (
                        <>
                            <input
                                name="code"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                placeholder="6-digit code"
                                className="num h-10 w-40 rounded-md border border-input bg-transparent px-3 tracking-[0.3em]"
                            />
                            <Button type="submit" disabled={processing}>
                                Confirm
                            </Button>
                            <button
                                type="button"
                                onClick={() => setSent(false)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                            >
                                Resend
                            </button>
                            <InputError
                                message={errors.code}
                                className="w-full"
                            />
                        </>
                    )}
                </Form>
            )}
        </div>
    );
}
