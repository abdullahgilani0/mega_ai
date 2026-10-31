import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Card, ConsolePage, PageHeader } from '@/components/mega/console';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import admin from '@/routes/admin';

type Setting = {
    key: string;
    label: string;
    type: 'int' | 'bool' | 'weights';
    help: string;
    value: number | boolean | Record<string, number>;
};

export default function Settings({ settings }: { settings: Setting[] }) {
    return (
        <>
            <Head title="Platform settings" />
            <ConsolePage>
                <PageHeader
                    eyebrow="Super admin"
                    title="Platform settings"
                    description="Live controls for matching, allocation, security and retention. Every change is written to the audit log."
                />
                <div className="grid gap-4 xl:grid-cols-2">
                    {settings.map((setting) => (
                        <SettingCard key={setting.key} setting={setting} />
                    ))}
                </div>
            </ConsolePage>
        </>
    );
}

function SettingCard({ setting }: { setting: Setting }) {
    const [value, setValue] = useState(setting.value);
    const [error, setError] = useState<string | undefined>();
    const dirty = JSON.stringify(value) !== JSON.stringify(setting.value);

    const save = (next = value) =>
        router.patch(
            admin.settings.update.url(),
            { key: setting.key, value: next as never },
            {
                preserveScroll: true,
                onError: (errors) => setError(errors.value),
                onSuccess: () => setError(undefined),
            },
        );

    return (
        <Card
            title={setting.label}
            actions={
                <span className="font-mono text-[10px] text-muted-foreground">
                    {setting.key}
                </span>
            }
        >
            <p className="text-sm text-muted-foreground">{setting.help}</p>
            <div className="mt-4">
                {setting.type === 'bool' && (
                    <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(value)}
                        onClick={() => {
                            setValue(!value);
                            save(!value);
                        }}
                        className={cn(
                            'relative h-7 w-12 rounded-full transition',
                            value ? 'bg-mega' : 'bg-border',
                        )}
                    >
                        <span
                            className={cn(
                                'absolute top-1 left-1 size-5 rounded-full bg-white transition',
                                value && 'translate-x-5',
                            )}
                        />
                    </button>
                )}
                {setting.type === 'int' && (
                    <input
                        type="number"
                        min={0}
                        value={Number(value)}
                        onChange={(e) => setValue(Number(e.target.value))}
                        className="num h-10 w-40 rounded-md border border-input bg-transparent px-3"
                    />
                )}
                {setting.type === 'weights' && (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {Object.entries(value as Record<string, number>).map(
                            ([name, weight]) => (
                                <label
                                    key={name}
                                    className="flex items-center justify-between gap-3 text-sm"
                                >
                                    <span className="capitalize">
                                        {name.replaceAll('_', ' ')}
                                    </span>
                                    <input
                                        type="number"
                                        step={0.05}
                                        min={0}
                                        max={1}
                                        value={weight}
                                        onChange={(e) =>
                                            setValue({
                                                ...(value as Record<
                                                    string,
                                                    number
                                                >),
                                                [name]: Number(e.target.value),
                                            })
                                        }
                                        className="num h-9 w-24 rounded-md border border-input bg-transparent px-2"
                                    />
                                </label>
                            ),
                        )}
                        <p className="text-xs text-muted-foreground sm:col-span-2">
                            Total:{' '}
                            <span className="num">
                                {Object.values(value as Record<string, number>)
                                    .reduce((a, b) => a + b, 0)
                                    .toFixed(2)}
                            </span>{' '}
                            (must be 1.00)
                        </p>
                    </div>
                )}
            </div>
            <InputError message={error} className="mt-2" />
            {setting.type !== 'bool' && (
                <div className="mt-4 flex justify-end">
                    <Button size="sm" disabled={!dirty} onClick={() => save()}>
                        Save
                    </Button>
                </div>
            )}
        </Card>
    );
}

Settings.layout = {
    breadcrumbs: [{ title: 'Platform settings', href: admin.settings.index() }],
};
