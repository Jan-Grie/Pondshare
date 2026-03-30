import AppLogoIcon from '@/components/app-logo-icon';
import { Card, CardContent } from '@/components/ui/card';
import { home } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { TimerOff } from 'lucide-react';

export default function UploadExpired() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <Head title="Link abgelaufen" />
            <div className="flex w-full max-w-md flex-col gap-6">
                <Link href={home()} className="flex items-center gap-2 self-center font-medium">
                    <div className="flex h-9 w-9 items-center justify-center">
                        <AppLogoIcon className="size-9 fill-current text-black dark:text-white" />
                    </div>
                </Link>

                <Card className="rounded-xl">
                    <CardContent className="px-10 py-8">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <TimerOff className="h-12 w-12 text-muted-foreground" />
                            <div>
                                <h1 className="text-xl font-semibold">Link abgelaufen</h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Dieser Upload-Link ist leider abgelaufen und kann nicht mehr verwendet werden.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
