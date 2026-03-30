import { Head } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import { CircleAlertIcon, ShieldCheckIcon, ShieldAlertIcon } from 'lucide-react'

import AppLayout from '@/layouts/app-layout'
import SettingsLayout from '@/layouts/settings/layout'
import HeadingSmall from '@/components/heading-small'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { type BreadcrumbItem } from '@/types'
import { security } from '@/routes/profile'

type LaravelDateObject = {
  date: string
  timezone_type: number
  timezone: string
}

interface ClamavInfo {
  engine_version: string
  signature_version: number
  signature_date: string | LaravelDateObject
  signature_age_days: number
}


interface Props {
  clamavEnabled: boolean
  clamav?: ClamavInfo | null
}

export default function SecuritySettings({ clamavEnabled, clamav }: Props) {
  const { t } = useTranslation('settings')

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: t('security.breadcrumb'),
      href: security().url,
    },
  ]

  const age = clamav?.signature_age_days ?? null

  const status =
    age === null
      ? 'unknown'
      : age <= 3
      ? 'ok'
      : age <= 7
      ? 'warning'
      : 'critical'

  const StatusIcon =
    status === 'ok'
      ? ShieldCheckIcon
      : status === 'warning'
      ? ShieldAlertIcon
      : ShieldAlertIcon


  const statusColorClass =
    status === 'ok'
      ? 'text-green-600 dark:text-green-500'
      : status === 'warning'
      ? 'text-orange-500 dark:text-orange-400'
      : status === 'critical'
      ? 'text-destructive'
      : 'text-muted-foreground'



  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={t('settings:security.page_title')} />

      <SettingsLayout>
        <div className="space-y-6">
          <HeadingSmall
            title={t('settings:security.page_title')}
            description={t('settings:security.page_description')}
          />

          {!clamavEnabled && (
            <Alert className="border-none bg-sky-600/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400">
              <CircleAlertIcon />
              <AlertTitle>
                {t('settings:security.clamav_disabled_title')}
              </AlertTitle>
              <AlertDescription className="text-sky-600/80 dark:text-sky-400/80">
                {t('settings:security.clamav_disabled_description')}
              </AlertDescription>
            </Alert>
          )}

          {clamavEnabled && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StatusIcon className={`h-8 w-8 ${statusColorClass}`} />
                  {t('settings:security.clamav_status_title')}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 text-sm">
                <div>
                  <strong>{t('settings:security.engine_version')}:</strong>{' '}
                  {clamav?.engine_version ?? '—'}
                </div>

                <div>
                  <strong>{t('settings:security.signature_version')}:</strong>{' '}
                  {clamav?.signature_version ?? '—'}
                </div>

                <div>
                  <strong>{t('settings:security.signature_date')}:</strong>{' '}
                  {(() => {
                    const raw = clamav?.signature_date

                    if (!raw) return '—'

                    const value =
                      typeof raw === 'string'
                        ? raw
                        : raw.date

                    const d = new Date(value)
                    return isNaN(d.getTime()) ? '—' : d.toLocaleString()
                  })()}
                </div>


                <div>
                  <strong>{t('settings:security.signature_age')}:</strong>{' '}
                  {age !== null
                    ? t('settings:security.signature_age_days', { days: age })
                    : t('settings:security.unknown')}
                </div>

                <div>
                  <strong>{t('settings:security.status')}:</strong>{' '}
                  {t(`settings:security.status_${status}`)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SettingsLayout>
    </AppLayout>
  )
}
