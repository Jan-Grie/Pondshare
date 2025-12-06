// resources/js/pages/dashboard/card-list.tsx

import clsx from 'clsx';
import React from 'react';
import { TrendingUpIcon, UploadIcon, ClockIcon, FilesIcon, EllipsisVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardDescription,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/formatBytes'
import { Link as LinkIcon, HardDrive, FolderOpen, ClockAlert, FolderUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface RecentActivity {
  icon: 'upload' | 'share' | 'external';
  description: string;
  when: string;
}

export interface DashboardStats {
  totalPonds: number;
  totalFiles: number;
  maxBytes: number;
  usedBytes: number;
  remainingBytes: number;
  expiringLinksCount: number;
  expiringLinks: {
    id: number;
    pondID: number;
    pondName: string;
    type: string;
    name: string;
    expires_at: string;
  }[];
  activeUploadLinksCount: number;
  expiringUploadLinksCount: number;
  recentActivities: RecentActivity[];
  usedPercentage: number;
  showWarning?: boolean;
}

interface SectionCardsProps extends DashboardStats {}

export function SectionCards({
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
}: SectionCardsProps) {

  const { t, i18n } = useTranslation('dashboard');

  const extendLink = (id: number, days: number) => {
    // TODO: Axios-Call an deinen Endpoint, z. B.:
    // axios.post(`/links/${id}/extend`, { days })
    console.log("Extend link", id, "by", days, "days");
  };


  const usedPercent =
    remainingBytes + usedBytes > 0
      ? Math.round((usedBytes / maxBytes) * 100)
      : 0;

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 px-4 lg:px-6">

        {/* Speicherkarte */}
        <Card className="@container/card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription className="flex items-center gap-2">
                <HardDrive className="size-5 text-muted-foreground" />
                {t('used_space_heading')}
              </CardDescription>

              <Badge
                className={clsx(
                  "rounded-lg text-white text-xs",
                  usedPercent < 80
                    ? "bg-green-500"
                    : usedPercent < 85
                    ? "bg-yellow-500"
                    : usedPercent < 90
                    ? "bg-amber-500"
                    : usedPercent < 100
                    ? "bg-red-500"
                    : "bg-red-700"
                )}
              >
                {usedPercent}% {t('used')}
              </Badge>
            </div>

            <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums mt-2">
              {formatBytes(usedBytes)} / {formatBytes(maxBytes)}
            </CardTitle>
          </CardHeader>


          <CardFooter className="flex-col items-start gap-1 text-sm">
            {usedPercent < 80 && (
              <div className="flex items-center gap-2 font-medium text-green-600 dark:text-green-400">
                {t('plenty_of_space')} <TrendingUpIcon className="size-4" />
              </div>
            )}

            {usedPercent >= 80 && usedPercent < 85 && (
              <div className="flex items-center gap-2 font-medium text-yellow-600 dark:text-yellow-400">
                {t('more_than_half_occupied')} <ClockIcon className="size-4" />
              </div>
            )}

            {usedPercent >= 85 && usedPercent < 90 && (
              <div className="flex items-center gap-2 font-medium text-amber-600 dark:text-amber-400">
                {t('slowly_getting_tight')} <ClockIcon className="size-4" />
              </div>
            )}

            {usedPercent >= 90 && usedPercent < 100 && (
              <div className="flex items-center gap-2 font-medium text-red-600 dark:text-red-400">
                {t('soon_no_more_storage_space')} <ClockIcon className="size-4" />
              </div>
            )}

            {usedPercent >= 100 && (
              <div className="flex items-center gap-2 font-medium text-red-700 dark:text-red-500">
                {t('no_storage_space_available')}
                <ClockIcon className="size-4 animate-pulse" />
              </div>
            )}
          </CardFooter>
        </Card>

        {/* Anzahl Ponds */}
        <Card className="@container/card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription className="flex items-center gap-2">
                <FolderOpen className="size-5 text-muted-foreground" />
                {t('your_ponds')}
              </CardDescription>

              <Badge
                className={`rounded-lg text-white text-xs flex items-center gap-1 ${
                  totalPonds > 0 ? 'bg-blue-500' : 'bg-gray-500'
                }`}
              >
                <UploadIcon className="size-3" />
                {totalPonds > 0 ? t("active") : t("inactive")}
              </Badge>
            </div>

            <CardTitle className="@[250px]/card:text-3xl text-2xl tabular-nums">
              {totalPonds > 0
                ? t('count_your_ponds', { count: totalPonds })
                : t('no_ponds')}
            </CardTitle>
          </CardHeader>


          <CardFooter className="flex-col items-start gap-1 text-sm">
            {totalPonds > 0 ? (
              <div className="flex items-center gap-2 font-medium">
                {t('total_ponds', { count: totalPonds })}
              </div>
            ) : (
              <div className="text-muted-foreground">
                {t('you_have_not_created_any_ponds_yet')}
              </div>
            )}
          </CardFooter>
        </Card>

        {/* Ablaufende Links */}
        <Card className="@container/card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription className="flex items-center gap-2">
                <ClockAlert className="size-5 text-muted-foreground" />
                {t('expiring_shared_links')}
              </CardDescription>

              <Badge
                className={`
                  rounded-lg text-white text-xs flex items-center gap-1
                  ${
                    expiringLinksCount === 0
                      ? 'bg-green-500'
                      : expiringLinksCount < 5
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }
                `}
              >
                <ClockIcon className="size-3" />

                {expiringLinksCount === 0
                  ? t('everything_valid')
                  : expiringLinksCount < 5
                  ? t('expiring_soon')
                  : t('expires_today')}
              </Badge>
            </div>

            <CardTitle className="@[250px]/card:text-3xl text-2xl tabular-nums">
              {t('count_links', { count: expiringLinksCount })}
            </CardTitle>
          </CardHeader>


          <CardFooter className="text-sm">
            {expiringLinksCount === 0
              ? t('all_links_valid')
              : t('links_expiring_soon', { count: expiringLinksCount })}
          </CardFooter>
        </Card>

        {/* Externe Upload Links */}
        <Card className="@container/card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription className="flex items-center gap-2">
                <FolderUp className="size-5 text-muted-foreground" />
                {t("external_upload_links")}
              </CardDescription>

              <Badge
                className={`
                  rounded-lg text-white text-xs flex items-center gap-1
                  ${activeUploadLinksCount > 0 ? 'bg-purple-500' : 'bg-gray-500'}
                `}
              >
                <FilesIcon className="size-3" />

                {activeUploadLinksCount > 0
                  ? t("active")
                  : t("inactive")}
              </Badge>
            </div>

            <CardTitle className="@[250px]/card:text-3xl text-2xl tabular-nums">
              {activeUploadLinksCount > 0
                ? `${activeUploadLinksCount} ${t("active")}`
                : `0 ${t("active")}`}
            </CardTitle>
          </CardHeader>


          <CardFooter className="flex-col items-start gap-1 text-sm">
            {activeUploadLinksCount > 0 ? (
              <div className="flex items-center gap-2 font-medium">
                {activeUploadLinksCount} Link(s) aktiv
              </div>
            ) : (
              <div className="text-muted-foreground">
                {t("there_are_currently_no_active_external_upload_links")}
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Liste ablaufender Links */}
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6">
<Card>
  <CardHeader>
    <CardTitle>{t("dashboard:expiring_links_heading")}</CardTitle>
  </CardHeader>

  <CardContent>
    {expiringLinksCount > 0 ? (
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("dashboard:name")}</TableHead>
              <TableHead>{t("dashboard:type")}</TableHead>
              <TableHead>{t("dashboard:pond")}</TableHead>
              <TableHead>{t("dashboard:expires_at")}</TableHead>
              <TableHead className="text-right">{t("dashboard:actions")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {expiringLinks.map((link) => (
              <TableRow key={link.id}>
                <TableCell className="font-medium">{link.name}</TableCell>

                <TableCell>
                  {link.type === "share"
                    ? t("dashboard:type_share")
                    : t("dashboard:type_upload")}
                </TableCell>

                <TableCell>{link.pondName}</TableCell>

                <TableCell className="tabular-nums text-muted-foreground">
                  {new Date(link.expires_at).toLocaleString(i18n.language, {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <EllipsisVertical />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        {t("dashboard:extend_link")}
                      </DropdownMenuLabel>

                      <DropdownMenuItem onClick={() => extendLink(link.id, 1)}>
                        +1 {t("dashboard:day")}
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => extendLink(link.id, 7)}>
                        +7 {t("dashboard:days")}
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => extendLink(link.id, 14)}>
                        +14 {t("dashboard:days")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">
        {t("dashboard:no_links_expiring")}
      </p>
    )}
  </CardContent>
</Card>



      </div>
    </section>
  );
}
