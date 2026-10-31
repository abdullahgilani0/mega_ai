import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import {
    ConsolePage,
    PageHeader,
    Pagination,
    Pill,
    Table,
    statusTone,
} from '@/components/mega/console';
import { dateTime, money } from '@/lib/format';
import admin from '@/routes/admin';
import type { JourneySummary, Paginated } from '@/types/mega';

type Row = JourneySummary & { borrowerName: string; brokerName: string | null };

type Props = {
    applications: Paginated<Row>;
    filters: { status?: string; search?: string };
    statuses: { value: string; label: string }[];
};

export default function ApplicationsIndex({
    applications,
    filters,
    statuses,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const apply = (next: Record<string, string | undefined>) =>
        router.get(
            admin.applications.index.url(),
            { ...filters, ...next },
            { preserveState: true, replace: true },
        );

    return (
        <>
            <Head title="Applications" />
            <ConsolePage>
                <PageHeader
                    eyebrow="Pipeline"
                    title="Applications"
                    description="Viewing an application is logged and appears in the borrower's access history."
                />

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
                            placeholder="Name, email, postcode or ID"
                            className="h-10 w-72 rounded-md border border-input bg-transparent pr-3 pl-9 text-sm"
                        />
                    </form>
                    <select
                        value={filters.status ?? ''}
                        onChange={(e) =>
                            apply({ status: e.target.value || undefined })
                        }
                        className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
                    >
                        <option value="" className="bg-background">
                            All statuses
                        </option>
                        {statuses.map((status) => (
                            <option
                                key={status.value}
                                value={status.value}
                                className="bg-background"
                            >
                                {status.label}
                            </option>
                        ))}
                    </select>
                </div>

                <Table>
                    <thead>
                        <tr>
                            <th>Borrower</th>
                            <th>Loan</th>
                            <th>Amount</th>
                            <th>Region</th>
                            <th>Stage</th>
                            <th>Status</th>
                            <th>Broker</th>
                            <th>Started</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.data.map((row) => (
                            <tr key={row.id}>
                                <td>
                                    <Link
                                        href={admin.applications.show(row.id)}
                                        className="text-mega-bright"
                                    >
                                        {row.borrowerName}
                                    </Link>
                                </td>
                                <td>{row.loanPackLabel}</td>
                                <td className="num">{money(row.amount)}</td>
                                <td>
                                    {row.state} {row.postcode}
                                </td>
                                <td className="text-muted-foreground">
                                    {row.stageLabel}
                                </td>
                                <td>
                                    <Pill tone={statusTone(row.status)}>
                                        {row.statusLabel}
                                    </Pill>
                                </td>
                                <td>{row.brokerName ?? '—'}</td>
                                <td className="text-xs text-muted-foreground">
                                    {dateTime(row.createdAt)}
                                </td>
                            </tr>
                        ))}
                        {applications.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="text-center text-muted-foreground"
                                >
                                    No applications match.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
                <Pagination page={applications} />
            </ConsolePage>
        </>
    );
}

ApplicationsIndex.layout = {
    breadcrumbs: [{ title: 'Applications', href: admin.applications.index() }],
};
