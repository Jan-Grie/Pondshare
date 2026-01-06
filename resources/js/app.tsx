import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { configureEcho } from '@laravel/echo-react';
import { usePage }  from '@inertiajs/react';
import i18n from './i18n';
import "@/bootstrap";

configureEcho({
    broadcaster: 'reverb',
});




let appName = import.meta.env.VITE_APP_NAME || 'Pondshare';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        const locale =
            (props.initialPage.props as any)?.auth?.user?.locale ?? 'en';
        
        const sharedAppName = (props.initialPage.props as any)?.app_name ?? (props.initialPage.props as any)?.name;
        if (sharedAppName) {
            appName = sharedAppName as string;
        }

        (async () => {
            await i18n.changeLanguage(locale);

            root.render(
                <StrictMode>
                    <App {...props} />
                </StrictMode>
            );
        })();
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
