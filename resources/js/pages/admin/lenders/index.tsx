import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus, Search, Upload } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
    CheckboxGroup,
    Field,
    FormDialog,
    Select,
    TextInput,
} from '@/components/mega/forms';
import { Button } from '@/components/ui/button';
import {
    ConsolePage,
    PageHeader,
    Pill,
    StatCard,
    Table,
    statusTone,
} from '@/components/mega/console';
import { LenderMark } from '@/components/mega/lender-mark';
import { date, humanize } from '@/lib/format';
import admin from '@/routes/admin';

type Lender = {
    id: number;
    name: string;
    category: string;
    color: string;
    status: string;
    coverage: string;
    packs: string[];
    staleRates: boolean;
    drafts: number;
    lastReviewedAt: string | null;
};

type Props = {
    lenders: Lender[];
    filters: { search?: string; coverage?: string };
    categories: string[];
    packs: { value: string; label: string }[];
};

export default function LendersIndex({
    lenders,
    filters,
    categories,
    packs,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const apply = (next: Record<string, string | undefined>) =>
        router.get(
            admin.lenders.index.url(),
            { ...filters, ...next },
            { preserveState: true, replace: true },
        );

    return (
        <>
            <Head title="Lender panel" />
            <ConsolePage>
                <PageHeader
                    eyebrow="Knowledge base"
                    title="Lender panel"
                    description="Structured rules are the source of truth for pass or fail. Drafts, including AI-extracted changes, go live only after a second person approves them."
                    actions={
                        <div className="flex gap-2">
                            <ImportLenders />
                            <CreateLender
                                categories={categories}
                                packs={packs}
                            />
                        </div>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-4">
                    <StatCard label="Lenders" value={lenders.length} />
                    <StatCard
                        label="Drafts awaiting review"
                        value={lenders.reduce((n, l) => n + l.drafts, 0)}
                        tone="warn"
                    />
                    <StatCard
                        label="Stale rate sheets"
                        value={lenders.filter((l) => l.staleRates).length}
                        tone="warn"
                    />
                    <StatCard
                        label="Not fully mapped"
                        value={
                            lenders.filter((l) => l.coverage !== 'full').length
                        }
                    />
                </div>

                <div className="flex flex-wrap gap-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            apply({ search: search || undefined });
                        }}
                        className="relative"
                    >
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search lenders"
                            className="h-10 w-64 rounded-md border border-input bg-transparent pr-3 pl-9 text-sm"
                        />
                    </form>
                    <select
                        value={filters.coverage ?? ''}
                        onChange={(e) =>
                            apply({ coverage: e.target.value || undefined })
                        }
                        className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
                    >
                        <option value="" className="bg-background">
                            All coverage
                        </option>
                        {['full', 'partial', 'unmapped'].map((c) => (
                            <option key={c} value={c} className="bg-background">
                                {humanize(c)}
                            </option>
                        ))}
                    </select>
                </div>

                <Table>
                    <thead>
                        <tr>
                            <th>Lender</th>
                            <th>Category</th>
                            <th>Loan packs</th>
                            <th>Coverage</th>
                            <th>Health</th>
                            <th>Status</th>
                            <th>Reviewed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lenders.map((lender) => (
                            <tr key={lender.id}>
                                <td>
                                    <Link href={admin.lenders.show(lender.id)}>
                                        <LenderMark
                                            name={lender.name}
                                            color={lender.color}
                                            size="sm"
                                        />
                                    </Link>
                                </td>
                                <td className="text-muted-foreground">
                                    {humanize(lender.category)}
                                </td>
                                <td className="space-x-1">
                                    {lender.packs.map((pack) => (
                                        <Pill key={pack}>{pack}</Pill>
                                    ))}
                                </td>
                                <td>
                                    <Pill tone={statusTone(lender.coverage)}>
                                        {lender.coverage}
                                    </Pill>
                                </td>
                                <td className="space-x-1">
                                    {lender.staleRates && (
                                        <Pill tone="warn">Stale rates</Pill>
                                    )}
                                    {lender.drafts > 0 && (
                                        <Pill tone="accent">
                                            {lender.drafts} draft
                                        </Pill>
                                    )}
                                    {!lender.staleRates &&
                                        lender.drafts === 0 && (
                                            <span className="text-xs text-muted-foreground">
                                                OK
                                            </span>
                                        )}
                                </td>
                                <td>
                                    <Pill tone={statusTone(lender.status)}>
                                        {lender.status}
                                    </Pill>
                                </td>
                                <td className="text-xs text-muted-foreground">
                                    {date(lender.lastReviewedAt)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                <p className="text-xs text-muted-foreground">
                    Demo panel: all lender names, policies and rates are
                    fictional seed data.
                </p>
            </ConsolePage>
        </>
    );
}

function CreateLender({
    categories,
    packs,
}: {
    categories: string[];
    packs: { value: string; label: string }[];
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: '',
        category: categories[0] ?? 'second_tier',
        abn: '',
        licence_ref: '',
        brand_color: '#2D7DFF',
        turnaround_days: '5',
        loan_packs: ['home'],
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(admin.lenders.store.url(), {
            onSuccess: () => setOpen(false),
        });
    }

    return (
        <FormDialog
            open={open}
            onOpenChange={setOpen}
            title="Add a lender"
            description="Each loan pack gets a draft policy from a template. Map it from the lender's documents, then a second analyst approves it."
            trigger={
                <Button>
                    <Plus className="size-4" /> Add lender
                </Button>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <Field label="Name" error={form.errors.name}>
                    <TextInput
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                    />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Category">
                        <Select
                            options={categories.map((c) => ({
                                value: c,
                                label: humanize(c),
                            }))}
                            value={form.data.category}
                            onChange={(e) =>
                                form.setData('category', e.target.value)
                            }
                        />
                    </Field>
                    <Field
                        label="Turnaround (days)"
                        error={form.errors.turnaround_days}
                    >
                        <TextInput
                            type="number"
                            value={form.data.turnaround_days}
                            onChange={(e) =>
                                form.setData('turnaround_days', e.target.value)
                            }
                        />
                    </Field>
                    <Field label="ABN" error={form.errors.abn}>
                        <TextInput
                            value={form.data.abn}
                            onChange={(e) =>
                                form.setData('abn', e.target.value)
                            }
                            placeholder="12 345 678 901"
                        />
                    </Field>
                    <Field label="Credit licence">
                        <TextInput
                            value={form.data.licence_ref}
                            onChange={(e) =>
                                form.setData('licence_ref', e.target.value)
                            }
                            placeholder="ACL 123456"
                        />
                    </Field>
                </div>
                <Field label="Brand colour" error={form.errors.brand_color}>
                    <input
                        type="color"
                        value={form.data.brand_color}
                        onChange={(e) =>
                            form.setData('brand_color', e.target.value)
                        }
                        className="h-10 w-20 rounded-md border border-input bg-transparent"
                    />
                </Field>
                <Field label="Loan packs" error={form.errors.loan_packs}>
                    <CheckboxGroup
                        options={packs}
                        value={form.data.loan_packs}
                        onChange={(v) => form.setData('loan_packs', v)}
                    />
                </Field>
                <div className="flex justify-end">
                    <Button type="submit" disabled={form.processing}>
                        Add lender
                    </Button>
                </div>
            </form>
        </FormDialog>
    );
}

function ImportLenders() {
    const [open, setOpen] = useState(false);
    const form = useForm<{ file: File | null }>({ file: null });

    return (
        <FormDialog
            open={open}
            onOpenChange={setOpen}
            title="Import lenders from CSV"
            description="Columns: name, category, abn, licence_ref, brand_color, turnaround_days, loan_packs (pipe-separated, e.g. home|personal). Existing names are skipped."
            trigger={
                <Button variant="outline">
                    <Upload className="size-4" /> Import CSV
                </Button>
            }
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.post(admin.lenders.import.url(), {
                        forceFormData: true,
                        onSuccess: () => setOpen(false),
                    });
                }}
                className="space-y-4"
            >
                <Field label="CSV file" error={form.errors.file}>
                    <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={(e) =>
                            form.setData('file', e.target.files?.[0] ?? null)
                        }
                        className="text-sm"
                    />
                </Field>
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={form.processing || !form.data.file}
                    >
                        Import
                    </Button>
                </div>
            </form>
        </FormDialog>
    );
}

LendersIndex.layout = {
    breadcrumbs: [{ title: 'Lender panel', href: admin.lenders.index() }],
};
