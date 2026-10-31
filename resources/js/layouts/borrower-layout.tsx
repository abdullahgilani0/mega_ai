import { Link, usePage } from '@inertiajs/react';
import { MegaAvatar } from '@/components/mega/avatar';
import { MegaLogo } from '@/components/mega/logo';
import { NotificationBell } from '@/components/mega/notification-bell';
import { useFlashToast } from '@/hooks/use-flash-toast';
import { cn } from '@/lib/utils';
import { dashboard, logout } from '@/routes';
import privacy from '@/routes/privacy';
import { edit as profile } from '@/routes/profile';

export default function BorrowerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useFlashToast();
    const { props, url } = usePage();
    const links = [
        { label: 'Dashboard', href: dashboard().url },
        { label: 'Privacy centre', href: privacy.show().url },
        { label: 'Settings', href: profile().url },
    ];

    return (
        <div className="min-h-dvh bg-background">
            <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
                    <Link href={dashboard()} aria-label="MEGA dashboard">
                        <MegaLogo />
                    </Link>
                    <nav className="hidden items-center gap-1 sm:flex">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition hover:text-foreground',
                                    url.startsWith(
                                        new URL(link.href, 'http://x').pathname,
                                    ) && 'bg-accent text-foreground',
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <Link
                            href={logout()}
                            as="button"
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            Log out
                        </Link>
                        <MegaAvatar
                            index={
                                (props.auth as { avatar?: number }).avatar ?? 0
                            }
                            className="size-9"
                        />
                    </div>
                </div>
            </header>
            <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:py-14">
                {children}
            </main>
        </div>
    );
}
