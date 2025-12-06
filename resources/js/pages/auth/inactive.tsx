import { Head } from '@inertiajs/react';
import AuthLayout from '@/layouts/auth-layout';
import { Button } from '@/components/ui/button';
import { Lock, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PasswordChangeNotice() {
  const { t } = useTranslation();
  return (
    <AuthLayout title="" description="">
      <Head title={t("auth:inactiveAccount.title")} />
      <div className="w-full space-y-6">
        <div className="space-y-2 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-destructive -mt-15" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("auth:inactiveAccount.title")}
          </h1>
          <p className="text-sm text-muted-foreground ">
            {t("auth:inactiveAccount.message")}
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
      
      
