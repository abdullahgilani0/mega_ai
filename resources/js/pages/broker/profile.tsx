import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import {
    Card,
    ConsolePage,
    PageHeader,
    Pill,
    StatCard,
} from '@/components/mega/console';
import { Field, TextInput } from '@/components/mega/forms';
import { Button } from '@/components/ui/button';
import { humanize } from '@/lib/format';
import { cn } from '@/lib/utils';
import broker from '@/routes/broker';

type Profile = {
    name: string;
    business: string | null;
    licenceRef: string;
    status: string;
    languages: string[];
    skills: string[];
    loanPacks: string[];
    capacity: number;
    open: number;
    acceptanceRate: number;
    avgFirstContactMinutes: number;
    territories: { name: string; coverage: string }[];
};

export default function BrokerProfile({ profile }: { profile: Profile }) {
    const form = useForm({
        status: profile.status === 'leave' ? 'leave' : 'active',
        languages: profile.languages.join(', '),
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            languages: data.languages
                .split(',')
                .map((l) => l.trim())
                .filter(Boolean),
        }));
        form.patch(broker.profile.update.url(), { preserveScroll: true });
    }

    return (
        <>
            <Head title="My profile" />
            <ConsolePage>
                <PageHeader
                    eyebrow={profile.business ?? 'Broker'}
                    title={profile.name}
                    description={`Licence ${profile.licenceRef}. Territories, skills and capacity are managed by your admin.`}
                />
                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                        label="Open files"
                        value={`${profile.open}/${profile.capacity}`}
                    />
                    <StatCard
                        label="Acceptance rate"
                        value={`${Math.round(profile.acceptanceRate * 100)}%`}
                        tone="accent"
                    />
                    <StatCard
                        label="Avg first contact"
                        value={`${profile.avgFirstContactMinutes} min`}
                    />
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card title="Availability">
                        <form onSubmit={submit} className="space-y-5">
                            <div className="flex gap-2">
                                {[
                                    ['active', 'Taking new offers'],
                                    ['leave', 'On leave'],
                                ].map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() =>
                                            form.setData('status', value)
                                        }
                                        aria-pressed={
                                            form.data.status === value
                                        }
                                        className={cn(
                                            'flex-1 rounded-xl border p-4 text-left text-sm transition',
                                            form.data.status === value
                                                ? 'border-mega bg-mega/10'
                                                : 'border-border',
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            {profile.status === 'paused' && (
                                <p className="text-xs text-warn">
                                    An admin has paused your offers. Contact
                                    them to resume.
                                </p>
                            )}
                            <Field
                                label="Languages you speak with clients"
                                hint="Comma separated"
                                error={form.errors.languages}
                            >
                                <TextInput
                                    value={form.data.languages}
                                    onChange={(e) =>
                                        form.setData(
                                            'languages',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    Save
                                </Button>
                            </div>
                        </form>
                    </Card>
                    <Card title="What you're matched on">
                        <p className="text-xs text-muted-foreground">
                            Loan packs
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {profile.loanPacks.map((p) => (
                                <Pill key={p} tone="accent">
                                    {p}
                                </Pill>
                            ))}
                        </div>
                        <p className="mt-4 text-xs text-muted-foreground">
                            Skills
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {profile.skills.map((s) => (
                                <Pill key={s}>{humanize(s)}</Pill>
                            ))}
                        </div>
                        <p className="mt-4 text-xs text-muted-foreground">
                            Territories
                        </p>
                        <ul className="mt-1.5 space-y-1 text-sm">
                            {profile.territories.map((t) => (
                                <li key={t.name}>
                                    {t.name}{' '}
                                    <span className="text-muted-foreground">
                                        ({t.coverage})
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </ConsolePage>
        </>
    );
}

BrokerProfile.layout = {
    breadcrumbs: [{ title: 'My profile', href: broker.profile.show() }],
};
