"use client";

import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, FolderIcon, FileIcon, LinkIcon, UploadIcon, DownloadIcon, AlertTriangle } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import clsx from 'clsx';
import React from 'react';
import { formatBytes } from '@/lib/formatBytes'
import { useTranslation } from "react-i18next";
import { BreadcrumbItem } from '@/types';
import { usage } from '@/routes';

export default function UsageTab() {
    const { t } = useTranslation();
  
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t("sidebar:usage_title"), href: usage().url },
    ]

  
  const {
    usedBytes,
    maxBytes,
    fileCount,
    downloadCount,
    averageFileSize,
    largestFile,
    lastUpload,
    topFileType,
    activeLinks,
    downloadChartData,
    usedPercentage,
    showWarning,
    pondNames,
  } = usePage<any>().props;

  const percentUsed = (usedBytes / maxBytes) * 100;
  const remainingBytes = maxBytes - usedBytes;

    const getProgressColor = () => {
        const p = percentUsed;

        if (p >= 100) return 'bg-red-700';
        if (p >= 90) return 'bg-red-500';
        if (p >= 85) return 'bg-amber-500';
        if (p >= 80) return 'bg-yellow-500';
        return 'bg-green-500';
    };
    const getBadgeColor = () => {
        const p = percentUsed;

        if (p >= 100) return 'bg-red-700 text-white';
        if (p >= 90) return 'bg-red-500 text-white';
        if (p >= 85) return 'bg-amber-500 text-white';
        if (p >= 80) return 'bg-yellow-500 text-white';
        return 'bg-green-500 text-white';
    };

  const chartConfig: Record<string, { label: string; color: string }> = {};
  pondNames.forEach((pond: string, idx: number) => {
    const colorIndex = (idx % 5) + 1;
    chartConfig[pond] = {
      label: pond,
      color: `var(--chart-${colorIndex})`,
    };
  });

    const storageKey = Math.ceil(usedPercentage) >= 100 ? 'common:storage_full' : 'common:storage_almost_full';
    const almost = Math.ceil(usedPercentage) >= 100 ? '' : t('common:almost');
    const percent = Math.ceil(usedPercentage);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t("dashboard:usage.title")} />
      <div className="flex flex-1 flex-col gap-4 p-4">

        <section className="space-y-6 px-4 lg:px-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">
              {t("dashboard:usage.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("dashboard:usage.subtitle", {
                used: formatBytes(usedBytes),
                max: formatBytes(maxBytes),
              })}
            </p>
          </div>

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

          <Card>
            <CardHeader className="relative">
              <CardTitle>{t("dashboard:usage.title")}</CardTitle>
              <div className="absolute right-4 top-4">
                <Badge className={clsx('rounded-lg text-xs', getBadgeColor())}>
                  {t("dashboard:usage.progress.used_percent", {
                    percent: percentUsed.toFixed(0)
                  })}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="mb-2 text-sm text-muted-foreground">
                {formatBytes(usedBytes)} {t("common:used")} – {formatBytes(maxBytes)} {t("common:used")}
              </div>

              <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={clsx('h-full transition-all', getProgressColor())}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard:usage.cards.total_files")}
                </CardTitle>
                <FolderIcon className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fileCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard:usage.cards.total_downloads")}
                </CardTitle>
                <DownloadIcon className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{downloadCount}</div>
                <div className="text-xs text-muted-foreground">
                  {t("dashboard:usage.stats.downloads_description")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard:usage.cards.average_file_size")}
                </CardTitle>
                <FileIcon className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(averageFileSize)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard:usage.cards.largest_file")}
                </CardTitle>
                <FileIcon className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-sm truncate max-w-xs">{largestFile.name}</div>
                <div className="text-muted-foreground text-xs">
                  {formatBytes(largestFile.size)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard:usage.cards.last_upload")}
                </CardTitle>
                <UploadIcon className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-sm truncate max-w-xs">{lastUpload.name}</div>
                <div className="text-muted-foreground text-xs">
                  {new Date(lastUpload.createdAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard:usage.cards.top_file_type")}
                </CardTitle>
                <FileIcon className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{topFileType}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("dashboard:usage.cards.active_links")}
                </CardTitle>
                <LinkIcon className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeLinks}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("dashboard:usage.charts.downloads_per_day")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer className="aspect-[8/3] h-full w-full" config={chartConfig}>
                <LineChart data={downloadChartData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent className="w-[150px]" nameKey="date" />}
                  />
                  {pondNames.map((pond: string, idx: number) => {
                    const colorIndex = (idx % 5) + 1;
                    return (
                      <Line
                        key={pond}
                        type="monotone"
                        dataKey={pond}
                        stroke={`var(--chart-${colorIndex})`}
                        strokeWidth={2}
                        dot={false}
                      />
                    );
                  })}
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

        </section>
      </div>
    </AppLayout>
  );
}
