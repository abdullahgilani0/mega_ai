import { Form, Head, router } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    CheckCircle2,
    FileText,
    Landmark,
    UploadCloud,
} from 'lucide-react';
import { useState } from 'react';
import type { DragEvent } from 'react';
import {
    Panel,
    StatusDot,
    StepContainer,
    StepHeading,
} from '@/components/mega/journey';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';
import journey from '@/routes/journey';
import type { DocumentTile, JourneySummary } from '@/types/mega';

type Props = {
    application: JourneySummary;
    documents: DocumentTile[];
    kinds: { value: string; label: string }[];
    suggested: string[];
    bank: {
        institution: string;
        incomeAnnual: number;
        expensesMonthly: number;
        liabilitiesMonthly: number;
    } | null;
    creditCheckComplete: boolean;
};

export default function Documents({
    application,
    documents,
    kinds,
    suggested,
    bank,
    creditCheckComplete,
}: Props) {
    const [kind, setKind] = useState(suggested[0] ?? 'payslip');
    const [uploading, setUploading] = useState(false);
    const [dragging, setDragging] = useState(false);

    const ordered = [
        ...kinds.filter((k) => suggested.includes(k.value)),
        ...kinds.filter((k) => !suggested.includes(k.value)),
    ];

    function upload(file: File | undefined) {
        if (!file) {
            return;
        }

        setUploading(true);
        router.post(
            journey.documents.store.url(application.id),
            { kind, file },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => setUploading(false),
            },
        );
    }

    function onDrop(event: DragEvent) {
        event.preventDefault();
        setDragging(false);
        upload(event.dataTransfer.files?.[0]);
    }

    return (
        <>
            <Head title="Your documents" />
            <StepContainer>
                <StepHeading
                    eyebrow="Documents"
                    title="Connect, don't upload"
                    description="Connecting your bank replaces statements and gives cleaner data. Upload anything else and MEGA reads it for you."
                />

                <Panel className="relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 size-56 rounded-full bg-mega/20 blur-3xl" />
                    <div className="relative flex flex-wrap items-start justify-between gap-6">
                        <div className="flex gap-4">
                            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-mega/15">
                                <Landmark className="size-6 text-mega-bright" />
                            </span>
                            <div>
                                <p className="font-medium">
                                    {bank
                                        ? 'Bank connected'
                                        : 'Connect your bank'}
                                    <span className="ml-2 rounded-full bg-ok/15 px-2 py-0.5 text-[10px] tracking-wide text-ok uppercase">
                                        Fastest
                                    </span>
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {bank
                                        ? bank.institution
                                        : 'Read-only, through the Consumer Data Right. We never see your banking password.'}
                                </p>
                            </div>
                        </div>
                        {!bank && (
                            <Form
                                {...journey.documents.bank.form(application.id)}
                                options={{ preserveScroll: true }}
                            >
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        className="rounded-full"
                                        disabled={processing}
                                    >
                                        {processing && <Spinner />}
                                        Connect securely
                                    </Button>
                                )}
                            </Form>
                        )}
                    </div>
                    {bank && (
                        <dl className="relative mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5">
                            {[
                                ['Income / year', bank.incomeAnnual],
                                ['Spending / month', bank.expensesMonthly],
                                [
                                    'Debt repayments / month',
                                    bank.liabilitiesMonthly,
                                ],
                            ].map(([label, value]) => (
                                <div key={label as string}>
                                    <dt className="text-xs text-muted-foreground">
                                        {label}
                                    </dt>
                                    <dd className="num mt-1 text-lg">
                                        {money(value as number)}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </Panel>

                <div className="mt-10">
                    <p className="mb-3 text-sm font-medium">Add a document</p>
                    <div className="mb-4 flex flex-wrap gap-2">
                        {ordered.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setKind(option.value)}
                                aria-pressed={kind === option.value}
                                className={cn(
                                    'min-h-9 rounded-full border px-3.5 text-xs transition',
                                    kind === option.value
                                        ? 'border-mega bg-mega/15'
                                        : 'border-border text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {option.label}
                                {suggested.includes(option.value) && (
                                    <span className="ml-1.5 text-mega-bright">
                                        •
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <label
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        className={cn(
                            'flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-10 text-center transition',
                            dragging
                                ? 'border-mega bg-mega/10'
                                : 'border-border hover:border-mega/60',
                        )}
                    >
                        {uploading ? (
                            <Spinner className="size-6" />
                        ) : (
                            <UploadCloud className="size-7 text-mega-bright" />
                        )}
                        <span className="text-sm">
                            {uploading
                                ? 'Reading your document…'
                                : 'Drop a file, take a photo, or browse'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            PDF, JPG, PNG or HEIC · up to 15 MB · virus-checked
                        </span>
                        <input
                            type="file"
                            className="sr-only"
                            accept="application/pdf,image/*"
                            disabled={uploading}
                            onChange={(e) => upload(e.target.files?.[0])}
                        />
                    </label>
                </div>

                {documents.length > 0 && (
                    <ul className="mt-6 divide-y divide-border rounded-2xl border border-border">
                        {documents.map((doc) => (
                            <li
                                key={doc.id}
                                className="flex items-center gap-4 px-4 py-3.5"
                            >
                                <FileText className="size-5 shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm">
                                        {doc.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {doc.kindLabel}
                                    </p>
                                    {doc.attentionReason && (
                                        <p className="mt-1 text-xs text-warn">
                                            {doc.attentionReason}
                                        </p>
                                    )}
                                </div>
                                <StatusDot status={doc.status} />
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
                    {creditCheckComplete ? (
                        <>
                            <CheckCircle2 className="size-4 text-ok" />
                            Credit check complete
                        </>
                    ) : (
                        <>
                            <Building2 className="size-4" />
                            Credit check runs in the background once your ID is
                            verified
                        </>
                    )}
                </div>

                <Form
                    {...journey.documents.continue.form(application.id)}
                    className="mt-10"
                >
                    {({ processing }) => (
                        <Button
                            type="submit"
                            size="lg"
                            className="h-12 w-full rounded-full"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            {bank || documents.length > 0
                                ? 'Continue'
                                : 'Skip for now, MEGA will ask what it needs'}
                            <ArrowRight className="size-4" />
                        </Button>
                    )}
                </Form>
            </StepContainer>
        </>
    );
}
