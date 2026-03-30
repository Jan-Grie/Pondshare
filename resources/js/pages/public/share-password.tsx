import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { home } from '@/routes';
import { verifyPassword } from '@/routes/shares';
import { Form, Head, Link } from '@inertiajs/react';
import { Lock } from 'lucide-react';

interface SharePasswordProps {
    token: string;
}

export default function SharePassword({ token }: SharePasswordProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <Head title="Passwort erforderlich" />
            <div className="flex w-full max-w-md flex-col gap-6">
                <Link href={home()} className="flex items-center gap-2 self-center font-medium">
                    <div className="flex h-9 w-9 items-center justify-center">
                        <AppLogoIcon className="size-9 fill-current text-black dark:text-white" />
                    </div>
                </Link>

                <Card className="rounded-xl">
                    <CardContent className="px-10 py-8">
                        <div className="mb-6 flex flex-col items-center gap-3 text-center">
                            <Lock className="h-12 w-12 text-muted-foreground" />
                            <div>
                                <h1 className="text-xl font-semibold">Passwort erforderlich</h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Diese Freigabe ist passwortgeschützt. Bitte gib das Passwort ein.
                                </p>
                            </div>
                        </div>

                        <Form {...verifyPassword.form(token)} className="flex flex-col gap-4">
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Passwort</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            autoFocus
                                            required
                                        />
                                        <InputError message={errors.password} />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={processing}>
                                        {processing && <Spinner />}
                                        Bestätigen
                                    </Button>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
