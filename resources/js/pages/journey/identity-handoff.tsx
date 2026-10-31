import { Head, router } from '@inertiajs/react';
import { BadgeCheck, ScanFace } from 'lucide-react';
import { useState } from 'react';
import { MegaLogo } from '@/components/mega/logo';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    check: { result: string; advice: string | null };
    submitUrl: string | null;
};

/**
 * Opened on the phone from the desktop QR code. Runs the vendor's liveness check.
 */
export default function IdentityHandoff({ check, submitUrl }: Props) {
    const [processing, setProcessing] = useState(false);
    const finished = check.result !== 'pending';

    return (
        <div className="flex min-h-dvh flex-col bg-background px-6 py-8">
            <Head title="Face scan" />
            <MegaLogo />
            <div className="flex flex-1 flex-col items-center justify-center text-center">
                {finished ? (
                    <>
                        <BadgeCheck className="size-14 text-ok" />
                        <h1 className="mt-6 font-display text-4xl">All done</h1>
                        <p className="mt-3 text-muted-foreground">
                            {check.advice ??
                                'You can put your phone down and carry on at your computer.'}
                        </p>
                    </>
                ) : (
                    <>
                        <div className="relative grid size-56 place-items-center">
                            <div className="absolute inset-0 animate-orb-spin rounded-full border-2 border-dashed border-mega/50" />
                            <ScanFace className="size-20 text-mega-bright" />
                        </div>
                        <h1 className="mt-8 font-display text-4xl">
                            Face scan
                        </h1>
                        <p className="mt-3 max-w-xs text-muted-foreground">
                            Hold your phone at eye level in good light, then
                            slowly turn your head when asked.
                        </p>
                        <Button
                            size="lg"
                            className="mt-10 h-12 w-full max-w-xs rounded-full"
                            disabled={processing || !submitUrl}
                            onClick={() => {
                                if (!submitUrl) {
                                    return;
                                }

                                setProcessing(true);
                                router.post(
                                    submitUrl,
                                    {},
                                    {
                                        onFinish: () => setProcessing(false),
                                    },
                                );
                            }}
                        >
                            {processing && <Spinner />}
                            Start face scan
                        </Button>
                        <p className="mt-4 text-xs text-muted-foreground">
                            Sandbox identity provider · no camera data leaves
                            this device in the demo
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
