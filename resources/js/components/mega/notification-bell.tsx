import { Link, router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { dateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import notifications from '@/routes/notifications';

type Notifications = {
    unread: number;
    items: {
        id: string;
        title: string;
        body: string;
        read: boolean;
        at: string | null;
    }[];
} | null;

/**
 * In-app notification centre: offers, messages, approvals, alerts.
 */
export function NotificationBell({ className }: { className?: string }) {
    const data = usePage().props.notifications as Notifications;
    const [open, setOpen] = useState(false);
    const panel = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const close = (event: MouseEvent) => {
            if (
                panel.current &&
                !panel.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', close);

        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    if (!data) {
        return null;
    }

    return (
        <div ref={panel} className={cn('relative', className)}>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="relative grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
                aria-label={`Notifications${data.unread ? `, ${data.unread} unread` : ''}`}
                aria-expanded={open}
            >
                <Bell className="size-[18px]" />
                {data.unread > 0 && (
                    <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-mega px-1 text-[10px] leading-4 font-semibold text-white">
                        {data.unread > 9 ? '9+' : data.unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-80 animate-rise overflow-hidden rounded-2xl border border-border bg-popover shadow-xl">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                        <p className="text-sm font-medium">Notifications</p>
                        {data.unread > 0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    router.post(
                                        notifications.readAll.url(),
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                                className="text-xs text-mega-bright hover:underline"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    <ul className="max-h-96 overflow-y-auto">
                        {data.items.length === 0 && (
                            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                                You’re all caught up.
                            </li>
                        )}
                        {data.items.map((item) => (
                            <li key={item.id}>
                                <Link
                                    href={notifications.open.url(item.id)}
                                    className="flex gap-3 px-4 py-3 transition hover:bg-accent"
                                >
                                    <span
                                        className={cn(
                                            'mt-1.5 size-2 shrink-0 rounded-full',
                                            item.read
                                                ? 'bg-transparent'
                                                : 'bg-mega',
                                        )}
                                    />
                                    <span className="min-w-0">
                                        <span className="block text-sm font-medium">
                                            {item.title}
                                        </span>
                                        <span className="block truncate text-xs text-muted-foreground">
                                            {item.body}
                                        </span>
                                        <span className="mt-0.5 block text-[10px] text-muted-foreground">
                                            {dateTime(item.at)}
                                        </span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
