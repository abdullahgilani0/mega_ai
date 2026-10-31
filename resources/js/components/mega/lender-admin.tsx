import { router, useForm } from '@inertiajs/react';
import { Download, FilePlus2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '@/components/mega/console';
import { Field, FormDialog, Select, TextInput } from '@/components/mega/forms';
import { Button } from '@/components/ui/button';
import { date, humanize } from '@/lib/format';
import admin from '@/routes/admin';
import files from '@/routes/files';

export type LenderProfile = {
    id: number;
    name: string;
    category: string;
    abn: string | null;
    licenceRef: string | null;
    color: string;
    status: string;
    turnaroundDays: number;
};

export type LenderDoc = {
    id: number;
    kind: string;
    kindLabel: string;
    title: string;
    version: number;
    sha256: string;
    sizeBytes: number;
    effectiveFrom: string;
};

export function LenderProfileDialog({
    lender,
    categories,
}: {
    lender: LenderProfile;
    categories: string[];
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: lender.name,
        category: lender.category,
        abn: lender.abn ?? '',
        licence_ref: lender.licenceRef ?? '',
        brand_color: lender.color,
        turnaround_days: String(lender.turnaroundDays),
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.patch(admin.lenders.profile.url(lender.id), {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    }

    return (
        <FormDialog
            open={open}
            onOpenChange={setOpen}
            title="Edit lender profile"
            trigger={
                <Button size="sm" variant="outline" className="h-9">
                    <Pencil className="size-3.5" /> Edit profile
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
                        />
                    </Field>
                    <Field label="Credit licence">
                        <TextInput
                            value={form.data.licence_ref}
                            onChange={(e) =>
                                form.setData('licence_ref', e.target.value)
                            }
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
                <div className="flex justify-end">
                    <Button type="submit" disabled={form.processing}>
                        Save
                    </Button>
                </div>
            </form>
        </FormDialog>
    );
}

export function ArchiveLenderButton({ lender }: { lender: LenderProfile }) {
    if (lender.status === 'archived') {
        return null;
    }

    return (
        <Button
            size="sm"
            variant="ghost"
            className="h-9 text-error hover:text-error"
            onClick={() => {
                if (
                    window.confirm(
                        `Archive ${lender.name}? It will be excluded from new assessments. History is kept.`,
                    )
                ) {
                    router.post(
                        admin.lenders.archive.url(lender.id),
                        {},
                        { preserveScroll: true },
                    );
                }
            }}
        >
            Archive
        </Button>
    );
}

export function AddProductDialog({
    lenderId,
    packs,
}: {
    lenderId: number;
    packs: { value: string; label: string }[];
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        loan_pack: packs[0]?.value ?? 'home',
        name: '',
        features: '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            features: data.features
                .split(',')
                .map((f) => f.trim())
                .filter(Boolean),
        }));
        form.post(admin.products.store.url(lenderId), {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    }

    return (
        <FormDialog
            open={open}
            onOpenChange={setOpen}
            title="Add a product"
            description="A new loan pack also gets a draft policy to map."
            trigger={
                <Button size="sm" variant="outline">
                    <Plus className="size-3.5" /> Add product
                </Button>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <Field label="Loan pack">
                    <Select
                        options={packs}
                        value={form.data.loan_pack}
                        onChange={(e) =>
                            form.setData('loan_pack', e.target.value)
                        }
                    />
                </Field>
                <Field label="Product name" error={form.errors.name}>
                    <TextInput
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                    />
                </Field>
                <Field
                    label="Features"
                    hint="Comma separated, e.g. offset, redraw, extra_repayments"
                >
                    <TextInput
                        value={form.data.features}
                        onChange={(e) =>
                            form.setData('features', e.target.value)
                        }
                    />
                </Field>
                <div className="flex justify-end">
                    <Button type="submit" disabled={form.processing}>
                        Add product
                    </Button>
                </div>
            </form>
        </FormDialog>
    );
}

export function RateSheetDialog({
    productId,
    current,
}: {
    productId: number;
    current?: {
        rows: { max_lvr: number; rate_min: number; rate_max: number }[];
        fees: { establishment: number; annual: number };
    };
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        rows: (
            current?.rows ?? [{ max_lvr: 80, rate_min: 6, rate_max: 6.3 }]
        ).map((r) => ({
            max_lvr: String(r.max_lvr),
            rate_min: String(r.rate_min),
            rate_max: String(r.rate_max),
        })),
        fees: {
            establishment: String(current?.fees.establishment ?? 0),
            annual: String(current?.fees.annual ?? 0),
        },
        effective_from: new Date().toISOString().slice(0, 10),
    });

    const setRow = (
        i: number,
        key: 'max_lvr' | 'rate_min' | 'rate_max',
        value: string,
    ) =>
        form.setData(
            'rows',
            form.data.rows.map((row, j) =>
                j === i ? { ...row, [key]: value } : row,
            ),
        );

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(admin.rateSheets.store.url(productId), {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    }

    return (
        <FormDialog
            open={open}
            onOpenChange={setOpen}
            title="New rate sheet version"
            description="Sheets are never edited in place. A new effective-dated version replaces the old one. Use LVR 1000 for products without LVR bands."
            trigger={
                <Button size="sm" variant="ghost">
                    <FilePlus2 className="size-3.5" /> New rate sheet
                </Button>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground">
                        <span>LVR up to (%)</span>
                        <span>Rate from (%)</span>
                        <span>Rate to (%)</span>
                        <span />
                    </div>
                    {form.data.rows.map((row, i) => (
                        <div
                            key={i}
                            className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2"
                        >
                            <TextInput
                                type="number"
                                step="0.01"
                                value={row.max_lvr}
                                onChange={(e) =>
                                    setRow(i, 'max_lvr', e.target.value)
                                }
                            />
                            <TextInput
                                type="number"
                                step="0.01"
                                value={row.rate_min}
                                onChange={(e) =>
                                    setRow(i, 'rate_min', e.target.value)
                                }
                            />
                            <TextInput
                                type="number"
                                step="0.01"
                                value={row.rate_max}
                                onChange={(e) =>
                                    setRow(i, 'rate_max', e.target.value)
                                }
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label="Remove band"
                                onClick={() =>
                                    form.setData(
                                        'rows',
                                        form.data.rows.filter(
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
                            form.setData('rows', [
                                ...form.data.rows,
                                { max_lvr: '90', rate_min: '', rate_max: '' },
                            ])
                        }
                    >
                        <Plus className="size-3.5" /> Add band
                    </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Upfront fee ($)">
                        <TextInput
                            type="number"
                            value={form.data.fees.establishment}
                            onChange={(e) =>
                                form.setData('fees', {
                                    ...form.data.fees,
                                    establishment: e.target.value,
                                })
                            }
                        />
                    </Field>
                    <Field label="Annual fee ($)">
                        <TextInput
                            type="number"
                            value={form.data.fees.annual}
                            onChange={(e) =>
                                form.setData('fees', {
                                    ...form.data.fees,
                                    annual: e.target.value,
                                })
                            }
                        />
                    </Field>
                    <Field
                        label="Effective from"
                        error={form.errors.effective_from}
                    >
                        <TextInput
                            type="date"
                            value={form.data.effective_from}
                            onChange={(e) =>
                                form.setData('effective_from', e.target.value)
                            }
                        />
                    </Field>
                </div>
                {Object.keys(form.errors).length > 0 && (
                    <p className="text-sm text-error">
                        {Object.values(form.errors)[0]}
                    </p>
                )}
                <div className="flex justify-end">
                    <Button type="submit" disabled={form.processing}>
                        Save rate sheet
                    </Button>
                </div>
            </form>
        </FormDialog>
    );
}

export function LenderDocumentsCard({
    lenderId,
    documents,
    kinds,
}: {
    lenderId: number;
    documents: LenderDoc[];
    kinds: { value: string; label: string }[];
}) {
    const form = useForm<{
        kind: string;
        title: string;
        effective_from: string;
        file: File | null;
    }>({
        kind: kinds[0]?.value ?? 'credit_policy',
        title: '',
        effective_from: new Date().toISOString().slice(0, 10),
        file: null,
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(admin.lenderDocuments.store.url(lenderId), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.reset('title', 'file'),
        });
    }

    return (
        <Card title="Source documents">
            <p className="text-xs text-muted-foreground">
                Credit policies, guides, rate sheets and bulletins. Every upload
                is versioned and fingerprinted (SHA-256). Credit guides are
                offered to borrowers on their matches.
            </p>
            <form
                onSubmit={submit}
                className="mt-4 grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-[1fr_1.4fr_1fr]"
            >
                <Field label="Type">
                    <Select
                        options={kinds}
                        value={form.data.kind}
                        onChange={(e) => form.setData('kind', e.target.value)}
                    />
                </Field>
                <Field label="Title" error={form.errors.title}>
                    <TextInput
                        value={form.data.title}
                        onChange={(e) => form.setData('title', e.target.value)}
                        placeholder="Credit policy, October 2026"
                    />
                </Field>
                <Field label="Effective from">
                    <TextInput
                        type="date"
                        value={form.data.effective_from}
                        onChange={(e) =>
                            form.setData('effective_from', e.target.value)
                        }
                    />
                </Field>
                <Field
                    label="File"
                    error={form.errors.file}
                    className="sm:col-span-2"
                >
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                        onChange={(e) =>
                            form.setData('file', e.target.files?.[0] ?? null)
                        }
                        className="text-sm"
                    />
                </Field>
                <div className="flex items-end justify-end">
                    <Button
                        type="submit"
                        disabled={
                            form.processing ||
                            !form.data.file ||
                            !form.data.title
                        }
                    >
                        Upload
                    </Button>
                </div>
            </form>
            <ul className="mt-4 divide-y divide-border text-sm">
                {documents.map((doc) => (
                    <li
                        key={doc.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                    >
                        <span>
                            {doc.title}{' '}
                            <span className="text-muted-foreground">
                                · {doc.kindLabel} v{doc.version} · effective{' '}
                                {date(doc.effectiveFrom)}
                            </span>
                            <span className="block font-mono text-[10px] text-muted-foreground">
                                sha256 {doc.sha256.slice(0, 24)}…
                            </span>
                        </span>
                        <a
                            href={files.lenderDocument.url(doc.id)}
                            className="inline-flex items-center gap-1 text-xs text-mega-bright"
                        >
                            <Download className="size-3.5" /> Download
                        </a>
                    </li>
                ))}
                {documents.length === 0 && (
                    <li className="py-2 text-muted-foreground">
                        No documents yet.
                    </li>
                )}
            </ul>
        </Card>
    );
}
