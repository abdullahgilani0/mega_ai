import { Head, router, useForm } from '@inertiajs/react';
import { Check, Minus, UserPlus } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
    ConsolePage,
    PageHeader,
    Pagination,
    Pill,
    Table,
} from '@/components/mega/console';
import { Field, FormDialog, Select, TextInput } from '@/components/mega/forms';
import { Button } from '@/components/ui/button';
import { dateTime } from '@/lib/format';
import admin from '@/routes/admin';
import type { Paginated } from '@/types/mega';

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: string;
    roleLabel: string;
    status: string;
    mobileVerified: boolean;
    emailVerified: boolean;
    mfa: boolean;
    lastLoginAt: string | null;
    pendingRole: string | null;
};

type Props = {
    users: Paginated<UserRow>;
    roles: { value: string; label: string }[];
    filters: { search?: string; role?: string };
    canAssignRoles: boolean;
};

export default function Users({
    users,
    roles,
    filters,
    canAssignRoles,
}: Props) {
    const [query, setQuery] = useState(filters.search ?? '');
    const apply = (next: Record<string, string | undefined>) =>
        router.get(
            admin.users.index.url(),
            { ...filters, ...next },
            { preserveState: true, replace: true },
        );

    const ask = (message: string) => window.prompt(message)?.trim() || null;

    const changeRole = (user: UserRow, role: string) => {
        const reason = ask(
            `Why change ${user.name} to ${role}? A second super admin must approve.`,
        );

        if (reason) {
            router.patch(
                admin.users.role.url(user.id),
                { role, reason },
                { preserveScroll: true },
            );
        }
    };

    const changeStatus = (user: UserRow) => {
        const status = user.status === 'active' ? 'suspended' : 'active';
        const reason = ask(
            `Reason to ${status === 'suspended' ? 'suspend' : 'reactivate'} ${user.name} (logged):`,
        );

        if (reason) {
            router.patch(
                admin.users.status.url(user.id),
                { status, reason },
                { preserveScroll: true },
            );
        }
    };

    return (
        <>
            <Head title="Users & roles" />
            <ConsolePage>
                <PageHeader
                    eyebrow="Access"
                    title="Users & roles"
                    description="Invite staff, suspend accounts and request role changes. Granting admin or super admin always needs a second super admin."
                    actions={<CreateUser roles={roles} />}
                />
                <div className="flex flex-wrap gap-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            apply({ search: query || undefined });
                        }}
                    >
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search name or email"
                            className="h-10 w-72 rounded-md border border-input bg-transparent px-3 text-sm"
                        />
                    </form>
                    <select
                        value={filters.role ?? ''}
                        onChange={(e) =>
                            apply({ role: e.target.value || undefined })
                        }
                        className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
                    >
                        <option value="" className="bg-background">
                            All roles
                        </option>
                        {roles.map((role) => (
                            <option
                                key={role.value}
                                value={role.value}
                                className="bg-background"
                            >
                                {role.label}
                            </option>
                        ))}
                    </select>
                </div>
                <Table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Mobile</th>
                            <th>Email</th>
                            <th>2FA</th>
                            <th>Last sign-in</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.data.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    {user.name}
                                    <p className="text-xs text-muted-foreground">
                                        {user.email}
                                    </p>
                                </td>
                                <td>
                                    {canAssignRoles ? (
                                        <select
                                            value={user.role}
                                            onChange={(e) =>
                                                changeRole(user, e.target.value)
                                            }
                                            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                                            aria-label={`Role for ${user.name}`}
                                        >
                                            {roles.map((role) => (
                                                <option
                                                    key={role.value}
                                                    value={role.value}
                                                    className="bg-background"
                                                >
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <Pill tone="accent">
                                            {user.roleLabel}
                                        </Pill>
                                    )}
                                    {user.pendingRole && (
                                        <p className="mt-1 text-[11px] text-warn">
                                            Pending: {user.pendingRole}
                                        </p>
                                    )}
                                </td>
                                {[
                                    user.mobileVerified,
                                    user.emailVerified,
                                    user.mfa,
                                ].map((value, i) => (
                                    <td key={i}>
                                        {value ? (
                                            <Check className="size-4 text-ok" />
                                        ) : (
                                            <Minus className="size-4 text-muted-foreground" />
                                        )}
                                    </td>
                                ))}
                                <td className="text-xs text-muted-foreground">
                                    {dateTime(user.lastLoginAt)}
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        onClick={() => changeStatus(user)}
                                        title="Click to change"
                                    >
                                        <Pill
                                            tone={
                                                user.status === 'active'
                                                    ? 'ok'
                                                    : 'error'
                                            }
                                        >
                                            {user.status}
                                        </Pill>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                <Pagination page={users} />
            </ConsolePage>
        </>
    );
}

function CreateUser({ roles }: { roles: Props['roles'] }) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: '',
        email: '',
        mobile: '',
        role: 'processor',
        reason: '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(admin.users.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    }

    return (
        <FormDialog
            open={open}
            onOpenChange={setOpen}
            title="Invite a user"
            description="They receive an email to set their own password. Brokers are added from the Brokers page."
            trigger={
                <Button>
                    <UserPlus className="size-4" /> Invite user
                </Button>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <Field label="Full name" error={form.errors.name}>
                    <TextInput
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                    />
                </Field>
                <Field label="Email" error={form.errors.email}>
                    <TextInput
                        type="email"
                        value={form.data.email}
                        onChange={(e) => form.setData('email', e.target.value)}
                    />
                </Field>
                <Field label="Mobile (optional)" error={form.errors.mobile}>
                    <TextInput
                        value={form.data.mobile}
                        onChange={(e) => form.setData('mobile', e.target.value)}
                        placeholder="0412 345 678"
                    />
                </Field>
                <Field
                    label="Role"
                    error={form.errors.role}
                    hint="Admin and super admin are granted only after a second super admin approves."
                >
                    <Select
                        options={roles.filter((r) => r.value !== 'broker')}
                        value={form.data.role}
                        onChange={(e) => form.setData('role', e.target.value)}
                    />
                </Field>
                <Field label="Reason (logged)" error={form.errors.reason}>
                    <TextInput
                        value={form.data.reason}
                        onChange={(e) => form.setData('reason', e.target.value)}
                        placeholder="New credit analyst joining the policy team"
                    />
                </Field>
                <div className="flex justify-end">
                    <Button type="submit" disabled={form.processing}>
                        Send invite
                    </Button>
                </div>
            </form>
        </FormDialog>
    );
}

Users.layout = {
    breadcrumbs: [{ title: 'Users & roles', href: admin.users.index() }],
};
