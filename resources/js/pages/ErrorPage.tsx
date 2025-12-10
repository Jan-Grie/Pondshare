import { Head, Link } from '@inertiajs/react';
import {
    Home,
    ArrowLeft,
    AlertTriangle,
    SearchX,
    ShieldAlert,
    ServerCrash,
    Construction,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ status }: { status: number }) {
    const { t } = useTranslation();
    const statusKey = String(status);

    const title = t(`errors:${statusKey}.title`);
    const description = t(`errors:${statusKey}.description`);
    const Icon =
        {
            '404': SearchX,
            '403': ShieldAlert,
            '500': ServerCrash,
            '503': Construction,
        }[statusKey] || AlertTriangle;

    const errorCode = status.toString();

    return (
        <>
            <Head title={title || 'Error'} />
            <div className="relative flex min-h-screen w-full flex-col bg-background">
                {/* Visual Pattern Background */}
                <div 
                    className="pointer-events-none absolute inset-0 z-0 text-foreground opacity-[0.04] dark:opacity-[0.09]"
                    style={{
                        backgroundImage: `
                            repeating-linear-gradient(0deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 40px),
                            repeating-linear-gradient(90deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 40px)
                        `,
                    }}
                />

                {/* Main Content */}
                <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
                    <div className="w-full max-w-xl text-center">
                        {/* Error Icon */}
                        <div className="mb-8 flex justify-center">
                            <div className="flex size-20 items-center justify-center rounded-xl border border-border bg-muted/50">
                                <Icon className="size-10 text-muted-foreground" />
                            </div>
                        </div>

                        {/* Error Code */}
                        <h1
                            className="mb-4 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-8xl font-bold leading-none text-transparent"
                            style={{
                                backgroundImage: 'linear-gradient(135deg, var(--foreground) 0%, var(--muted-foreground) 100%)',
                            }}
                        >
                            {errorCode}
                        </h1>

                        {/* Title */}
                        <h2 className="mb-3 text-3xl font-semibold text-foreground">
                            {title || 'Error'}
                        </h2>

                        {/* Description */}
                        <p className="mb-8 text-base leading-relaxed text-muted-foreground">
                            {description}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Button asChild size="lg">
                                <Link href="/">
                                    <Home className="size-4" />
                                    {t('common:actions.home')}
                                </Link>
                            </Button>
                            <Button
                                variant="secondary"
                                size="lg"
                                onClick={() => window.history.back()}
                            >
                                <ArrowLeft className="size-4" />
                                {t('common:actions.back')}
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}