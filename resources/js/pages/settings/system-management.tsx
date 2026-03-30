import { Head, router, useForm } from '@inertiajs/react'
import { Loader2, Plus, ServerCrash, Trash2, TriangleAlertIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import HeadingSmall from '@/components/heading-small'
import InputError from '@/components/input-error'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import AppLayout from '@/layouts/app-layout'
import SettingsLayout from '@/layouts/settings/layout'
import { formatBytes } from '@/lib/formatBytes'
import { type BreadcrumbItem } from '@/types'

interface Domain {
    id: number
    domain: string
}

interface FailedJob {
    id: number
    queue: string
    job: string
    failed_at: string
}

interface LinkSettings {
    force_password_for_all_links: boolean
    link_password_min_length: number
    require_expiry_for_links: boolean
    default_link_expiration_days: number
    max_links_expiration_days: number
    default_quota_gb: number
    quota_email_warning_threshold: number
}

interface Props {
    settings: {
        registration_enabled: boolean
        restrict_registration_to_domains: boolean
    }
    linkSettings: LinkSettings
    domains: Domain[]
    queue: {
        pending: number
        failed: number
        recent_failed: FailedJob[]
    }
    disk: {
        total: number | null
        free: number | null
        used_by_app: number
    }
}

export default function SystemManagement({ settings, linkSettings, domains, queue, disk }: Props) {
    const { t } = useTranslation('settings')

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('system_management.breadcrumb'), href: '/settings/system' },
    ]

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('system_management.head_title')} />
            <SettingsLayout fullWidth>
                <div className="space-y-8">
                    <HeadingSmall
                        title={t('system_management.title')}
                        description={t('system_management.description')}
                    />
                    <RegistrationSection settings={settings} />
                    <Separator />
                    <LinkSettingsSection linkSettings={linkSettings} />
                    <Separator />
                    <DomainsSection domains={domains} />
                    <Separator />
                    <QueueSection queue={queue} />
                    <Separator />
                    <DiskSection disk={disk} />
                </div>
            </SettingsLayout>
        </AppLayout>
    )
}

function RegistrationSection({ settings }: { settings: Props['settings'] }) {
    const { t } = useTranslation('settings')
    const { data, setData, patch, processing, recentlySuccessful } = useForm({
        registration_enabled: settings.registration_enabled,
        restrict_registration_to_domains: settings.restrict_registration_to_domains,
    })

    function submit(e: React.FormEvent) {
        e.preventDefault()
        patch('/settings/system')
    }

    return (
        <section className="space-y-4">
            <HeadingSmall
                title={t('system_management.registration_title')}
                description={t('system_management.registration_description')}
            />
            <form onSubmit={submit} className="space-y-4">
                <div className="flex items-center gap-3">
                    <Checkbox
                        id="registration_enabled"
                        checked={data.registration_enabled}
                        onCheckedChange={(checked) => setData('registration_enabled', !!checked)}
                    />
                    <Label htmlFor="registration_enabled">
                        {t('system_management.registration_enabled_label')}
                    </Label>
                </div>
                <div className="flex items-center gap-3">
                    <Checkbox
                        id="restrict_domains"
                        checked={data.restrict_registration_to_domains}
                        onCheckedChange={(checked) =>
                            setData('restrict_registration_to_domains', !!checked)
                        }
                    />
                    <Label htmlFor="restrict_domains">
                        {t('system_management.restrict_domains_label')}
                    </Label>
                </div>
                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={processing}>
                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('system_management.save')}
                    </Button>
                    {recentlySuccessful && (
                        <span className="text-sm text-muted-foreground">
                            {t('system_management.saved')}
                        </span>
                    )}
                </div>
            </form>
        </section>
    )
}

function DomainsSection({ domains }: { domains: Domain[] }) {
    const { t } = useTranslation('settings')
    const [deleteTarget, setDeleteTarget] = useState<Domain | null>(null)
    const { data, setData, post, processing, errors, reset } = useForm({ domain: '' })

    function addDomain(e: React.FormEvent) {
        e.preventDefault()
        post('/settings/system/domains', {
            onSuccess: () => reset(),
        })
    }

    function confirmDelete(domain: Domain) {
        setDeleteTarget(domain)
    }

    function deleteDomain() {
        if (!deleteTarget) return
        router.delete(`/settings/system/domains/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        })
    }

    return (
        <section className="space-y-4">
            <HeadingSmall
                title={t('system_management.domains_title')}
                description={t('system_management.domains_description')}
            />
            <form onSubmit={addDomain} className="flex max-w-sm gap-2">
                <div className="flex-1">
                    <Input
                        value={data.domain}
                        onChange={(e) => setData('domain', e.target.value)}
                        placeholder={t('system_management.domains_add_placeholder')}
                    />
                    <InputError message={errors.domain} className="mt-1" />
                </div>
                <Button type="submit" disabled={processing || !data.domain.trim()}>
                    <Plus className="mr-1 h-4 w-4" />
                    {t('system_management.domains_add_button')}
                </Button>
            </form>

            {domains.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    {t('system_management.domains_empty')}
                </p>
            ) : (
                <div className="flex max-w-sm flex-col gap-2">
                    {domains.map((domain) => (
                        <div
                            key={domain.id}
                            className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                            <span className="text-sm font-mono">{domain.domain}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                title={t('system_management.domains_delete_title')}
                                onClick={() => confirmDelete(domain)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader className="items-center text-center">
                        <div className="bg-destructive/20 dark:bg-destructive/35 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
                            <TriangleAlertIcon className="text-destructive size-6" />
                        </div>
                        <AlertDialogTitle>
                            {t('system_management.domains_delete_dialog_title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('system_management.domains_delete_dialog_description', {
                                domain: deleteTarget?.domain ?? '',
                            })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {t('system_management.domains_delete_cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive dark:bg-destructive/60 hover:bg-destructive text-white"
                            onClick={deleteDomain}
                        >
                            {t('system_management.domains_delete_confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    )
}

function QueueSection({ queue }: { queue: Props['queue'] }) {
    const { t } = useTranslation('settings')
    const [showClearDialog, setShowClearDialog] = useState(false)

    function clearFailed() {
        router.delete('/settings/system/failed-jobs', {
            onSuccess: () => setShowClearDialog(false),
        })
    }

    return (
        <section className="space-y-4">
            <HeadingSmall
                title={t('system_management.queue_title')}
                description={t('system_management.queue_description')}
            />
            <div className="flex flex-wrap gap-4">
                <Card className="min-w-[140px]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('system_management.queue_pending')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-2xl font-bold">{queue.pending}</span>
                    </CardContent>
                </Card>
                <Card className="min-w-[140px]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {t('system_management.queue_failed')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-end justify-between gap-4">
                        <span className="text-2xl font-bold">{queue.failed}</span>
                        {queue.failed > 0 && (
                            <Badge variant="destructive">{queue.failed}</Badge>
                        )}
                    </CardContent>
                </Card>
            </div>

            {queue.failed > 0 && (
                <>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">
                            {t('system_management.queue_recent_failed')}
                        </p>
                        <div className="max-w-2xl overflow-hidden rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium">
                                            {t('system_management.queue_job')}
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium">
                                            {t('system_management.queue_failed_at')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {queue.recent_failed.map((job) => (
                                        <tr key={job.id} className="border-t">
                                            <td className="px-3 py-2 font-mono text-xs">
                                                {job.job}
                                            </td>
                                            <td className="px-3 py-2 text-muted-foreground">
                                                {new Date(job.failed_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <Button
                        variant="destructive"
                        onClick={() => setShowClearDialog(true)}
                    >
                        <ServerCrash className="mr-2 h-4 w-4" />
                        {t('system_management.queue_clear_failed')}
                    </Button>
                </>
            )}

            {queue.failed === 0 && (
                <p className="text-sm text-muted-foreground">
                    {t('system_management.queue_no_failed')}
                </p>
            )}

            <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader className="items-center text-center">
                        <div className="bg-destructive/20 dark:bg-destructive/35 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
                            <TriangleAlertIcon className="text-destructive size-6" />
                        </div>
                        <AlertDialogTitle>
                            {t('system_management.queue_clear_failed_dialog_title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('system_management.queue_clear_failed_dialog_description')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {t('system_management.queue_clear_failed_cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive dark:bg-destructive/60 hover:bg-destructive text-white"
                            onClick={clearFailed}
                        >
                            {t('system_management.queue_clear_failed_confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    )
}

function DiskSection({ disk }: { disk: Props['disk'] }) {
    const { t } = useTranslation('settings')

    const total = disk.total ?? 0
    const free = disk.free ?? 0
    const usedByApp = disk.used_by_app ?? 0
    const otherUsed = total > 0 ? Math.max(0, total - free - usedByApp) : 0

    const toPercent = (v: number) => (total > 0 ? Math.round((v / total) * 1000) / 10 : 0)

    return (
        <section className="space-y-4">
            <HeadingSmall
                title={t('system_management.disk_title')}
                description={t('system_management.disk_description')}
            />

            {disk.total === null ? (
                <p className="text-sm text-muted-foreground">
                    {t('system_management.disk_unknown')}
                </p>
            ) : (
                <div className="flex flex-col gap-2">
                    <DiskRow
                        label={t('system_management.disk_used_by_app')}
                        value={formatBytes(usedByApp)}
                        percent={toPercent(usedByApp)}
                    />
                    <DiskRow
                        label={t('system_management.disk_other_used')}
                        value={formatBytes(otherUsed)}
                        percent={toPercent(otherUsed)}
                    />
                    <DiskRow
                        label={t('system_management.disk_free')}
                        value={formatBytes(free)}
                        percent={toPercent(free)}
                    />
                    <div className="border-t pt-3 mt-1">
                        <div className="flex items-baseline justify-between text-sm">
                            <span className="text-muted-foreground">
                                {t('system_management.disk_total')}
                            </span>
                            <span className="font-semibold">{formatBytes(disk.total!)}</span>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

function DiskRow({ label, value, percent }: { label: string; value: string; percent: number }) {
    return (
        <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono font-medium">
                {value}
                <span className="ml-2 text-xs text-muted-foreground">{percent.toFixed(1)}%</span>
            </span>
        </div>
    )
}

function LinkSettingsSection({ linkSettings }: { linkSettings: LinkSettings }) {
    const { t } = useTranslation('settings')
    const { data, setData, patch, processing, recentlySuccessful } = useForm({
        force_password_for_all_links: linkSettings.force_password_for_all_links,
        link_password_min_length: linkSettings.link_password_min_length,
        require_expiry_for_links: linkSettings.require_expiry_for_links,
        default_link_expiration_days: linkSettings.default_link_expiration_days,
        max_links_expiration_days: linkSettings.max_links_expiration_days,
        default_quota_gb: linkSettings.default_quota_gb,
        quota_email_warning_threshold: linkSettings.quota_email_warning_threshold,
    })

    function submit(e: React.FormEvent) {
        e.preventDefault()
        patch('/settings/system/link-settings')
    }

    return (
        <section className="space-y-4">
            <HeadingSmall
                title={t('system_management.link_settings_title')}
                description={t('system_management.link_settings_description')}
            />
            <form onSubmit={submit} className="space-y-4 max-w-lg">
                <div className="flex items-center gap-3">
                    <Checkbox
                        id="force_password"
                        checked={data.force_password_for_all_links}
                        onCheckedChange={(checked) => setData('force_password_for_all_links', !!checked)}
                    />
                    <Label htmlFor="force_password">
                        {t('system_management.link_force_password_label')}
                    </Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="min_password_length">
                            {t('system_management.link_password_min_length_label')}
                        </Label>
                        <Input
                            id="min_password_length"
                            type="number"
                            min={4}
                            max={64}
                            value={data.link_password_min_length}
                            onChange={(e) => setData('link_password_min_length', parseInt(e.target.value) || 4)}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="quota_warning">
                            {t('system_management.link_quota_warning_label')}
                        </Label>
                        <Input
                            id="quota_warning"
                            type="number"
                            min={1}
                            max={100}
                            value={data.quota_email_warning_threshold}
                            onChange={(e) => setData('quota_email_warning_threshold', parseInt(e.target.value) || 80)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Checkbox
                        id="require_expiry"
                        checked={data.require_expiry_for_links}
                        onCheckedChange={(checked) => setData('require_expiry_for_links', !!checked)}
                    />
                    <Label htmlFor="require_expiry">
                        {t('system_management.link_require_expiry_label')}
                    </Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="default_expiry">
                            {t('system_management.link_default_expiry_label')}
                        </Label>
                        <Input
                            id="default_expiry"
                            type="number"
                            min={1}
                            max={3650}
                            value={data.default_link_expiration_days}
                            onChange={(e) => setData('default_link_expiration_days', parseInt(e.target.value) || 30)}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="max_expiry">
                            {t('system_management.link_max_expiry_label')}
                        </Label>
                        <Input
                            id="max_expiry"
                            type="number"
                            min={1}
                            max={3650}
                            value={data.max_links_expiration_days}
                            onChange={(e) => setData('max_links_expiration_days', parseInt(e.target.value) || 365)}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label htmlFor="default_quota">
                        {t('system_management.link_default_quota_label')}
                    </Label>
                    <Input
                        id="default_quota"
                        type="number"
                        min={0}
                        step={0.5}
                        value={data.default_quota_gb}
                        onChange={(e) => setData('default_quota_gb', parseFloat(e.target.value) || 0)}
                    />
                </div>

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={processing}>
                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('system_management.link_save')}
                    </Button>
                    {recentlySuccessful && (
                        <span className="text-sm text-muted-foreground">
                            {t('system_management.link_saved')}
                        </span>
                    )}
                </div>
            </form>
        </section>
    )
}
