import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { Microsoft } from "developer-icons";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from 'react-i18next';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
    socialProviders: {
        azure: boolean;
    };
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
    socialProviders,
}: LoginProps) {
    const { t } = useTranslation('auth');

    return (
        <AuthLayout
            title={t('login.title')}
            description={t('login.description')}
        >
            <Head title={t('login.head_title')} />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('login.email_label')}</Label>
                                <Input
                                    aria-invalid={!!errors.email}
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder={t('login.email_placeholder')}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">{t('login.password_label')}</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={6}
                                        >
                                            {t('login.forgot_password')}
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    aria-invalid={!!errors.password}
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder={t('login.password_placeholder')}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">{t('login.remember_me')}</Label>
                            </div>

                            <Button
                                type="submit"
                                className=" w-full"
                                tabIndex={5}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                {t('login.submit')}
                            </Button>

                            {socialProviders.azure  && (
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                <Separator />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    {t('login.or_continue_with')}
                                </span>
                                </div>
                            </div>
                            )}

                            {socialProviders.azure && (

                                <Button
                                    type="button"
                                    className=" w-full"
                                    tabIndex={4}
                                    variant="outline"
                                    onClick={() => {
                                        window.location.href = '/auth/azure/redirect'
                                    }}
                                >
                                    <Microsoft /> {t('login.login_with_microsoft')}
                                </Button>
                            )}

                        </div>

                        {canRegister && (
                            <div className="text-center text-sm text-muted-foreground">
                                {t('login.no_account')}{' '}
                                <TextLink href={register()} tabIndex={5}>
                                    {t('login.sign_up')}
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
