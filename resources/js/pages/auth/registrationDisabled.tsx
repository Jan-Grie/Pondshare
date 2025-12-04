import { Head } from '@inertiajs/react';
import AuthLayout from '@/layouts/auth-layout';
import { Button } from '@/components/ui/button';
import { Lock, ShieldMinus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PasswordChangeNotice() {
  const { t } = useTranslation();

  return (
    <AuthLayout title="" description="">
      <Head title={t('auth:registration.disabled_title')} />
      <div className="w-full space-y-6">
        <div className="space-y-2 text-center">
          <ShieldMinus className="mx-auto h-12 w-12 text-destructive -mt-15" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('auth:registration.disabled_title')}
          </h1>
          <p className="text-sm text-muted-foreground ">
            {t('auth:registration.disabled_message')}
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
      
      
