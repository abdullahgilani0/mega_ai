import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import BorrowerLayout from '@/layouts/borrower-layout';
import JourneyLayout from '@/layouts/journey-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'MEGA';

void createInertiaApp({
    title: (title) => (title ? `${title} · ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'journey/identity-handoff':
            case name.startsWith('documents/'):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('journey/'):
                return JourneyLayout;
            case name.startsWith('borrower/'):
                return BorrowerLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#2D7DFF',
    },
});

// This will set light / dark mode on load...
initializeTheme();
