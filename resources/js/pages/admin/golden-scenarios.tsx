import { Head, router, useForm } from '@inertiajs/react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { ConsolePage, PageHeader, Pill } from '@/components/mega/console';
import { Field, FormDialog, Select, TextInput } from '@/components/mega/forms';
import { Button } from '@/components/ui/button';
import { humanize } from '@/lib/format';
import admin from '@/routes/admin';

type Scenario = {
    id: number;
    name: string;
    loanPack: string;
    scenario: Record<string, string | number>;
    results: {
        lender: string;
        expected: string;
        actual: string;
        ok: boolean;
    }[];
};

type Props = {
    scenarios: Scenario[];
    lenders: { id: number; name: string }[];
    fields: string[];
    packs: { value: string; label: string }[];
};

const OUTCOMES = [
    { value: 'pass', label: 'Pass' },
    { value: 'fail', label: 'Fail' },
    { value: 'unsure', label: 'Manual check' },
];

export default function GoldenScenarios({
    scenarios,
    lenders,
    fields,
    packs,
}: Props) {
    const failing = scenarios.reduce(
        (n, s) => n + s.results.filter((r) => !r.ok).length,
        0,
    );

    return (
        <>
            <Head title="Golden scenarios" />
            <ConsolePage>
                <PageHeader
                    eyebrow="Matching quality gate"
                    title="Golden scenarios"
                    description="Labelled borrower scenarios with the outcome you expect from specific lenders. A policy change cannot publish if it breaks one."
                    actions={
                        <CreateScenario
                            lenders={lenders}
                            fields={fields}
                            packs={packs}
                        />
                    }
                />
                <p className="text-sm">
                    {scenarios.length} scenarios ·{' '}
                    {failing === 0 ? (
                        <span className="text-ok">
                            all expectations hold against published policies
                        </span>
                    ) : (
                        <span className="text-error">
                            {failing} expectations failing against published
                            policies
                        </span>
                    )}
                </p>
                <div className="grid gap-4 xl:grid-cols-2">
                    {scenarios.map((scenario) => (
                        <div
                            key={scenario.id}
                            className="rounded-2xl border border-border bg-card p-5"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-medium">
                                        {scenario.name}
                                    </p>
                                    <Pill tone="accent">
                                        {scenario.loanPack}
                                    </Pill>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label="Delete scenario"
                                    onClick={() =>
                                        router.delete(
                                            admin.golden.destroy.url(
                                                scenario.id,
                                            ),
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                            <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                                {Object.entries(scenario.scenario)
                                    .map(([k, v]) => `${k}=${v}`)
                                    .join(' · ')}
                            </p>
                            <ul className="mt-3 space-y-1.5 text-sm">
                                {scenario.results.map((result) => (
                                    <li
                                        key={result.lender}
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <span className="flex items-center gap-2">
                                            {result.ok ? (
                                                <Check className="size-4 text-ok" />
                                            ) : (
                                                <X className="size-4 text-error" />
                                            )}
                                            {result.lender}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            expected{' '}
                                            <b>{humanize(result.expected)}</b>,
                                            got{' '}
                                            <b
                                                className={
                                                    result.ok
                                                        ? ''
                                                        : 'text-error'
                                                }
                                            >
                                                {humanize(result.actual)}
                                            </b>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </ConsolePage>
        </>
    );
}

function CreateScenario({ lenders, fields, packs }: Omit<Props, 'scenarios'>) {
    const [open, setOpen] = useState(false);
    const form = useForm<{
        name: string;
        loan_pack: string;
        scenario: Record<string, string>;
        expectations: { lender_id: string; outcome: string }[];
    }>({
        name: '',
        loan_pack: 'home',
        scenario: {
            amount: '600000',
            property_value: '800000',
            credit_score: '720',
            employment_type: 'payg',
            employment_months: '24',
            income_annual: '140000',
        },
        expectations: [
            { lender_id: String(lenders[0]?.id ?? ''), outcome: 'pass' },
        ],
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(admin.golden.store.url(), {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    }

    return (
        <FormDialog
            open={open}
            onOpenChange={setOpen}
            wide
            title="New golden scenario"
            description="Leave a field blank if it doesn't apply."
            trigger={
                <Button>
                    <Plus className="size-4" /> New scenario
                </Button>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Name" error={form.errors.name}>
                        <TextInput
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            placeholder="First home buyer, 90% LVR"
                        />
                    </Field>
                    <Field label="Loan pack">
                        <Select
                            options={packs}
                            value={form.data.loan_pack}
                            onChange={(e) =>
                                form.setData('loan_pack', e.target.value)
                            }
                        />
                    </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    {fields.map((field) => (
                        <Field key={field} label={humanize(field)}>
                            <TextInput
                                value={form.data.scenario[field] ?? ''}
                                onChange={(e) =>
                                    form.setData('scenario', {
                                        ...form.data.scenario,
                                        [field]: e.target.value,
                                    })
                                }
                            />
                        </Field>
                    ))}
                </div>
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                        Expected outcomes
                    </p>
                    {form.data.expectations.map((row, i) => (
                        <div key={i} className="flex gap-2">
                            <Select
                                options={lenders.map((l) => ({
                                    value: String(l.id),
                                    label: l.name,
                                }))}
                                value={row.lender_id}
                                onChange={(e) =>
                                    form.setData(
                                        'expectations',
                                        form.data.expectations.map((r, j) =>
                                            j === i
                                                ? {
                                                      ...r,
                                                      lender_id: e.target.value,
                                                  }
                                                : r,
                                        ),
                                    )
                                }
                            />
                            <Select
                                options={OUTCOMES}
                                value={row.outcome}
                                className="w-40"
                                onChange={(e) =>
                                    form.setData(
                                        'expectations',
                                        form.data.expectations.map((r, j) =>
                                            j === i
                                                ? {
                                                      ...r,
                                                      outcome: e.target.value,
                                                  }
                                                : r,
                                        ),
                                    )
                                }
                            />
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            form.setData('expectations', [
                                ...form.data.expectations,
                                {
                                    lender_id: String(lenders[0]?.id ?? ''),
                                    outcome: 'pass',
                                },
                            ])
                        }
                    >
                        <Plus className="size-3.5" /> Add lender
                    </Button>
                    {Object.entries(form.errors).length > 0 && (
                        <p className="text-sm text-error">
                            {Object.values(form.errors)[0]}
                        </p>
                    )}
                </div>
                <div className="flex justify-end">
                    <Button type="submit" disabled={form.processing}>
                        Save scenario
                    </Button>
                </div>
            </form>
        </FormDialog>
    );
}

GoldenScenarios.layout = {
    breadcrumbs: [{ title: 'Golden scenarios', href: admin.golden.index() }],
};
