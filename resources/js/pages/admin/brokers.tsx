import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
    ConsolePage,
    PageHeader,
    Pill,
    Table,
    statusTone,
} from '@/components/mega/console';
import {
    CheckboxGroup,
    Field,
    FormDialog,
    Select,
    TextInput,
} from '@/components/mega/forms';
import { Button } from '@/components/ui/button';
import { dateTime, humanize } from '@/lib/format';
import admin from '@/routes/admin';

type Broker = {
    id: number;
    name: string;
    email: string;
    mobile: string | null;
    business: string | null;
    licenceRef: string;
    status: string;
    loanPacks: string[];
    skills: string[];
    languages: string[];
    capacity: number;
    open: number;
    acceptanceRate: number;
    avgFirstContactMinutes: number;
    territories: { id: number; name: string; coverage: string }[];
    lastAllocatedAt: string | null;
};

type Props = {
    brokers: Broker[];
    territories: { id: number; name: string; state: string }[];
    skills: string[];
    packs: { value: string; label: string }[];
};

export default function Brokers({
    brokers,
    territories,
    skills,
    packs,
}: Props) {
    const options = { territories, skills, packs };

    return (
        <>
            <Head title="Brokers" />
            <ConsolePage>
                <PageHeader
                    eyebrow="Network"
                    title="Brokers"
                    description="Territories, skills, languages and capacity feed the allocation engine. Pausing a broker removes them from new offers immediately."
                    actions={
                        <BrokerForm
                            {...options}
                            trigger={
                                <Button>
                                    <UserPlus className="size-4" /> Add broker
                                </Button>
                            }
                        />
                    }
                />
                <Table>
                    <thead>
                        <tr>
                            <th>Broker</th>
                            <th>Territories</th>
                            <th>Loan packs & skills</th>
                            <th>Load</th>
                            <th>Performance</th>
                            <th>Last allocated</th>
                            <th>Status</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {brokers.map((broker) => (
                            <tr key={broker.id}>
                                <td>
                                    <p>{broker.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {broker.business} · {broker.licenceRef}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {broker.languages.join(', ')}
                                    </p>
                                </td>
                                <td className="text-xs">
                                    {broker.territories.map((t) => (
                                        <p key={t.id}>
                                            {t.name}{' '}
                                            <span className="text-muted-foreground">
                                                ({t.coverage})
                                            </span>
                                        </p>
                                    ))}
                                </td>
                                <td className="max-w-64">
                                    <div className="flex flex-wrap gap-1">
                                        {broker.loanPacks.map((p) => (
                                            <Pill key={p} tone="accent">
                                                {p}
                                            </Pill>
                                        ))}
                                        {broker.skills.map((s) => (
                                            <Pill key={s}>{humanize(s)}</Pill>
                                        ))}
                                    </div>
                                </td>
                                <td className="num">
                                    {broker.open}/{broker.capacity}
                                </td>
                                <td className="num text-xs">
                                    {Math.round(broker.acceptanceRate * 100)}%
                                    accept
                                    <br />
                                    {broker.avgFirstContactMinutes} min first
                                    contact
                                </td>
                                <td className="text-xs text-muted-foreground">
                                    {dateTime(broker.lastAllocatedAt)}
                                </td>
                                <td>
                                    <select
                                        value={broker.status}
                                        onChange={(e) =>
                                            router.patch(
                                                admin.brokers.update.url(
                                                    broker.id,
                                                ),
                                                { status: e.target.value },
                                                { preserveScroll: true },
                                            )
                                        }
                                        className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                                        aria-label={`Status for ${broker.name}`}
                                    >
                                        {['active', 'paused', 'leave'].map(
                                            (s) => (
                                                <option
                                                    key={s}
                                                    value={s}
                                                    className="bg-background"
                                                >
                                                    {s}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <span className="ml-2">
                                        <Pill tone={statusTone(broker.status)}>
                                            {broker.status}
                                        </Pill>
                                    </span>
                                </td>
                                <td>
                                    <BrokerForm
                                        {...options}
                                        broker={broker}
                                        trigger={
                                            <Button size="sm" variant="ghost">
                                                Edit
                                            </Button>
                                        }
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </ConsolePage>
        </>
    );
}

function BrokerForm({
    broker,
    territories,
    skills,
    packs,
    trigger,
}: Omit<Props, 'brokers'> & { broker?: Broker; trigger: ReactNode }) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: broker?.name ?? '',
        email: broker?.email ?? '',
        mobile: broker?.mobile ?? '',
        licence_ref: broker?.licenceRef ?? '',
        business_name: broker?.business ?? '',
        loan_packs: broker?.loanPacks ?? ['home'],
        skills: broker?.skills ?? [],
        languages: broker?.languages.join(', ') ?? 'English',
        capacity: String(broker?.capacity ?? 10),
        territories:
            broker?.territories.map((t) => ({
                id: String(t.id),
                coverage: t.coverage,
            })) ?? [],
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            languages: data.languages
                .split(',')
                .map((l) => l.trim())
                .filter(Boolean),
        }));
        const options = {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        };

        if (broker) {
            form.patch(admin.brokers.update.url(broker.id), options);
        } else {
            form.post(admin.brokers.store.url(), options);
        }
    }

    const setTerritory = (
        i: number,
        patch: Partial<{ id: string; coverage: string }>,
    ) =>
        form.setData(
            'territories',
            form.data.territories.map((t, j) =>
                j === i ? { ...t, ...patch } : t,
            ),
        );

    return (
        <FormDialog
            open={open}
            onOpenChange={setOpen}
            wide
            title={broker ? `Edit ${broker.name}` : 'Add a broker'}
            description={
                broker ? undefined : 'They get an email to set a password.'
            }
            trigger={trigger}
        >
            <form onSubmit={submit} className="space-y-4">
                {!broker && (
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Full name" error={form.errors.name}>
                            <TextInput
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                            />
                        </Field>
                        <Field label="Email" error={form.errors.email}>
                            <TextInput
                                type="email"
                                value={form.data.email}
                                onChange={(e) =>
                                    form.setData('email', e.target.value)
                                }
                            />
                        </Field>
                        <Field label="Mobile" error={form.errors.mobile}>
                            <TextInput
                                value={form.data.mobile}
                                onChange={(e) =>
                                    form.setData('mobile', e.target.value)
                                }
                                placeholder="0412 345 678"
                            />
                        </Field>
                    </div>
                )}
                <div className="grid gap-3 sm:grid-cols-3">
                    <Field
                        label="Licence / credit rep no."
                        error={form.errors.licence_ref}
                    >
                        <TextInput
                            value={form.data.licence_ref}
                            onChange={(e) =>
                                form.setData('licence_ref', e.target.value)
                            }
                        />
                    </Field>
                    <Field label="Business name">
                        <TextInput
                            value={form.data.business_name}
                            onChange={(e) =>
                                form.setData('business_name', e.target.value)
                            }
                        />
                    </Field>
                    <Field
                        label="Capacity (open files)"
                        error={form.errors.capacity}
                    >
                        <TextInput
                            type="number"
                            value={form.data.capacity}
                            onChange={(e) =>
                                form.setData('capacity', e.target.value)
                            }
                        />
                    </Field>
                </div>
                <Field
                    label="Authorised loan packs"
                    error={form.errors.loan_packs}
                >
                    <CheckboxGroup
                        options={packs}
                        value={form.data.loan_packs}
                        onChange={(v) => form.setData('loan_packs', v)}
                    />
                </Field>
                <Field label="Skills">
                    <CheckboxGroup
                        options={skills.map((s) => ({
                            value: s,
                            label: humanize(s),
                        }))}
                        value={form.data.skills}
                        onChange={(v) => form.setData('skills', v)}
                    />
                </Field>
                <Field
                    label="Languages"
                    hint="Comma separated"
                    error={form.errors.languages}
                >
                    <TextInput
                        value={form.data.languages}
                        onChange={(e) =>
                            form.setData('languages', e.target.value)
                        }
                    />
                </Field>
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                        Territories
                    </p>
                    {form.data.territories.map((territory, i) => (
                        <div key={i} className="flex gap-2">
                            <Select
                                options={territories.map((t) => ({
                                    value: String(t.id),
                                    label: `${t.name} (${t.state})`,
                                }))}
                                value={territory.id}
                                onChange={(e) =>
                                    setTerritory(i, { id: e.target.value })
                                }
                            />
                            <Select
                                options={[
                                    { value: 'primary', label: 'Primary' },
                                    { value: 'secondary', label: 'Secondary' },
                                ]}
                                value={territory.coverage}
                                className="w-36"
                                onChange={(e) =>
                                    setTerritory(i, {
                                        coverage: e.target.value,
                                    })
                                }
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label="Remove territory"
                                onClick={() =>
                                    form.setData(
                                        'territories',
                                        form.data.territories.filter(
                                            (_, j) => j !== i,
                                        ),
                                    )
                                }
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    ))}
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                            form.setData('territories', [
                                ...form.data.territories,
                                {
                                    id: String(territories[0]?.id ?? ''),
                                    coverage: 'primary',
                                },
                            ])
                        }
                    >
                        <Plus className="size-3.5" /> Add territory
                    </Button>
                </div>
                <div className="flex justify-end">
                    <Button type="submit" disabled={form.processing}>
                        {broker ? 'Save' : 'Add broker'}
                    </Button>
                </div>
            </form>
        </FormDialog>
    );
}

Brokers.layout = {
    breadcrumbs: [{ title: 'Brokers', href: admin.brokers.index() }],
};
