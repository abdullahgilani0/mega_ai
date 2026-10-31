import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import mobile from '@/routes/mobile';

type Props = {
    mobile: string;
    resendSeconds: number;
    devCode: string | null;
};

export default function VerifyMobile({
    mobile: masked,
    resendSeconds,
    devCode,
}: Props) {
    const page = usePage();
    const shownCode =
        (page.flash as { devCode?: string } | undefined)?.devCode ?? devCode;
    const [code, setCode] = useState('');
    const [wait, setWait] = useState(resendSeconds);

    useEffect(() => {
        if (wait <= 0) {
            return;
        }

        const timer = setTimeout(() => setWait(wait - 1), 1000);

        return () => clearTimeout(timer);
    }, [wait]);

    return (
        <>
            <Head title="Verify your mobile" />

            <p className="mb-6 text-sm text-muted-foreground">
                We sent a 6-digit code to{' '}
                <span className="num text-foreground">{masked}</span>. It
                expires in 5 minutes.
            </p>

            {shownCode && (
                <p className="mb-6 rounded-md border border-dashed border-warn/50 px-3 py-2 text-xs text-warn">
                    Local development only (no SMS provider): your code is{' '}
                    <span className="num font-semibold">{shownCode}</span>
                </p>
            )}

            <Form {...mobile.verify.store.form()} className="space-y-6">
                {({ errors, processing }) => (
                    <>
                        <InputOTP
                            maxLength={6}
                            value={code}
                            onChange={setCode}
                            name="code"
                            autoFocus
                            inputMode="numeric"
                            autoComplete="one-time-code"
                        >
                            <InputOTPGroup>
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <InputOTPSlot
                                        key={i}
                                        index={i}
                                        className="size-12 text-lg"
                                    />
                                ))}
                            </InputOTPGroup>
                        </InputOTP>
                        <InputError message={errors.code} />

                        <Button
                            type="submit"
                            className="h-11 w-full"
                            disabled={processing || code.length < 6}
                        >
                            {processing && <Spinner />}
                            Verify mobile
                        </Button>
                    </>
                )}
            </Form>

            <div className="mt-6 flex items-center justify-between text-sm">
                <Form
                    {...mobile.verify.resend.form()}
                    onSuccess={() => setWait(resendSeconds)}
                >
                    {({ processing }) => (
                        <button
                            type="submit"
                            disabled={processing || wait > 0}
                            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:no-underline disabled:opacity-60"
                        >
                            {wait > 0 ? `Resend in ${wait}s` : 'Resend code'}
                        </button>
                    )}
                </Form>
                <Link
                    href={logout()}
                    as="button"
                    className="text-muted-foreground hover:text-foreground"
                >
                    Log out
                </Link>
            </div>
        </>
    );
}

VerifyMobile.layout = {
    title: 'Verify your mobile',
    description: 'Step 1 of 2: confirm it is really you.',
};
