import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import {
    Card,
    ConsolePage,
    PageHeader,
    Pill,
    statusTone,
} from '@/components/mega/console';
import {
    AddProductDialog,
    ArchiveLenderButton,
    LenderDocumentsCard,
    LenderProfileDialog,
    RateSheetDialog,
} from '@/components/mega/lender-admin';
import type { LenderDoc } from '@/components/mega/lender-admin';
import { LenderMark } from '@/components/mega/lender-mark';
import { Button } from '@/components/ui/button';
import { date, dateTime, humanize, money } from '@/lib/format';
import admin from '@/routes/admin';

type Rule = {
    id: string;
    label: string;
    field: string;
    op: string;
    value: unknown;
    clause: string;
};

type Policy = {
    id: number;
    loanPack: string;
    version: number;
    status: string;
    rules: Rule[];
    sourceDocument: string | null;
    createdBy: number | null;
    approver: string | null;
    publishedAt: string | null;
};

type Props = {
    lender: {
        id: number;
        name: string;
        category: string;
        abn: string | null;
        licenceRef: string | null;
        color: string;
        status: string;
        coverage: string;
        logoUsageApproved: boolean;
        turnaroundDays: number;
    };
    products: {
        id: number;
        loanPack: string;
        loanPackLabel: string;
        name: string;
        features: string[];
        rateSheets: {
            id: number;
            rows: { max_lvr: number; rate_min: number; rate_max: number }[];
            fees: { establishment: number; annual: number };
            effectiveFrom: string;
            stale: boolean;
        }[];
    }[];
    policies: Policy[];
    documents: LenderDoc[];
    documentKinds: { value: string; label: string }[];
    categories: string[];
};

const PACK_OPTIONS = [
    { value: 'home', label: 'Home loan' },
    { value: 'asset', label: 'Car & asset finance' },
    { value: 'personal', label: 'Personal loan' },
    { value: 'business', label: 'Business loan' },
];

const OPS: Record<string, string> = {
    lte: '≤',
    gte: '≥',
    in: 'in',
    not_in: 'not in',
    eq: '=',
};

export default function LenderShow({
    lender,
    products,
    policies,
    documents,
    documentKinds,
    categories,
}: Props) {
    const { auth } = usePage().props;
    const permissions = (auth as { permissions?: string[] }).permissions ?? [];
    const packs = [...new Set(policies.map((policy) => policy.loanPack))];

    return (
        <>
            <Head title={lender.name} />
            <ConsolePage>
                <PageHeader
                    eyebrow={humanize(lender.category)}
                    title={
                        <LenderMark
                            name={lender.name}
                            color={lender.color}
                            size="lg"
                        />
                    }
                    description={`ABN ${lender.abn ?? '—'} · ${lender.licenceRef ?? 'No licence on file'} · turnaround ~${lender.turnaroundDays} days`}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <LenderProfileDialog
                                lender={lender}
                                categories={categories}
                            />
                            <ArchiveLenderButton lender={lender} />
                            <select
                                value={lender.coverage}
                                onChange={(e) =>
                                    router.patch(
                                        admin.lenders.update.url(lender.id),
                                        { coverage: e.target.value },
                                        { preserveScroll: true },
                                    )
                                }
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                                aria-label="Coverage"
                            >
                                {['full', 'partial', 'unmapped'].map((c) => (
                                    <option
                                        key={c}
                                        value={c}
                                        className="bg-background"
                                    >
                                        Coverage: {c}
                                    </option>
                                ))}
                            </select>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9"
                                onClick={() =>
                                    router.patch(
                                        admin.lenders.update.url(lender.id),
                                        {
                                            status:
                                                lender.status === 'active'
                                                    ? 'paused'
                                                    : 'active',
                                        },
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                {lender.status === 'active'
                                    ? 'Pause lender'
                                    : 'Activate lender'}
                            </Button>
                        </div>
                    }
                />

                <div className="flex flex-wrap gap-2">
                    <Pill tone={statusTone(lender.status)}>
                        {lender.status}
                    </Pill>
                    <Pill tone={statusTone(lender.coverage)}>
                        {lender.coverage} mapping
                    </Pill>
                    <Pill tone={lender.logoUsageApproved ? 'ok' : 'muted'}>
                        {lender.logoUsageApproved
                            ? 'Logo use approved'
                            : 'Text wordmark (no logo permission)'}
                    </Pill>
                </div>

                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">
                        Products and pricing
                    </h2>
                    <AddProductDialog
                        lenderId={lender.id}
                        packs={PACK_OPTIONS}
                    />
                </div>
                <div className="grid gap-6 xl:grid-cols-2">
                    {products.map((product) => (
                        <Card
                            key={product.id}
                            title={`${product.name} · ${product.loanPackLabel}`}
                            actions={
                                <RateSheetDialog
                                    productId={product.id}
                                    current={product.rateSheets[0]}
                                />
                            }
                        >
                            {product.rateSheets.length === 0 && (
                                <p className="mb-3 text-xs text-warn">
                                    No rate sheet yet: this product shows as
                                    “manual check needed”.
                                </p>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                                {product.features.map((feature) => (
                                    <Pill key={feature}>
                                        {humanize(feature)}
                                    </Pill>
                                ))}
                            </div>
                            {product.rateSheets.slice(0, 1).map((sheet) => (
                                <div key={sheet.id} className="mt-4">
                                    <p className="text-xs text-muted-foreground">
                                        Rate sheet effective{' '}
                                        {date(sheet.effectiveFrom)}
                                        {sheet.stale && (
                                            <span className="ml-2 text-warn">
                                                Stale: pricing will show as
                                                manual check
                                            </span>
                                        )}
                                    </p>
                                    <table className="num mt-2 w-full text-sm">
                                        <thead className="text-xs text-muted-foreground">
                                            <tr>
                                                <th className="text-left font-normal">
                                                    LVR to
                                                </th>
                                                <th className="text-right font-normal">
                                                    Rate from
                                                </th>
                                                <th className="text-right font-normal">
                                                    Rate to
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sheet.rows.map((row) => (
                                                <tr
                                                    key={row.max_lvr}
                                                    className="border-t border-border/50"
                                                >
                                                    <td className="py-1.5">
                                                        {row.max_lvr >= 1000
                                                            ? 'n/a'
                                                            : `${row.max_lvr}%`}
                                                    </td>
                                                    <td className="text-right">
                                                        {row.rate_min.toFixed(
                                                            2,
                                                        )}
                                                        %
                                                    </td>
                                                    <td className="text-right">
                                                        {row.rate_max.toFixed(
                                                            2,
                                                        )}
                                                        %
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Fees: {money(sheet.fees.establishment)}{' '}
                                        upfront · {money(sheet.fees.annual)} a
                                        year
                                    </p>
                                </div>
                            ))}
                        </Card>
                    ))}
                </div>

                <LenderDocumentsCard
                    lenderId={lender.id}
                    documents={documents}
                    kinds={documentKinds}
                />

                {packs.map((pack) => (
                    <section key={pack} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-medium capitalize">
                                {pack} policy versions
                            </h2>
                            {!policies.some(
                                (p) =>
                                    p.loanPack === pack && p.status === 'draft',
                            ) && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        router.post(
                                            admin.policies.store.url(lender.id),
                                            { loan_pack: pack },
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    New draft from latest
                                </Button>
                            )}
                        </div>
                        {policies
                            .filter((p) => p.loanPack === pack)
                            .map((policy) => (
                                <PolicyCard
                                    key={policy.id}
                                    policy={policy}
                                    canPublish={permissions.includes(
                                        'policies.publish',
                                    )}
                                />
                            ))}
                    </section>
                ))}
            </ConsolePage>
        </>
    );
}

function PolicyCard({
    policy,
    canPublish,
}: {
    policy: Policy;
    canPublish: boolean;
}) {
    const draft = policy.status === 'draft';
    const [rules, setRules] = useState(policy.rules);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const dirty = JSON.stringify(rules) !== JSON.stringify(policy.rules);

    const setValue = (index: number, key: 'value' | 'clause', value: string) =>
        setRules(
            rules.map((rule, i) =>
                i === index
                    ? {
                          ...rule,
                          [key]:
                              key === 'value' && Array.isArray(rule.value)
                                  ? value.split(',').map((v) => v.trim())
                                  : value,
                      }
                    : rule,
            ),
        );

    return (
        <Card
            title={
                <span className="flex items-center gap-2">
                    Version {policy.version}
                    <Pill tone={statusTone(policy.status)}>
                        {policy.status}
                    </Pill>
                </span>
            }
            actions={
                <span className="text-xs text-muted-foreground">
                    {policy.sourceDocument}
                    {policy.publishedAt &&
                        ` · published ${dateTime(policy.publishedAt)}`}
                    {policy.approver && ` · approved by ${policy.approver}`}
                </span>
            }
            className={draft ? 'border-mega/40' : undefined}
        >
            <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                    <tr>
                        <th className="w-20 text-left font-normal">Rule</th>
                        <th className="text-left font-normal">Field</th>
                        <th className="w-56 text-left font-normal">
                            Requirement
                        </th>
                        <th className="text-left font-normal">
                            Policy clause (citation)
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rules.map((rule, i) => (
                        <tr
                            key={rule.id}
                            className="border-t border-border/50 align-top"
                        >
                            <td className="num py-2 text-xs">{rule.id}</td>
                            <td className="py-2 text-xs text-muted-foreground">
                                {rule.label}
                            </td>
                            <td className="py-2">
                                {draft ? (
                                    <span className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {rule.field} {OPS[rule.op]}
                                        </span>
                                        <input
                                            value={
                                                Array.isArray(rule.value)
                                                    ? rule.value.join(', ')
                                                    : String(rule.value)
                                            }
                                            onChange={(e) =>
                                                setValue(
                                                    i,
                                                    'value',
                                                    e.target.value,
                                                )
                                            }
                                            className="num h-8 w-28 rounded border border-input bg-transparent px-2 text-xs"
                                        />
                                    </span>
                                ) : (
                                    <span className="num text-xs">
                                        {rule.field} {OPS[rule.op]}{' '}
                                        {Array.isArray(rule.value)
                                            ? rule.value.join(', ')
                                            : String(rule.value)}
                                    </span>
                                )}
                            </td>
                            <td className="py-2 text-xs">
                                {draft ? (
                                    <input
                                        value={rule.clause}
                                        onChange={(e) =>
                                            setValue(
                                                i,
                                                'clause',
                                                e.target.value,
                                            )
                                        }
                                        className="h-8 w-full rounded border border-input bg-transparent px-2"
                                    />
                                ) : (
                                    <span className="text-muted-foreground">
                                        {rule.clause}
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {draft && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!dirty}
                        onClick={() =>
                            router.patch(
                                admin.policies.update.url(policy.id),
                                {
                                    rules: rules.map(({ value, clause }) => ({
                                        value: value as string | string[],
                                        clause,
                                    })),
                                },
                                { preserveScroll: true, onError: setErrors },
                            )
                        }
                    >
                        Save draft
                    </Button>
                    {canPublish && (
                        <Button
                            size="sm"
                            disabled={dirty}
                            onClick={() =>
                                router.post(
                                    admin.policies.publish.url(policy.id),
                                    {},
                                    {
                                        preserveScroll: true,
                                        onError: setErrors,
                                    },
                                )
                            }
                        >
                            Approve and publish
                        </Button>
                    )}
                    <span className="text-xs text-muted-foreground">
                        Publishing requires a different person from the draft's
                        author.
                    </span>
                    <InputError
                        message={errors.publish ?? Object.values(errors)[0]}
                    />
                </div>
            )}
        </Card>
    );
}

LenderShow.layout = {
    breadcrumbs: [{ title: 'Lender panel', href: admin.lenders.index() }],
};
