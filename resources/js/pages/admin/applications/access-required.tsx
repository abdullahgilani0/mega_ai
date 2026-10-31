import { Form, Head } from '@inertiajs/react';
import { KeyRound, Siren } from 'lucide-react';
import InputError from '@/components/input-error';
import { ConsolePage } from '@/components/mega/console';
import { Button } from '@/components/ui/button';
import admin from '@/routes/admin';

type Props = {
    application: {
        id: string;
        loanPackLabel: string;
        region: string;
        statusLabel: string;
    };
    grantMinutes: number;
    canBreakGlass: boolean;
};

export default function AccessRequired({
    application,
    grantMinutes,
    canBreakGlass,
}: Props) {
    return (
        <>
            <Head title="Access required" />
            <ConsolePage>
                <div className="mx-auto w-full max-w-xl py-10">
                    <span className="grid size-14 place-items-center rounded-2xl bg-mega/15 text-mega-bright">
                        <KeyRound className="size-6" />
                    </span>
                    <h1 className="mt-6 font-display text-4xl">
                        Why do you need this file?
                    </h1>
                    <p className="mt-3 text-muted-foreground">
                        {application.loanPackLabel} · {application.region} ·{' '}
                        {application.statusLabel}. Borrower files open only with
                        a stated reason, for {grantMinutes} minutes. The
                        borrower can see this in their privacy centre.
                    </p>

                    <Form
                        {...admin.access.store.form(application.id)}
                        className="mt-8 space-y-3"
                    >
                        {({ errors, processing }) => (
                            <>
                                <textarea
                                    name="reason"
                                    required
                                    minLength={8}
                                    placeholder="e.g. Reviewing a flagged payslip for the authenticity queue"
                                    className="min-h-24 w-full rounded-xl border border-input bg-transparent p-3 text-sm"
                                />
                                <InputError message={errors.reason} />
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full"
                                >
                                    Open file for {grantMinutes} minutes
                                </Button>
                            </>
                        )}
                    </Form>

                    {canBreakGlass && (
                        <details className="mt-10 rounded-2xl border border-error/40 p-5">
                            <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-error">
                                <Siren className="size-4" /> Emergency
                                break-glass access
                            </summary>
                            <p className="mt-3 text-sm text-muted-foreground">
                                For incidents only. Every admin is alerted
                                immediately and a post-incident review is
                                mandatory.
                            </p>
                            <Form
                                {...admin.access.breakGlass.form(
                                    application.id,
                                )}
                                className="mt-4 space-y-3"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <textarea
                                            name="reason"
                                            required
                                            minLength={15}
                                            placeholder="Describe the incident"
                                            className="min-h-20 w-full rounded-xl border border-input bg-transparent p-3 text-sm"
                                        />
                                        <InputError message={errors.reason} />
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={processing}
                                        >
                                            Break glass
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </details>
                    )}
                </div>
            </ConsolePage>
        </>
    );
}

AccessRequired.layout = {
    breadcrumbs: [{ title: 'Applications', href: admin.applications.index() }],
};
