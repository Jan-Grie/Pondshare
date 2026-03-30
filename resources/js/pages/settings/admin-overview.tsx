"use client"

import { Head } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'

import HeadingSmall from '@/components/heading-small'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import AppLayout from '@/layouts/app-layout'
import SettingsLayout from '@/layouts/settings/layout'
import { formatBytes } from '@/lib/formatBytes'
import { type BreadcrumbItem } from '@/types'
import { Users, FolderOpen, Files, HardDrive } from 'lucide-react'

interface TopUser {
    id: number
    name: string
    email: string
    used_bytes: number
    quota_bytes: number
    ponds_count: number
}

interface Props {
    stats: {
        total_users: number
        active_users: number
        total_ponds: number
        total_files: number
        total_storage_bytes: number
    }
    top_users: TopUser[]
}

export default function AdminOverview({ stats, top_users }: Props) {
    const { t } = useTranslation('settings')

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('admin_overview.breadcrumb'), href: '/settings/admin-overview' },
    ]

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('admin_overview.head_title')} />
            <SettingsLayout fullWidth>
                <div className="space-y-8">
                    <HeadingSmall
                        title={t('admin_overview.title')}
                        description={t('admin_overview.description')}
                    />

                    {/* Stat cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={<Users className="size-5 text-muted-foreground" />}
                            label={t('admin_overview.stat_total_users')}
                            value={String(stats.total_users)}
                            sub={`${stats.active_users} ${t('admin_overview.stat_active_users').toLowerCase()}`}
                        />
                        <StatCard
                            icon={<FolderOpen className="size-5 text-muted-foreground" />}
                            label={t('admin_overview.stat_total_ponds')}
                            value={String(stats.total_ponds)}
                        />
                        <StatCard
                            icon={<Files className="size-5 text-muted-foreground" />}
                            label={t('admin_overview.stat_total_files')}
                            value={String(stats.total_files)}
                        />
                        <StatCard
                            icon={<HardDrive className="size-5 text-muted-foreground" />}
                            label={t('admin_overview.stat_total_storage')}
                            value={formatBytes(stats.total_storage_bytes)}
                        />
                    </div>

                    {/* Top users */}
                    <section className="space-y-3">
                        <h3 className="text-base font-semibold">{t('admin_overview.top_users_title')}</h3>
                        <div className="overflow-hidden rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">{t('admin_overview.col_user')}</th>
                                        <th className="px-3 py-2 text-left font-medium">{t('admin_overview.col_used')}</th>
                                        <th className="px-3 py-2 text-left font-medium">{t('admin_overview.col_quota')}</th>
                                        <th className="px-3 py-2 text-left font-medium w-32">%</th>
                                        <th className="px-3 py-2 text-right font-medium">{t('admin_overview.col_ponds')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {top_users.map((user) => {
                                        const percent = user.quota_bytes > 0
                                            ? Math.min(100, Math.round((user.used_bytes / user.quota_bytes) * 100))
                                            : 0
                                        return (
                                            <tr key={user.id} className="border-t">
                                                <td className="px-3 py-2">
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </td>
                                                <td className="px-3 py-2 font-mono tabular-nums">
                                                    {formatBytes(user.used_bytes)}
                                                </td>
                                                <td className="px-3 py-2 font-mono tabular-nums text-muted-foreground">
                                                    {formatBytes(user.quota_bytes)}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={percent} className="h-1.5 flex-1" />
                                                        <span className="text-xs tabular-nums w-8 text-right">{percent}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-right">{user.ponds_count}</td>
                                            </tr>
                                        )
                                    })}
                                    {top_users.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
                                                —
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </SettingsLayout>
        </AppLayout>
    )
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    {icon}
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold tabular-nums">{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            </CardContent>
        </Card>
    )
}
