import { Link } from '@inertiajs/react';
import { MegaLogo } from '@/components/mega/logo';
import { MegaOrb } from '@/components/mega/orb';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
            <div className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col">
                <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_55%,rgba(45,125,255,0.3),transparent_70%)]" />
                <Link href={home()} className="relative z-10">
                    <MegaLogo />
                </Link>
                <div className="relative z-10 flex flex-1 items-center justify-center">
                    <MegaOrb className="w-[min(340px,60%)] animate-float" />
                </div>
                <div className="relative z-10 max-w-md">
                    <p className="font-display text-4xl leading-tight">
                        Know your best lenders <em>before</em> you apply.
                    </p>
                    <p className="mt-4 text-sm text-white/60">
                        Indicative matches, explained clause by clause, and a
                        licensed broker who reviews every one.
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-center px-6 py-12 sm:px-10">
                <div className="w-full max-w-[380px] animate-rise">
                    <Link href={home()} className="mb-10 inline-flex lg:hidden">
                        <MegaLogo />
                    </Link>
                    <div className="mb-8">
                        <h1 className="font-display text-4xl leading-tight">
                            {title}
                        </h1>
                        {description && (
                            <p className="mt-2 text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
