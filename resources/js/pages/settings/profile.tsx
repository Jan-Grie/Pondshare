import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,  
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTranslation } from "react-i18next"
import { useEffect } from 'react';
import { CircleAlertIcon } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Microsoft } from "developer-icons";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];



export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<SharedData>().props;

    const { t, i18n } = useTranslation();
    const userLocale = auth.user.locale;
    const getInitials = useInitials();
    useEffect(() => {
        if (userLocale) {
            i18n.changeLanguage(userLocale);
            console.log('Locale changed to:', userLocale);
        }
    }, [userLocale, i18n]);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>

                {auth.user.provider !== null && (
                    
                <>
                    <Alert className='border-none bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400'>
                        <CircleAlertIcon />
                        <AlertTitle>Account is linked</AlertTitle>
                        <AlertDescription className='text-amber-600/80 dark:text-amber-400/80'>
                            Since your account is linked with a third-party provider, some fields may be disabled to prevent changes that could affect the linkage.
                        </AlertDescription>
                    </Alert>

                    <Card className="w-full rounded-2xl">
                        <CardContent className="flex items-center justify-between">
                            {/* Left */}
                            <div className="flex items-center gap-4 min-w-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-white shrink-0">
                                <Microsoft className="h-15 w-15" />
                            </div>

                            <div className="min-w-0">
                                <div className="truncate text-base font-semibold">
                                {auth.user.name}
                                </div>
                                <div className="truncate text-sm text-muted-foreground">
                                {auth.user.email}
                                </div>
                            </div>
                            </div>

                            {/* Right */}
                            <Avatar className="h-15 w-15 shrink-0">
                            <AvatarImage
                                src={auth.user.avatar}
                                alt={auth.user.name}
                            />
                            <AvatarFallback>
                                {getInitials(auth.user.name)}
                            </AvatarFallback>
                            </Avatar>
                        </CardContent>
                    </Card>
                </>
                )}
                <div className="space-y-6">
                    <HeadingSmall
                        title="Profile information"
                        description="Update your name and email address"
                    />
                    <Form 
                        {...ProfileController.update.form()}
                        
                        options={{
                            preserveScroll: true,
                            
                        }}
                        
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (                            
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                        aria-invalid={!!errors.name}
                                        disabled={auth.user.provider !== null}
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                        aria-invalid={!!errors.email}
                                        disabled={auth.user.provider !== null}

                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                Your email address is
                                                unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Click here to resend the
                                                    verification email.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
                                                </div>
                                            )}
                                        </div>
                                    )
                                }
                                
                                <div className="grid gap-2">
                                    <Label htmlFor="locale">{t("settings:language")}</Label>

                                    <Select defaultValue={auth.user.locale || "en"} name="locale">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>{t("settings:language")}</SelectLabel>
                                                <SelectItem value="en">English</SelectItem>
                                                <SelectItem value="de">Deutsch</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>

                                    <InputError
                                        className="mt-2"
                                        message={errors.locale}
                                    />
                                </div>


                                <div className="grid gap-2">
                                    <Label htmlFor="layout">{t("settings:profile.labels.app_layout")}</Label>

                                    <Select defaultValue={auth.user.app_layout} name="app_layout">
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("settings:profile.labels.select_layout")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>{t("settings:profile.labels.app_layout")}</SelectLabel>
                                                <SelectItem value="sidebar">{t("settings:profile.sidebar")}</SelectItem>
                                                <SelectItem value="topnav">{t("settings:profile.topnav")}</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>

                                    <InputError
                                        className="mt-2"
                                        message={errors.app_layout}
                                    />
                                </div>


                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Save
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-green-600">
                                            Saved
                                        </p>
                                    </Transition>                                    

                                    <Transition
                                        show={Object.keys(errors).length > 0}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-destructive">
                                            Failed to save
                                        </p>
                                    </Transition>                                    
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
