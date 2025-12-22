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

type DeleteUserProps = {
  user: {
    email: string
    provider: string | null
  }
}

export default function DeleteUser({ user }: DeleteUserProps) {
  const isSocialUser = !!user.provider

  const passwordInput = useRef<HTMLInputElement>(null)
  const emailInput = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState('')

    return (
        <div className="space-y-6">
            <HeadingSmall
                title="Delete account"
                description="Delete your account and all of its resources"
            />
            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                    <p className="font-medium">Warning</p>
                    <p className="text-sm">
                        Please proceed with caution, this cannot be undone.
                    </p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="destructive"
                            data-test="delete-user-button"
                        >
                            Delete account
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>
                            Are you sure you want to delete your account?
                        </DialogTitle>
                        <DialogDescription>
                            {isSocialUser ? (
                                <>
                                This account is connected via Microsoft.
                                <br />
                                Please enter your email address to confirm you want to
                                permanently delete your account.
                                </>
                            ) : (
                                <>
                                Once your account is deleted, all of its resources and data
                                will also be permanently deleted. Please enter your password
                                to confirm you would like to permanently delete your account.
                                </>
                            )}
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
                                        Email
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
                                            Password
                                            </Label>

                                            <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            ref={passwordInput}
                                            autoComplete="current-password"
                                            placeholder="Password"
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
                                            Cancel
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
                                            Delete account
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
