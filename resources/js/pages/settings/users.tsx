import { Head, router, useForm, usePage } from '@inertiajs/react'
import { CheckCircle2, KeyRound, MoreHorizontal, Trash2, UserRound, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import AppLayout from '@/layouts/app-layout'
import SettingsLayout from '@/layouts/settings/layout'
import { useInitials } from '@/hooks/use-initials'
import { type BreadcrumbItem, type SharedData } from '@/types'

interface Role {
    id: number
    name: string
}

interface ManagedUser {
    id: number
    name: string
    email: string
    email_verified_at: string | null
    active: boolean
    role_id: number
    role: string | null
    quota_bytes: number
    used_bytes: number
    quota_percent: number
}

interface PaginatedUsers {
    data: ManagedUser[]
    total: number
    from: number | null
    to: number | null
    prev_page_url: string | null
    next_page_url: string | null
}

interface Props {
    users: PaginatedUsers
    roles: Role[]
    filters: { search: string }
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Nutzerverwaltung', href: '/settings/users' },
]

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 MB'
    const gb = bytes / (1024 * 1024 * 1024)
    if (gb >= 1) return `${gb.toFixed(2)} GB`
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(0)} MB`
}

function formatQuotaGb(bytes: number): string {
    const gb = bytes / (1024 * 1024 * 1024)
    return gb.toFixed(2)
}

// ── Create Dialog ──────────────────────────────────────────────────────────────
function CreateUserDialog({ roles, open, onClose }: { roles: Role[]; open: boolean; onClose: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        role_id: String(roles.find((r) => r.name.toLowerCase() === 'benutzer')?.id ?? roles[0]?.id ?? ''),
        quota_gb: '1',
        active: true as boolean,
    })

    function submit(e: React.FormEvent) {
        e.preventDefault()
        post('/settings/users', {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose() },
        })
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Neuen Nutzer anlegen</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-1.5">
                        <Label htmlFor="create-name">Name</Label>
                        <Input id="create-name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="create-email">E-Mail</Label>
                        <Input id="create-email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                        <InputError message={errors.email} /> 
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="create-password">Passwort</Label>
                        <Input id="create-password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} required />
                        <InputError message={errors.password} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label>Rolle</Label>
                        <Select value={data.role_id} onValueChange={(v) => setData('role_id', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {roles.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.role_id} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="create-quota">Speicherkontingent (GB)</Label>
                        <Input id="create-quota" type="number" min="0" step="0.1" value={data.quota_gb} onChange={(e) => setData('quota_gb', e.target.value)} />
                        <InputError message={errors.quota_gb} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox id="create-active" checked={data.active} onCheckedChange={(v) => setData('active', !!v)} />
                        <Label htmlFor="create-active">Aktiv</Label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => { reset(); onClose() }}>Abbrechen</Button>
                        <Button type="submit" disabled={processing}>Anlegen</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ── Edit Dialog ────────────────────────────────────────────────────────────────
function EditUserDialog({ user, roles, open, onClose }: { user: ManagedUser; roles: Role[]; open: boolean; onClose: () => void }) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        name: user.name,
        email: user.email,
        role_id: String(user.role_id),
        quota_gb: formatQuotaGb(user.quota_bytes),
        active: user.active,
        email_verified: user.email_verified_at !== null,
    })

    useEffect(() => {
        if (open) {
            setData({
                name: user.name,
                email: user.email,
                role_id: String(user.role_id),
                quota_gb: formatQuotaGb(user.quota_bytes),
                active: user.active,
                email_verified: user.email_verified_at !== null,
            })
        }
    }, [open, user])

    function submit(e: React.FormEvent) {
        e.preventDefault()
        patch(`/settings/users/${user.id}`, {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose() },
        })
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nutzer bearbeiten</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-1.5">
                        <Label htmlFor="edit-name">Name</Label>
                        <Input id="edit-name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="edit-email">E-Mail</Label>
                        <Input id="edit-email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} required />
                        <InputError message={errors.email} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label>Rolle</Label>
                        <Select value={data.role_id} onValueChange={(v) => setData('role_id', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {roles.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.role_id} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="edit-quota">Speicherkontingent (GB)</Label>
                        <Input id="edit-quota" type="number" min="0" step="0.1" value={data.quota_gb} onChange={(e) => setData('quota_gb', e.target.value)} />
                        <InputError message={errors.quota_gb} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox id="edit-active" checked={data.active} onCheckedChange={(v) => setData('active', !!v)} />
                        <Label htmlFor="edit-active">Aktiv</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox id="edit-verified" checked={data.email_verified} onCheckedChange={(v) => setData('email_verified', !!v)} />
                        <Label htmlFor="edit-verified">E-Mail bestätigt</Label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => { reset(); onClose() }}>Abbrechen</Button>
                        <Button type="submit" disabled={processing}>Speichern</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ── Reset Password Dialog ──────────────────────────────────────────────────────
function ResetPasswordDialog({ user, open, onClose }: { user: ManagedUser; open: boolean; onClose: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
        password_confirmation: '',
        must_change_password: true as boolean,
    })

    function submit(e: React.FormEvent) {
        e.preventDefault()
        post(`/settings/users/${user.id}/reset-password`, {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose() },
        })
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Passwort zurücksetzen – {user.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-1.5">
                        <Label htmlFor="reset-pw">Neues Passwort</Label>
                        <Input id="reset-pw" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} required />
                        <InputError message={errors.password} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="reset-pw-confirm">Passwort bestätigen</Label>
                        <Input id="reset-pw-confirm" type="password" value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} required />
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox id="must-change" checked={data.must_change_password} onCheckedChange={(v) => setData('must_change_password', !!v)} />
                        <Label htmlFor="must-change">Nutzer muss Passwort bei nächster Anmeldung ändern</Label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => { reset(); onClose() }}>Abbrechen</Button>
                        <Button type="submit" disabled={processing}>Zurücksetzen</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ── Delete Dialog ──────────────────────────────────────────────────────────────
function DeleteUserDialog({ user, open, onClose }: { user: ManagedUser; open: boolean; onClose: () => void }) {
    const [processing, setProcessing] = useState(false)

    function confirm() {
        setProcessing(true)
        router.delete(`/settings/users/${user.id}`, {
            preserveScroll: true,
            onFinish: () => { setProcessing(false); onClose() },
        })
    }

    return (
        <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Nutzer löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Soll <strong>{user.name}</strong> ({user.email}) wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={confirm} disabled={processing} className="bg-destructive text-white hover:bg-destructive/90">
                        Löschen
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function UsersManagement({ users, roles, filters }: Props) {
    const { auth } = usePage<SharedData>().props
    const getInitials = useInitials()

    const [search, setSearch] = useState(filters.search)
    const [createOpen, setCreateOpen] = useState(false)
    const [editUser, setEditUser] = useState<ManagedUser | null>(null)
    const [resetUser, setResetUser] = useState<ManagedUser | null>(null)
    const [deleteUser, setDeleteUser] = useState<ManagedUser | null>(null)

    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    function handleSearch(value: string) {
        setSearch(value)
        if (searchTimeout.current) clearTimeout(searchTimeout.current)
        searchTimeout.current = setTimeout(() => {
            router.get('/settings/users', { search: value }, { preserveState: true, replace: true })
        }, 300)
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nutzerverwaltung" />

            <SettingsLayout fullWidth>
                <div className="space-y-6">
                    <HeadingSmall title="Nutzerverwaltung" description="Alle Nutzer verwalten" />

                    <div className="flex items-center justify-between gap-4">
                        <Input
                            placeholder="Suche nach E-Mail..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="max-w-xs"
                        />
                        <Button onClick={() => setCreateOpen(true)}>
                            + Neuen Nutzer anlegen
                        </Button>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10"></TableHead>
                                    <TableHead>Nutzer</TableHead>
                                    <TableHead>E-Mail</TableHead>
                                    <TableHead>E-Mail bestätigt</TableHead>
                                    <TableHead>Rolle</TableHead>
                                    <TableHead>Aktiv</TableHead>
                                    <TableHead>Speichernutzung</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="text-xs">
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{user.name}</span>
                                                {user.id === auth.user.id && (
                                                    <Badge variant="secondary" className="text-xs">Du</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                        <TableCell>
                                            {user.email_verified_at
                                                ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                : <XCircle className="h-5 w-5 text-destructive" />
                                            }
                                        </TableCell>
                                        <TableCell>{user.role ?? '—'}</TableCell>
                                        <TableCell>
                                            {user.active
                                                ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                : <XCircle className="h-5 w-5 text-destructive" />
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                                    {formatBytes(user.used_bytes)} / {formatBytes(user.quota_bytes)}
                                                </span>
                                                <Badge
                                                    variant={user.quota_percent >= 90 ? 'destructive' : 'secondary'}
                                                    className="text-xs"
                                                >
                                                    {Math.round(user.quota_percent)}%
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => setEditUser(user)}>
                                                        <UserRound className="h-4 w-4" />
                                                        Bearbeiten
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setResetUser(user)}>
                                                        <KeyRound className="h-4 w-4" />
                                                        Passwort zurücksetzen
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        disabled={user.id === auth.user.id}
                                                        onClick={() => setDeleteUser(user)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Löschen
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            {users.from !== null && users.to !== null
                                ? `Zeige ${users.from}–${users.to} von ${users.total} Einträgen`
                                : `${users.total} Einträge`
                            }
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!users.prev_page_url}
                                onClick={() => users.prev_page_url && router.get(users.prev_page_url, {}, { preserveState: true })}
                            >
                                Zurück
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!users.next_page_url}
                                onClick={() => users.next_page_url && router.get(users.next_page_url, {}, { preserveState: true })}
                            >
                                Weiter
                            </Button>
                        </div>
                    </div>
                </div>
            </SettingsLayout>

            <CreateUserDialog roles={roles} open={createOpen} onClose={() => setCreateOpen(false)} />
            {editUser && <EditUserDialog user={editUser} roles={roles} open={!!editUser} onClose={() => setEditUser(null)} />}
            {resetUser && <ResetPasswordDialog user={resetUser} open={!!resetUser} onClose={() => setResetUser(null)} />}
            {deleteUser && <DeleteUserDialog user={deleteUser} open={!!deleteUser} onClose={() => setDeleteUser(null)} />}
        </AppLayout>
    )
}
