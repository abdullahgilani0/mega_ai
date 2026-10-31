import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, Banknote, Briefcase, Car, Home } from 'lucide-react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { StepContainer, StepHeading } from '@/components/mega/journey';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import apply from '@/routes/apply';

type Option = { value: string; label: string };

type Props = {
    loanPacks: (Option & { purposes: Option[] })[];
    states: string[];
    employmentTypes: Option[];
};

const ICONS = {
    home: Home,
    asset: Car,
    personal: Banknote,
    business: Briefcase,
};

export default function Start({ loanPacks, states, employmentTypes }: Props) {
    const form = useForm({
        loan_pack: 'home',
        amount: '',
        purpose: '',
        state: 'NSW',
        postcode: '',
        employment_type: 'payg',
        is_joint: false,
    });

    const purposes =
        loanPacks.find((pack) => pack.value === form.data.loan_pack)
            ?.purposes ?? [];

    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            amount: Number(String(data.amount).replace(/[^\d]/g, '')),
        }));
        form.post(apply.store.url());
    }

    return (
        <>
            <Head title="Get started" />
            <StepContainer>
                <StepHeading
                    eyebrow="Get started"
                    title="What are we finding for you?"
                    description="Six quick answers. You will see which lenders typically fit before the detailed steps."
                />

                <form onSubmit={submit} className="space-y-10">
                    <fieldset>
                        <legend className="mb-3 text-sm font-medium">
                            Loan type
                        </legend>
                        <div className="grid grid-cols-2 gap-3">
                            {loanPacks.map((pack) => {
                                const Icon =
                                    ICONS[pack.value as keyof typeof ICONS];
                                const active =
                                    form.data.loan_pack === pack.value;

                                return (
                                    <button
                                        type="button"
                                        key={pack.value}
                                        onClick={() => {
                                            form.setData((data) => ({
                                                ...data,
                                                loan_pack: pack.value,
                                                purpose: '',
                                            }));
                                        }}
                                        aria-pressed={active}
                                        className={cn(
                                            'flex min-h-24 flex-col justify-between rounded-xl border p-4 text-left transition',
                                            active
                                                ? 'border-mega bg-mega/10 shadow-[0_0_0_1px_var(--mega-accent)]'
                                                : 'border-border hover:border-foreground/30',
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                'size-5',
                                                active
                                                    ? 'text-mega-bright'
                                                    : 'text-muted-foreground',
                                            )}
                                        />
                                        <span className="mt-4 font-medium">
                                            {pack.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    <div className="grid gap-2">
                        <Label htmlFor="amount">How much do you need?</Label>
                        <div className="relative">
                            <span className="absolute top-1/2 left-0 -translate-y-1/2 font-display text-3xl text-muted-foreground">
                                $
                            </span>
                            <input
                                id="amount"
                                inputMode="numeric"
                                autoFocus
                                value={form.data.amount}
                                onChange={(e) => {
                                    const digits = e.target.value.replace(
                                        /[^\d]/g,
                                        '',
                                    );
                                    form.setData(
                                        'amount',
                                        digits
                                            ? Number(digits).toLocaleString(
                                                  'en-AU',
                                              )
                                            : '',
                                    );
                                }}
                                placeholder="650,000"
                                className="num w-full border-0 border-b border-input bg-transparent py-3 pl-8 text-3xl outline-none placeholder:text-muted-foreground/40 focus:border-mega"
                            />
                        </div>
                        <InputError message={form.errors.amount} />
                    </div>

                    <fieldset>
                        <legend className="mb-3 text-sm font-medium">
                            What is it for?
                        </legend>
                        <ChipGroup
                            options={purposes}
                            value={form.data.purpose}
                            onChange={(value) => form.setData('purpose', value)}
                        />
                        <InputError
                            message={form.errors.purpose}
                            className="mt-2"
                        />
                    </fieldset>

                    <div className="grid grid-cols-[1fr_1.4fr] gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="state">State</Label>
                            <select
                                id="state"
                                value={form.data.state}
                                onChange={(e) =>
                                    form.setData('state', e.target.value)
                                }
                                className="h-11 rounded-md border border-input bg-transparent px-3 text-sm"
                            >
                                {states.map((state) => (
                                    <option
                                        key={state}
                                        value={state}
                                        className="bg-background"
                                    >
                                        {state}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="postcode">Postcode</Label>
                            <Input
                                id="postcode"
                                inputMode="numeric"
                                maxLength={4}
                                value={form.data.postcode}
                                onChange={(e) =>
                                    form.setData(
                                        'postcode',
                                        e.target.value.replace(/\D/g, ''),
                                    )
                                }
                                placeholder="2150"
                                className="num h-11"
                            />
                            <InputError message={form.errors.postcode} />
                        </div>
                    </div>

                    <fieldset>
                        <legend className="mb-3 text-sm font-medium">
                            How do you earn your income?
                        </legend>
                        <ChipGroup
                            options={employmentTypes}
                            value={form.data.employment_type}
                            onChange={(value) =>
                                form.setData('employment_type', value)
                            }
                        />
                    </fieldset>

                    <fieldset>
                        <legend className="mb-3 text-sm font-medium">
                            Applying
                        </legend>
                        <ChipGroup
                            options={[
                                { value: 'single', label: 'On my own' },
                                { value: 'joint', label: 'With someone else' },
                            ]}
                            value={form.data.is_joint ? 'joint' : 'single'}
                            onChange={(value) =>
                                form.setData('is_joint', value === 'joint')
                            }
                        />
                    </fieldset>

                    <Button
                        type="submit"
                        size="lg"
                        className="h-12 w-full rounded-full text-[15px] shadow-[0_8px_30px_-8px_var(--mega-accent)]"
                        disabled={form.processing}
                    >
                        {form.processing && <Spinner />}
                        Continue
                        <ArrowRight className="size-4" />
                    </Button>
                </form>
            </StepContainer>
        </>
    );
}

export function ChipGroup({
    options,
    value,
    onChange,
}: {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((option) => (
                <button
                    type="button"
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    aria-pressed={value === option.value}
                    className={cn(
                        'min-h-11 rounded-full border px-4 text-sm transition',
                        value === option.value
                            ? 'border-mega bg-mega/15 text-foreground'
                            : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
