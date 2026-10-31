import { Head } from '@inertiajs/react';
import { BadgeCheck, Printer, ShieldAlert } from 'lucide-react';
import { MegaLogo } from '@/components/mega/logo';
import { Button } from '@/components/ui/button';
import { dateTime } from '@/lib/format';

type Props = {
    document: {
        title: string;
        version: number;
        body: string;
        signedName: string;
        signedAt: string;
        acknowledgedAt: string;
        hash: string;
        ip: string | null;
        secondsOnPage: number;
        verified: boolean;
    };
};

/**
 * Printable copy of a signed disclosure with its evidence of signature.
 */
export default function SignedDocument({ document }: Props) {
    return (
        <div className="min-h-dvh bg-background px-5 py-10 print:bg-white print:p-0 print:text-black">
            <Head title={document.title} />
            <div className="mx-auto max-w-3xl">
                <div className="flex items-center justify-between print:hidden">
                    <MegaLogo />
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => window.history.back()}
                        >
                            Back
                        </Button>
                        <Button onClick={() => window.print()}>
                            <Printer className="size-4" /> Print or save as PDF
                        </Button>
                    </div>
                </div>

                <article className="mt-8 rounded-3xl border border-border bg-card p-8 sm:p-12 print:border-0 print:p-0">
                    <p className="text-xs text-muted-foreground print:text-gray-600">
                        Version {document.version}
                    </p>
                    <h1 className="mt-1 font-display text-4xl">
                        {document.title}
                    </h1>
                    <div className="mt-8 text-[15px] leading-relaxed whitespace-pre-line">
                        {document.body}
                    </div>

                    <section className="mt-10 rounded-2xl border border-border p-5 text-sm print:border-gray-300">
                        <p className="flex items-center gap-2 font-medium">
                            {document.verified ? (
                                <BadgeCheck className="size-4 text-ok" />
                            ) : (
                                <ShieldAlert className="size-4 text-error" />
                            )}
                            {document.verified
                                ? 'Signature evidence: document unchanged since signing'
                                : 'Warning: document text does not match its signed fingerprint'}
                        </p>
                        <p className="mt-4 font-hand text-3xl">
                            {document.signedName}
                        </p>
                        <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                            <div>
                                <dt className="text-muted-foreground">
                                    Acknowledged
                                </dt>
                                <dd>{dateTime(document.acknowledgedAt)}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">
                                    Signed
                                </dt>
                                <dd>{dateTime(document.signedAt)}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">
                                    IP address
                                </dt>
                                <dd className="font-mono">
                                    {document.ip ?? '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">
                                    Time on page
                                </dt>
                                <dd>{document.secondsOnPage}s</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-muted-foreground">
                                    SHA-256 fingerprint
                                </dt>
                                <dd className="font-mono break-all">
                                    {document.hash}
                                </dd>
                            </div>
                        </dl>
                    </section>
                </article>
            </div>
        </div>
    );
}
