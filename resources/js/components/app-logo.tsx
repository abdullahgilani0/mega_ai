import { usePage } from '@inertiajs/react';
import { MegaMark, MegaWordmark } from '@/components/mega/logo';

export default function AppLogo() {
    const { auth } = usePage().props;

    return (
        <>
            <MegaMark className="size-8 shrink-0" />
            <div className="ml-1 grid flex-1 text-left">
                <MegaWordmark className="h-3.5" />
                <span className="mt-1 truncate text-[10px] tracking-wide text-muted-foreground uppercase">
                    {(auth as { roleLabel?: string }).roleLabel ?? 'Console'}
                </span>
            </div>
        </>
    );
}
