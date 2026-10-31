import { Head, router } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    ConsolePage,
    PageHeader,
    Pagination,
    Table,
} from '@/components/mega/console';
import { dateTime } from '@/lib/format';
import admin from '@/routes/admin';
import type { Paginated } from '@/types/mega';

type Log = {
    id: number;
    action: string;
    actor: string;
    actorRole: string | null;
    subject: string | null;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    reason: string | null;
    ip: string | null;
    at: string;
};

type Props = {
    logs: Paginated<Log>;
    filters: { action?: string };
    exports: {
        id: number;
        status: string;
        downloadable: boolean;
        createdAt: string;
    }[];
};

export default function Audit({ logs, filters, exports }: Props) {
    const [action, setAction] = useState(filters.action ?? '');

    const requestExport = () => {
        const reason = window
            .prompt(
                'Why do you need a full export? A second super admin must approve.',
            )
            ?.trim();

        if (reason) {
            router.post(
                admin.audit.export.url(),
                { reason },
                { preserveScroll: true },
            );
        }
    };

    return (
        <>
            <Head title="Audit log" />
            <ConsolePage>
                <PageHeader
                    eyebrow="Compliance"
                    title="Audit log"
                    description="Write-once: entries can be added but never edited or deleted, by anyone."
                    actions={
                        <Button variant="outline" onClick={requestExport}>
                            <Download className="size-4" /> Request CSV export
                        </Button>
                    }
                />
                {exports.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs">
                        {exports.map((item) =>
                            item.downloadable ? (
                                <a
                                    key={item.id}
                                    href={admin.audit.download.url(item.id)}
                                    className="rounded-full bg-ok/15 px-3 py-1 text-ok"
                                >
                                    Export #{item.id} approved: download (24h)
                                </a>
                            ) : (
                                <span
                                    key={item.id}
                                    className="rounded-full bg-foreground/5 px-3 py-1 text-muted-foreground"
                                >
                                    Export #{item.id}: {item.status} ·{' '}
                                    {dateTime(item.createdAt)}
                                </span>
                            ),
                        )}
                    </div>
                )}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.get(
                            admin.audit.index.url(),
                            action ? { action } : {},
                            { preserveState: true },
                        );
                    }}
                >
                    <input
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        placeholder="Filter by action prefix, e.g. allocation."
                        className="h-10 w-80 rounded-md border border-input bg-transparent px-3 text-sm"
                    />
                </form>
                <Table>
                    <thead>
                        <tr>
                            <th>When</th>
                            <th>Action</th>
                            <th>Actor</th>
                            <th>Subject</th>
                            <th>Change</th>
                            <th>Reason</th>
                            <th>IP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.data.map((log) => (
                            <tr key={log.id} className="align-top">
                                <td className="text-xs whitespace-nowrap text-muted-foreground">
                                    {dateTime(log.at)}
                                </td>
                                <td className="font-mono text-xs">
                                    {log.action}
                                </td>
                                <td className="text-xs">
                                    {log.actor}
                                    {log.actorRole && (
                                        <span className="block text-muted-foreground">
                                            {log.actorRole}
                                        </span>
                                    )}
                                </td>
                                <td className="text-xs">
                                    {log.subject ?? '—'}
                                </td>
                                <td className="max-w-80 font-mono text-[11px] break-all text-muted-foreground">
                                    {log.before && (
                                        <p>− {JSON.stringify(log.before)}</p>
                                    )}
                                    {log.after && (
                                        <p>+ {JSON.stringify(log.after)}</p>
                                    )}
                                </td>
                                <td className="text-xs">{log.reason ?? '—'}</td>
                                <td className="num text-xs text-muted-foreground">
                                    {log.ip}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                <Pagination page={logs} />
            </ConsolePage>
        </>
    );
}

Audit.layout = {
    breadcrumbs: [{ title: 'Audit log', href: admin.audit.index() }],
};
