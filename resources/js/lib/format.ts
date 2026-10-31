const currency = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
});

export function money(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    return currency.format(Number(value));
}

export function rate(value: number | null | undefined): string {
    return value === null || value === undefined
        ? '—'
        : `${Number(value).toFixed(2)}%`;
}

export function dateTime(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }

    return new Date(iso).toLocaleString('en-AU', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function date(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }

    return new Date(iso).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export function humanize(value: string): string {
    const text = value.replace(/[_.]/g, ' ');

    return text.charAt(0).toUpperCase() + text.slice(1);
}
