import { Head, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { SectionCards, type DashboardStats } from '@/pages/dashboard/card-list';
import { useTranslation } from "react-i18next";
import { toast } from 'sonner';
import { CheckCheckIcon } from "lucide-react";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { dashboard } from "@/routes";

export default function Dashboard() {
    const { t } = useTranslation();
    const page = usePage();

    const props = (page.props as any) as DashboardStats;

    const {
        totalPonds,
        totalFiles,
        usedBytes,
        maxBytes,
        remainingBytes,
        expiringLinksCount,
        expiringLinks,
        activeUploadLinksCount,
        expiringUploadLinksCount,
        recentActivities,
        usedPercentage,
        showWarning,
    } = props;

    const breaccrumbs: BreadcrumbItem[] = [
        {
            title: t('dashboard:title'),
            href: dashboard().url,
        },
    ];

    const storageKey = Math.ceil(usedPercentage) >= 90 ? 'common:storage_full' : 'common:storage_almost_full';
    const almost = Math.ceil(usedPercentage) >= 90 ? '' : t('common:almost');
    const percent = Math.ceil(usedPercentage);

    return (
        <AppLayout breadcrumbs={breaccrumbs}>
            <Head title={t('dashboard:title')}/>
            <div className="flex flex-1 flex-col gap-4 p-4">
                {showWarning && (
                    <Alert
                    variant={Math.ceil(usedPercentage) >= 90 ? "destructive" : undefined}
                    className={
                        Math.ceil(usedPercentage) >= 90
                        ? "border-red-500/50 text-red-500 dark:border-red-500 [&>svg]:text-red-500"
                        : "border-amber-500/50 text-amber-500 dark:border-amber-500 [&>svg]:text-amber-500"
                    }
                    >
                    <AlertTriangle />
                    <AlertTitle>
                        {t(storageKey)}
                    </AlertTitle>
                    <AlertDescription className={Math.ceil(usedPercentage) >= 90 ? "text-red-500" : "text-amber-500"}>
                        <p>
                        {t('storage_warning', { almost, percent })}
                        </p>
                    </AlertDescription>
                    </Alert>
                )}
                
                <SectionCards
                totalPonds={totalPonds}
                totalFiles={totalFiles}
                usedBytes={usedBytes}
                remainingBytes={remainingBytes}
                expiringLinksCount={expiringLinksCount}
                expiringLinks={expiringLinks}
                activeUploadLinksCount={activeUploadLinksCount}
                expiringUploadLinksCount={expiringUploadLinksCount}
                recentActivities={recentActivities}
                maxBytes={maxBytes}
                usedPercentage={usedPercentage}
                />
            </div>
        </AppLayout>
    )



}
