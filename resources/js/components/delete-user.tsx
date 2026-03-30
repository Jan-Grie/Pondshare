import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type DeleteUserProps = {
  user: {
    email: string
    provider: string | null
  }
}

export default function DeleteUser({ user }: DeleteUserProps) {
  const { t } = useTranslation('settings');
  const isSocialUser = !!user.provider

  const passwordInput = useRef<HTMLInputElement>(null)
  const emailInput = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState('')

    return (
        <div className="space-y-6">
            <HeadingSmall
                title={t('delete_account.title')}
                description={t('delete_account.description')}
            />
            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                    <p className="font-medium">{t('delete_account.warning')}</p>
                    <p className="text-sm">
                        {t('delete_account.warning_text')}
                    </p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="destructive"
                            data-test="delete-user-button"
                        >
                            {t('delete_account.trigger')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>
                            {t('delete_account.dialog_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {isSocialUser
                                ? t('delete_account.dialog_description_social')
                                : t('delete_account.dialog_description_password')
                            }
                        </DialogDescription>

                            <Form
                            {...ProfileController.destroy.form()}
                            options={{ preserveScroll: true }}
                            resetOnSuccess
                            onError={() => {
                                if (isSocialUser) {
                                emailInput.current?.focus()
                                } else {
                                passwordInput.current?.focus()
                                }
                            }}
                            className="space-y-6"
                            >
                            {({ processing, errors, resetAndClearErrors }) => (
                                <>
                                <div className="grid gap-2">
                                    {isSocialUser ? (
                                    <>
                                        <Label htmlFor="email" className="sr-only">
                                        {t('delete_account.email_label')}
                                        </Label>

                                        <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        ref={emailInput}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={user.email}
                                        autoComplete="email"
                                        aria-invalid={!!errors.email}
                                        />

                                        <InputError message={errors.email} />
                                    </>
                                    ) : (
                                        <>
                                            <Label htmlFor="password" className="sr-only">
                                            {t('delete_account.password_label')}
                                            </Label>

                                            <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            ref={passwordInput}
                                            autoComplete="current-password"
                                            placeholder={t('delete_account.password_placeholder')}
                                            aria-invalid={!!errors.password}
                                            />

                                            <InputError message={errors.password} />
                                        </>
                                        )}
                                    </div>


                                    <DialogFooter className="gap-2">
                                        <DialogClose asChild>
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                            resetAndClearErrors()
                                            setEmail('')
                                            }}
                                        >
                                            {t('delete_account.cancel')}
                                        </Button>
                                        </DialogClose>

                                        <Button
                                        variant="destructive"
                                        disabled={
                                            processing ||
                                            (isSocialUser && email !== user.email)
                                        }
                                        asChild
                                        >
                                        <button type="submit">
                                            {t('delete_account.submit')}
                                        </button>
                                        </Button>
                                    </DialogFooter>
                                    </>
                                )}
                                </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
