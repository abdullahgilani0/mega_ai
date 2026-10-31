import { Head, router, useForm } from '@inertiajs/react';
import { Laptop, Smartphone } from 'lucide-react';
import type { FormEvent } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { dateTime } from '@/lib/format';
import devices from '@/routes/devices';

type Props = {
    sessions: {
        id: string;
        ip: string | null;
        agent: string | null;
        current: boolean;
        lastActive: string;
    }[];
    mobile: string | null;
};

function describe(agent: string | null): string {
    if (!agent) {
        return 'Unknown device';
    }

    const browser = /Edg\//.test(agent)
        ? 'Edge'
        : /Chrome\//.test(agent)
          ? 'Chrome'
          : /Firefox\//.test(agent)
            ? 'Firefox'
            : /Safari\//.test(agent)
              ? 'Safari'
              : 'Browser';
    const os = /Windows/.test(agent)
        ? 'Windows'
        : /Android/.test(agent)
          ? 'Android'
          : /iPhone|iPad/.test(agent)
            ? 'iOS'
            : /Mac OS/.test(agent)
              ? 'macOS'
              : /Linux/.test(agent)
                ? 'Linux'
                : 'Unknown OS';

    return `${browser} on ${os}`;
}

export default function Devices({ sessions, mobile }: Props) {
    const form = useForm({ mobile: '' });

    function changeMobile(event: FormEvent) {
        event.preventDefault();
        form.put(devices.mobile.url());
    }

    return (
        <>
            <Head title="Devices & mobile" />
            <div className="space-y-10">
                <section className="space-y-4">
                    <Heading
                        variant="small"
                        title="Signed-in devices"
                        description="If you don't recognise a device, sign it out and change your password."
                    />
                    <ul className="divide-y divide-border rounded-xl border border-border">
                        {sessions.map((session) => {
                            const Icon = /Android|iPhone|iPad|Mobile/.test(
                                session.agent ?? '',
                            )
                                ? Smartphone
                                : Laptop;

                            return (
                                <li
                                    key={session.id}
                                    className="flex items-center gap-3 px-4 py-3"
                                >
                                    <Icon className="size-5 text-muted-foreground" />
                                    <div className="flex-1">
                                        <p className="text-sm">
                                            {describe(session.agent)}
                                            {session.current && (
                                                <span className="ml-2 rounded-full bg-ok/15 px-2 py-0.5 text-[10px] text-ok">
                                                    This device
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {session.ip} · last active{' '}
                                            {dateTime(session.lastActive)}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    {sessions.length > 1 && (
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.delete(devices.destroy.url(), {
                                    preserveScroll: true,
                                })
                            }
                        >
                            Sign out all other devices
                        </Button>
                    )}
                </section>

                <section className="space-y-4">
                    <Heading
                        variant="small"
                        title="Mobile number"
                        description={`Currently ${mobile ?? 'not set'}. The new number must be verified by SMS, and we alert you about the change.`}
                    />
                    <form
                        onSubmit={changeMobile}
                        className="flex max-w-md gap-2"
                    >
                        <input
                            value={form.data.mobile}
                            onChange={(e) =>
                                form.setData('mobile', e.target.value)
                            }
                            placeholder="New mobile, e.g. 0412 345 678"
                            inputMode="tel"
                            className="h-10 flex-1 rounded-md border border-input bg-transparent px-3 text-sm"
                        />
                        <Button
                            type="submit"
                            disabled={form.processing || !form.data.mobile}
                        >
                            Change
                        </Button>
                    </form>
                    <InputError message={form.errors.mobile} />
                </section>
            </div>
        </>
    );
}
