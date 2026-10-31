import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const control =
    'h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-mega';

export function Field({
    label,
    error,
    hint,
    children,
    className,
}: {
    label: string;
    error?: string;
    hint?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <label className={cn('grid gap-1.5', className)}>
            <span className="text-xs font-medium text-muted-foreground">
                {label}
            </span>
            {children}
            {hint && (
                <span className="text-[11px] text-muted-foreground">
                    {hint}
                </span>
            )}
            <InputError message={error} />
        </label>
    );
}

export function TextInput(props: React.ComponentProps<'input'>) {
    return <input {...props} className={cn(control, props.className)} />;
}

export function TextArea(props: React.ComponentProps<'textarea'>) {
    return (
        <textarea
            {...props}
            className={cn(
                'min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-mega',
                props.className,
            )}
        />
    );
}

export function Select({
    options,
    ...props
}: React.ComponentProps<'select'> & {
    options: { value: string; label: string }[];
}) {
    return (
        <select {...props} className={cn(control, props.className)}>
            {options.map((option) => (
                <option
                    key={option.value}
                    value={option.value}
                    className="bg-background"
                >
                    {option.label}
                </option>
            ))}
        </select>
    );
}

export function CheckboxGroup({
    options,
    value,
    onChange,
}: {
    options: { value: string; label: string }[];
    value: string[];
    onChange: (value: string[]) => void;
}) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {options.map((option) => {
                const checked = value.includes(option.value);

                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={checked}
                        onClick={() =>
                            onChange(
                                checked
                                    ? value.filter((v) => v !== option.value)
                                    : [...value, option.value],
                            )
                        }
                        className={cn(
                            'rounded-full border px-3 py-1 text-xs transition',
                            checked
                                ? 'border-mega bg-mega/15 text-foreground'
                                : 'border-border text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

export function FormDialog({
    trigger,
    title,
    description,
    open,
    onOpenChange,
    children,
    wide = false,
}: {
    trigger: ReactNode;
    title: string;
    description?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
    wide?: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent
                className={cn(
                    'max-h-[90vh] overflow-y-auto',
                    wide && 'sm:max-w-2xl',
                )}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}

export function SubmitRow({
    processing,
    label,
    variant = 'default',
}: {
    processing: boolean;
    label: string;
    variant?: 'default' | 'destructive';
}) {
    return (
        <div className="flex justify-end pt-2">
            <Button type="submit" disabled={processing} variant={variant}>
                {label}
            </Button>
        </div>
    );
}
