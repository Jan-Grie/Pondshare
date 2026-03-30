import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatBytes } from '@/lib/formatBytes';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Clock, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface LatestScan {
    status: string;
    message: string | null;
}

interface SecurityFile {
    id: number;
    name: string;
    extension: string;
    size: number;
    scan_status: 'infected' | 'failed' | 'pending';
    scanned_at: string | null;
    created_at: string;
    uploaded_by: string | null;
    pond: { id: number; name: string } | null;
    user: { id: number; name: string } | null;
    latest_scan: LatestScan | null;
}

interface PaginatedFiles {
    data: SecurityFile[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
}

interface Counts {
    infected: number;
    failed: number;
    pending: number;
}

interface Filters {
    status: string | null;
    search: string | null;
}

interface FileSecurityProps {
    files: PaginatedFiles;
    counts: Counts;
    filters: Filters;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'File Security', href: '/admin/file-security' }];

function StatusBadge({ status }: { status: SecurityFile['scan_status'] }) {
    if (status === 'infected') {
        return (
            <Badge variant="destructive" className="gap-1">
                <ShieldAlert className="h-3 w-3" />
                Infiziert
            </Badge>
        );
    }
    if (status === 'failed') {
        return (
            <Badge variant="outline" className="gap-1 border-orange-500 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-3 w-3" />
                Fehler
            </Badge>
        );
    }
    return (
        <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Ausstehend
        </Badge>
    );
}

export default function FileSecurity({ files, counts, filters }: FileSecurityProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const total = counts.infected + counts.failed + counts.pending;
    const activeTab = filters.status ?? 'all';

    const navigate = (params: Record<string, string | null>) => {
        router.get(
            '/admin/file-security',
            Object.fromEntries(
                Object.entries({ status: filters.status, search: filters.search, ...params }).filter(
                    ([, v]) => v != null && v !== '',
                ),
            ),
            { preserveState: true, replace: true },
        );
    };

    const handleTabChange = (value: string) => {
        navigate({ status: value === 'all' ? null : value, search: search || null });
    };

    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            navigate({ search: search || null });
        }, 300);
        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [search]);

    const deleteFile = (fileId: number) => {
        router.delete(`/admin/file-security/${fileId}`, { preserveScroll: true });
    };

    const rescanFile = (fileId: number) => {
        router.post(`/admin/file-security/${fileId}/rescan`, {}, { preserveScroll: true });
    };

    const uploaderName = (file: SecurityFile) =>
        file.user?.name ?? file.uploaded_by ?? '—';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="File Security" />

            <div className="px-4 py-6 md:max-w-7xl md:mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">File Security</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Übersicht aller Dateien mit auffälligem Scan-Ergebnis.
                    </p>
                </div>

                {/* Summary badges */}
                <div className="mb-6 flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3">
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                        <span className="text-sm font-medium">{counts.infected} infiziert</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">{counts.failed} fehlgeschlagen</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{counts.pending} ausstehend</span>
                    </div>
                </div>

                {/* Tabs + Search */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Tabs value={activeTab} onValueChange={handleTabChange}>
                        <TabsList>
                            <TabsTrigger value="all">
                                Alle <span className="ml-1.5 text-xs opacity-60">{total}</span>
                            </TabsTrigger>
                            <TabsTrigger value="infected">
                                Infiziert <span className="ml-1.5 text-xs opacity-60">{counts.infected}</span>
                            </TabsTrigger>
                            <TabsTrigger value="failed">
                                Fehler <span className="ml-1.5 text-xs opacity-60">{counts.failed}</span>
                            </TabsTrigger>
                            <TabsTrigger value="pending">
                                Ausstehend <span className="ml-1.5 text-xs opacity-60">{counts.pending}</span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Input
                        placeholder="Datei, Pond oder Nutzer suchen…"
                        className="w-full sm:w-64"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Table */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-32">Status</TableHead>
                                <TableHead>Datei</TableHead>
                                <TableHead>Pond</TableHead>
                                <TableHead>Hochgeladen von</TableHead>
                                <TableHead className="text-right">Größe</TableHead>
                                <TableHead>Befund</TableHead>
                                <TableHead>Datum</TableHead>
                                <TableHead className="w-28 text-right">Aktionen</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {files.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                                        Keine auffälligen Dateien gefunden.
                                    </TableCell>
                                </TableRow>
                            )}
                            {files.data.map((file) => (
                                <TableRow key={file.id}>
                                    <TableCell>
                                        <StatusBadge status={file.scan_status} />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {file.name}.{file.extension}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {file.pond?.name ?? '—'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {uploaderName(file)}
                                    </TableCell>
                                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                                        {formatBytes(file.size)}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {file.latest_scan?.message ? (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="cursor-default">
                                                            {file.latest_scan.message.length > 45
                                                                ? file.latest_scan.message.slice(0, 45) + '…'
                                                                : file.latest_scan.message}
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-sm break-words">
                                                        {file.latest_scan.message}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : (
                                            '—'
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(file.created_at).toLocaleDateString('de-DE')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            {(file.scan_status === 'pending' || file.scan_status === 'failed') && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    title="Scan neu starten"
                                                    onClick={() => rescanFile(file.id)}
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        title="Datei löschen"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Datei löschen?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            <strong>{file.name}.{file.extension}</strong> wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className={buttonVariants({ variant: 'destructive' })}
                                                            onClick={() => deleteFile(file.id)}
                                                        >
                                                            Dauerhaft löschen
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {files.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Seite {files.current_page} von {files.last_page} · {files.total} Einträge
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!files.prev_page_url}
                                onClick={() => files.prev_page_url && router.get(files.prev_page_url)}
                            >
                                Zurück
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!files.next_page_url}
                                onClick={() => files.next_page_url && router.get(files.next_page_url)}
                            >
                                Weiter
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
