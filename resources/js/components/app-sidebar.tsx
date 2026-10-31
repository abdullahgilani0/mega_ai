import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Building2,
    ClipboardCheck,
    FileWarning,
    FlaskConical,
    Gauge,
    GitPullRequestArrow,
    Inbox,
    KeyRound,
    LayoutGrid,
    ListTodo,
    Map,
    ScrollText,
    Settings2,
    ShieldAlert,
    Shuffle,
    UserCircle,
    UserCog,
    UserRoundX,
    UsersRound,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';
import broker from '@/routes/broker';
import type { NavItem } from '@/types';

type GuardedItem = NavItem & { permission: string };

/**
 * Navigation is derived from the signed-in user's permissions; the server still
 * enforces every route, this only hides what a role cannot use.
 */
const GROUPS: { label: string; items: GuardedItem[] }[] = [
    {
        label: 'Broker',
        items: [
            {
                title: 'Inbox',
                href: broker.inbox(),
                icon: Inbox,
                permission: 'broker.work',
            },
            {
                title: 'My profile',
                href: broker.profile.show(),
                icon: UserCircle,
                permission: 'broker.work',
            },
        ],
    },
    {
        label: 'Operations',
        items: [
            {
                title: 'Overview',
                href: admin.overview(),
                icon: Gauge,
                permission: 'console.access',
            },
            {
                title: 'Applications',
                href: admin.applications.index(),
                icon: LayoutGrid,
                permission: 'applications.view_all',
            },
            {
                title: 'Work queue',
                href: admin.workQueue.index(),
                icon: ListTodo,
                permission: 'documents.review',
            },
            {
                title: 'Authenticity flags',
                href: admin.authenticity.index(),
                icon: FileWarning,
                permission: 'authenticity.view',
            },
            {
                title: 'Allocation',
                href: admin.allocations.index(),
                icon: Shuffle,
                permission: 'allocations.manage',
            },
            {
                title: 'Reports',
                href: admin.reports.index(),
                icon: BarChart3,
                permission: 'reports.view',
            },
        ],
    },
    {
        label: 'Lender knowledge',
        items: [
            {
                title: 'Lender panel',
                href: admin.lenders.index(),
                icon: Building2,
                permission: 'lenders.manage',
            },
            {
                title: 'Policy reviews',
                href: admin.policies.reviews(),
                icon: GitPullRequestArrow,
                permission: 'lenders.manage',
            },
            {
                title: 'Golden scenarios',
                href: admin.golden.index(),
                icon: FlaskConical,
                permission: 'lenders.manage',
            },
        ],
    },
    {
        label: 'Network',
        items: [
            {
                title: 'Brokers',
                href: admin.brokers.index(),
                icon: UsersRound,
                permission: 'brokers.manage',
            },
            {
                title: 'Territories',
                href: admin.territories.index(),
                icon: Map,
                permission: 'brokers.manage',
            },
        ],
    },
    {
        label: 'Governance',
        items: [
            {
                title: 'Users & roles',
                href: admin.users.index(),
                icon: UserCog,
                permission: 'users.manage',
            },
            {
                title: 'Approvals',
                href: admin.approvals.index(),
                icon: ClipboardCheck,
                permission: 'approvals.review',
            },
            {
                title: 'Data requests',
                href: admin.dataRequests.index(),
                icon: UserRoundX,
                permission: 'privacy.requests',
            },
            {
                title: 'Staff access',
                href: admin.access.index(),
                icon: KeyRound,
                permission: 'audit.view',
            },
            {
                title: 'Audit log',
                href: admin.audit.index(),
                icon: ScrollText,
                permission: 'audit.view',
            },
            {
                title: 'Platform settings',
                href: admin.settings.index(),
                icon: Settings2,
                permission: 'settings.manage',
            },
        ],
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const permissions = (auth as { permissions?: string[] }).permissions ?? [];
    const groups = GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) =>
            permissions.includes(item.permission),
        ),
    })).filter((group) => group.items.length > 0);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {groups.length === 0 ? (
                    <NavMain
                        items={[
                            {
                                title: 'Dashboard',
                                href: dashboard(),
                                icon: LayoutGrid,
                            },
                        ]}
                    />
                ) : (
                    groups.map((group) => (
                        <NavMain
                            key={group.label}
                            label={group.label}
                            items={group.items}
                        />
                    ))
                )}
                {permissions.includes('access.break_glass') && (
                    <p className="mx-4 mt-auto flex items-center gap-1.5 pb-2 text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">
                        <ShieldAlert className="size-3" /> Every action you take
                        is audited.
                    </p>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
