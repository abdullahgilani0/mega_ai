import { Form, Head, router } from '@inertiajs/react';
import { Download, Eye, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dateTime, humanize } from '@/lib/format';
import privacy from '@/routes/privacy';

type Props = {
    consents: {
        id: number;
        title: string;
        required: boolean;
        version: string;
        grantedAt: string;
        revokedAt: string | null;
    }[];
    accessHistory: {
        id: number;
        role: string;
        action: string;
        reason: string | null;
        at: string;
    }[];
    held: { applications: number; documents: number; signatures: number };
};

export default function Privacy({ consents, accessHistory, held }: Props) {
    return (
        <>
            <Head title="Privacy centre" />
            <p className="eyebrow text-mega-bright">Privacy centre</p>
            <h1 className="mt-3 font-display text-5xl">
                Your data, your controls
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
                See what we hold, who looked at it and why, download a copy, and
                withdraw optional consents.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                    ['Applications', held.applications],
                    ['Documents', held.documents],
                    ['Signed documents', held.signatures],
                ].map(([label, value]) => (
                    <div
                        key={label}
                        className="rounded-2xl border border-border p-6"
                    >
                        <p className="num text-4xl">{value}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {label}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <section className="rounded-3xl border border-border p-8">
                    <h2 className="flex items-center gap-2 font-medium">
                        <ShieldCheck className="size-4 text-mega-bright" />
                        Consents
                    </h2>
                    <ul className="mt-5 divide-y divide-border">
                        {consents.map((consent) => (
                            <li
                                key={consent.id}
                                className="flex items-center gap-4 py-3.5"
                            >
                                <div className="flex-1">
                                    <p className="text-sm">{consent.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        v{consent.version} · granted{' '}
                                        {dateTime(consent.grantedAt)}
                                        {consent.revokedAt &&
                                            ` · withdrawn ${dateTime(consent.revokedAt)}`}
                                    </p>
                                </div>
                                {!consent.required && !consent.revokedAt && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full"
                                        onClick={() =>
                                            router.delete(
                                                privacy.consents.revoke.url(
                                                    consent.id,
                                                ),
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        Withdraw
                                    </Button>
                                )}
                            </li>
                        ))}
                        {consents.length === 0 && (
                            <li className="py-3 text-sm text-muted-foreground">
                                No consents recorded yet.
                            </li>
                        )}
                    </ul>
                </section>

                <section className="rounded-3xl border border-border p-8">
                    <h2 className="flex items-center gap-2 font-medium">
                        <Eye className="size-4 text-mega-bright" />
                        Who accessed your file
                    </h2>
                    <ul className="mt-5 divide-y divide-border">
                        {accessHistory.map((entry) => (
                            <li key={entry.id} className="py-3.5 text-sm">
                                <p>
                                    {entry.role} · {humanize(entry.action)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {dateTime(entry.at)}
                                    {entry.reason && ` · ${entry.reason}`}
                                </p>
                            </li>
                        ))}
                        {accessHistory.length === 0 && (
                            <li className="py-3 text-sm text-muted-foreground">
                                No staff have accessed your file yet.
                            </li>
                        )}
                    </ul>
                </section>
            </div>

            <section className="mt-6 flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-border p-8">
                <div>
                    <h2 className="font-medium">Your copy, or deletion</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Some records, like signed disclosures, must be kept for
                        a period set by law.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button asChild variant="outline" className="rounded-full">
                        <a href={privacy.export().url}>
                            <Download className="size-4" /> Download my data
                        </a>
                    </Button>
                    <Form {...privacy.deletion.form()}>
                        {({ processing }) => (
                            <Button
                                type="submit"
                                variant="ghost"
                                className="rounded-full text-error hover:text-error"
                                disabled={processing}
                            >
                                <Trash2 className="size-4" /> Request deletion
                            </Button>
                        )}
                    </Form>
                </div>
            </section>
        </>
    );
}
