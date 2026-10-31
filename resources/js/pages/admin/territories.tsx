import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { ConsolePage, PageHeader } from '@/components/mega/console';
import {
    Field,
    FormDialog,
    Select,
    TextArea,
    TextInput,
} from '@/components/mega/forms';
import { Button } from '@/components/ui/button';
import admin from '@/routes/admin';

type Territory = {
    id: number;
    name: string;
    state: string;
    postcodes: string;
    postcodeCount: number;
    brokers: number;
};

export default function Territories({
    territories,
    states,
}: {
    territories: Territory[];
    states: string[];
}) {
    const [error, setError] = useState<string>();

    return (
        <>
            <Head title="Territories" />
            <ConsolePage>
                <PageHeader
                    eyebrow="Allocation geography"
                    title="Territories"
                    description="Postcode sets that decide which brokers are local to a borrower. Enter ranges like 2140-2200, 2760."
                    actions={
                        <TerritoryForm
                            states={states}
                            trigger={
                                <Button>
                                    <Plus className="size-4" /> New territory
                                </Button>
                            }
                        />
                    }
                />
                <InputError message={error} />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {territories.map((territory) => (
                        <div
                            key={territory.id}
                            className="rounded-2xl border border-border bg-card p-5"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-medium">
                                        {territory.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {territory.state} ·{' '}
                                        <span className="num">
                                            {territory.postcodeCount}
                                        </span>{' '}
                                        postcodes · {territory.brokers} brokers
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <TerritoryForm
                                        states={states}
                                        territory={territory}
                                        trigger={
                                            <Button size="sm" variant="ghost">
                                                Edit
                                            </Button>
                                        }
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        aria-label={`Delete ${territory.name}`}
                                        onClick={() =>
                                            router.delete(
                                                admin.territories.destroy.url(
                                                    territory.id,
                                                ),
                                                {
                                                    preserveScroll: true,
                                                    onError: (e) =>
                                                        setError(e.territory),
                                                },
                                            )
                                        }
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </div>
                            <p className="mt-3 line-clamp-3 font-mono text-[11px] text-muted-foreground">
                                {territory.postcodes}
                            </p>
                        </div>
                    ))}
                </div>
            </ConsolePage>
        </>
    );
}

function TerritoryForm({
    states,
    territory,
    trigger,
}: {
    states: string[];
    territory?: Territory;
    trigger: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: territory?.name ?? '',
        state: territory?.state ?? 'NSW',
        postcodes: territory?.postcodes ?? '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        };

        if (territory) {
            form.patch(admin.territories.update.url(territory.id), options);
        } else {
            form.post(admin.territories.store.url(), options);
        }
    }

    return (
        <FormDialog
            open={open}
            onOpenChange={setOpen}
            title={territory ? `Edit ${territory.name}` : 'New territory'}
            trigger={trigger}
        >
            <form onSubmit={submit} className="space-y-4">
                <Field label="Name" error={form.errors.name}>
                    <TextInput
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                    />
                </Field>
                <Field label="State">
                    <Select
                        options={states.map((s) => ({ value: s, label: s }))}
                        value={form.data.state}
                        onChange={(e) => form.setData('state', e.target.value)}
                    />
                </Field>
                <Field
                    label="Postcodes"
                    error={form.errors.postcodes}
                    hint="Comma-separated postcodes and ranges"
                >
                    <TextArea
                        value={form.data.postcodes}
                        onChange={(e) =>
                            form.setData('postcodes', e.target.value)
                        }
                        className="font-mono"
                    />
                </Field>
                <div className="flex justify-end">
                    <Button type="submit" disabled={form.processing}>
                        Save
                    </Button>
                </div>
            </form>
        </FormDialog>
    );
}

Territories.layout = {
    breadcrumbs: [{ title: 'Territories', href: admin.territories.index() }],
};
