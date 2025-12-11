"use client"

import { dashboard } from '@/routes';
import { index } from '@/routes/bin';
import { restore as RestorePond } from '@/routes/bin/ponds';
import { forceDelete as forceDeletePond } from '@/routes/bin/ponds';
import { restore as RestoreFile } from '@/routes/bin/files';
import { forceDelete as forceDeleteFile } from '@/routes/bin/files';
import AppLayout from "@/layouts/app-layout"
import { Head, usePage, router } from "@inertiajs/react"
import * as React from 'react'
import { toast } from 'sonner';
import {
    Tabs, 
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs'
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table'
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
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Trash2, TriangleAlertIcon, Undo2Icon } from 'lucide-react'
import { type BreadcrumbItem } from "@/types"
import { useTranslation } from 'react-i18next';
import { formatBytes } from '@/lib/formatBytes';
import { format } from 'path';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

//Helperfunction to calculate the expiration date (deleted_at + 30 days)
function getDeletionExpiry(deleted_at: string){
    const deletedDate = new Date(deleted_at);
    deletedDate.setDate(deletedDate.getDate() + 30);
    return deletedDate;
}

export default function TrashPage() {
    const { trashedPonds, trashedFiles, totalPondSize, totalFileSize, totalSize } = usePage<{
    trashedPonds: { id: number; name: string; size: number; deleted_at: string }[]
    trashedFiles: { id: number; name: string; pond_name: string; size: number; deleted_at: string }[]
    totalPondSize: number
    totalFileSize: number
    totalSize: number
    }>().props

    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('bin:title', { trashSize: formatBytes(totalSize) }),
            href: index().url,
        },
    ];

    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [deleteTarget, setDeleteTarget] = React.useState<null | {
        type: "pond" | "file",
        id: number,
        name: string
    }>(null);    

    //Pagination States
    const [pondPage, setPondPage] = React.useState(0);
    const [filePage, setFilePage] = React.useState(0);
    const itemsPerPage = 10;

    const paginatedPonds = trashedPonds.slice(
        pondPage * itemsPerPage,
        (pondPage + 1) * itemsPerPage
    )

    const paginatedFiles = trashedFiles.slice(
        filePage * itemsPerPage,
        (filePage + 1) * itemsPerPage
    )

    const restorePond = (pondId: number) => {
        router.post(
            RestorePond.url(pondId),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success(t('bin:toast.pond_restored'), {
                        duration: 5000,
                        style: {
                            "--normal-bg":
                            "light-dark(var(--color-green-600), var(--color-green-400))",
                            "--normal-text": "var(--color-white)",
                            "--normal-border":
                            "light-dark(var(--color-green-600), var(--color-green-400))",
                        } as React.CSSProperties,                        
                    });
                },
                onError: () => {
                    toast.error(t('bin:toast.pond_restore_error'), {
                        duration: 5000,
                        style: {
                            "--normal-bg":
                            "light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))",
                            "--normal-text": "var(--color-white)",
                            "--normal-border": "transparent",
                        } as React.CSSProperties,                        
                    });
                }                
            }
        )
    }

    const deletePond = (pondId: number) => {
        router.delete(
            forceDeletePond.url(pondId),             
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success(t('bin:toast.pond_deleted_permanently'), {
                        duration: 5000,
                        style: {
                            "--normal-bg":
                            "light-dark(var(--color-green-600), var(--color-green-400))",
                            "--normal-text": "var(--color-white)",
                            "--normal-border":
                            "light-dark(var(--color-green-600), var(--color-green-400))",
                        } as React.CSSProperties,                        
                    });
                },
                onError: () => {
                    toast.error(t('bin:toast.pond_delete_error'), {
                        duration: 5000,
                        style: {
                            "--normal-bg":
                            "light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))",
                            "--normal-text": "var(--color-white)",
                            "--normal-border": "transparent",
                        } as React.CSSProperties,                        
                    });
                }
            }
        )
    }

    const restoreFile = (fileId: number) => {
        router.post(
            RestoreFile.url(fileId),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success(t('bin:toast.file_restored'), {
                        duration: 5000,
                        style: {
                            "--normal-bg":
                            "light-dark(var(--color-green-600), var(--color-green-400))",
                            "--normal-text": "var(--color-white)",
                            "--normal-border":
                            "light-dark(var(--color-green-600), var(--color-green-400))",
                        } as React.CSSProperties,                        
                    });
                },
                onError: () => {
                    toast.error(t('bin:toast.file_delete_error'), {
                        duration: 5000,
                        style: {
                            "--normal-bg":
                            "light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))",
                            "--normal-text": "var(--color-white)",
                            "--normal-border": "transparent",
                        } as React.CSSProperties,                        
                    });
                }
            }
        )
    }

    const deleteFile = (fileId: number) => {
        router.delete(
            forceDeleteFile.url(fileId),
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success(t('bin:toast.file_deleted_permanently'), {
                        duration: 5000,
                        style: {
                            "--normal-bg":
                            "light-dark(var(--color-green-600), var(--color-green-400))",
                            "--normal-text": "var(--color-white)",
                            "--normal-border":
                            "light-dark(var(--color-green-600), var(--color-green-400))",
                        } as React.CSSProperties,                        
                    });
                },
                onError: () => {
                    toast.error(t('bin:toast.file_delete_error'), {
                        duration: 5000,
                        style: {
                            "--normal-bg":
                            "light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))",
                            "--normal-text": "var(--color-white)",
                            "--normal-border": "transparent",
                        } as React.CSSProperties,                        
                    });
                }                
            }
        )
    }
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('bin:title', { trashSize: formatBytes(totalSize) })} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-semibold">
                    {t('bin:title', { trashSize: formatBytes(totalSize) })}
                </h1>

                <Tabs defaultValue="ponds" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="ponds">
                            {t('bin:ponds_tab_title', { count: trashedPonds.length })}
                            {" "}
                            {formatBytes(totalPondSize)}
                        </TabsTrigger>
                        <TabsTrigger value="files">
                            {t('bin:files_tab_title', { count: trashedFiles.length, size: formatBytes(totalFileSize)})}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="ponds">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('bin:table.pond_name')}</TableHead>
                                    <TableHead>{t('bin:table.size')}</TableHead>
                                    <TableHead>{t('bin:table.deleted_at')}</TableHead>
                                    <TableHead>{t('bin:table.expires_at')}</TableHead>
                                    <TableHead>{t('bin:table.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedPonds.map((pond) => (           
                                    <ContextMenu>
                                        <ContextMenuTrigger asChild>
                                            <TableRow key={pond.id}>
                                                
                                                <TableCell>{pond.name}</TableCell>
                                                <TableCell>{formatBytes(pond.size)}</TableCell>
                                                <TableCell>{new Date(pond.deleted_at).toLocaleDateString()}</TableCell>
                                                <TableCell>{getDeletionExpiry(pond.deleted_at).toLocaleDateString()}</TableCell>
                                                <TableCell className="flex gap-2">
                                                    <Button 
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => restorePond(pond.id)}
                                                    >
                                                        <Undo2Icon className="mr-2 h-4 w-4" />
                                                        {t('bin:actions.restore')}
                                                    </Button>                                                

                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => {
                                                            setDeleteTarget({ type: "pond", id: pond.id, name: pond.name });
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        {t('bin:actions.delete_permanently')}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>                                    
                                        </ContextMenuTrigger>               
                                        <ContextMenuContent className="w-48">
                                            <ContextMenuItem 
                                                onClick={() => restorePond(pond.id)}
                                            >
                                            <Undo2Icon className="mr-2 h-4 w-4" />
                                            {t('bin:actions.restore')}
                                            </ContextMenuItem>

                                            <ContextMenuSeparator />

                                            <ContextMenuItem
                                                className="text-destructive-foreground focus:text-destructive-foreground"
                                                onClick={() => {
                                                    setDeleteTarget({ type: "pond", id: pond.id, name: pond.name });
                                                    setDeleteDialogOpen(true);
                                                }}
                                            >
                                            <Trash2 className="mr-2 h-4 w-4 text-destructive-foreground" />
                                            {t('bin:actions.delete_permanently')}
                                            </ContextMenuItem>
                                        </ContextMenuContent>
                                    </ContextMenu>
                                ))}
                                {trashedPonds.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4">
                                            {t('bin:table.no_ponds')}
                                        </TableCell>
                                    </TableRow>)}
                            </TableBody>
                        </Table>
                    


                    <div className="flex items-center justify-between py-4 text-sm text-muted-foreground">
                        <div>
                            {trashedPonds.length === 0 ? (
                                t('common:pagination.empty') // z. B. "No entries found"
                            ) : (
                                t('common:pagination.showing', { 
                                    start: pondPage * itemsPerPage + 1,
                                    end: Math.min((pondPage + 1) * itemsPerPage, trashedPonds.length),
                                    total: trashedPonds.length 
                                })
                            )}
                        </div>
                        <div className="space-x-2">
                            <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => setPondPage((p) => Math.max(p - 1, 0))}
                                disabled={pondPage === 0}
                            >
                                {t('common:actions.previous')}
                            </Button>
                            <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => setPondPage((p) => p + 1)}
                                disabled={(pondPage + 1) * itemsPerPage >= trashedPonds.length}
                            >
                                {t('common:actions.next')}
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="files">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('bin:table.file_name')}</TableHead>
                                <TableHead>{t('bin:table.pond_name')}</TableHead>
                                <TableHead>{t('bin:table.size')}</TableHead>
                                <TableHead>{t('bin:table.deleted_at')}</TableHead>
                                <TableHead>{t('bin:table.expires_at')}</TableHead>
                                <TableHead>{t('bin:table.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedFiles.map((file) => (
                                <ContextMenu>
                                    <ContextMenuTrigger asChild>                            
                                        <TableRow key={file.id}>
                                            <TableCell>{file.name}</TableCell>
                                            <TableCell>{file.pond_name}</TableCell>
                                            <TableCell>{formatBytes(file.size)}</TableCell>
                                            <TableCell>{new Date(file.deleted_at).toLocaleDateString()}</TableCell>
                                            <TableCell>{getDeletionExpiry(file.deleted_at).toLocaleDateString()}</TableCell>
                                            <TableCell className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => restoreFile(file.id)}
                                                    >
                                                    <Undo2Icon className="mr-2 h-4 w-4" />
                                                    {t('bin:actions.restore')}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        setDeleteTarget({ type: "file", id: file.id, name: file.name });
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    {t('bin:actions.delete_permanently')}
                                                </Button>
                                            </TableCell>                                    
                                        </TableRow>
                                    </ContextMenuTrigger>               
                                    <ContextMenuContent className="w-48">
                                        <ContextMenuItem 
                                            onClick={() => restoreFile(file.id)}
                                        >
                                        <Undo2Icon className="mr-2 h-4 w-4" />
                                        {t('bin:actions.restore')}
                                        </ContextMenuItem>

                                        <ContextMenuSeparator />

                                        <ContextMenuItem
                                            className="text-destructive-foreground"
                                            onClick={() => {
                                                setDeleteTarget({ type: "file", id: file.id, name: file.name });
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t('bin:actions.delete_permanently')}
                                        </ContextMenuItem>                                                                          
                                    </ContextMenuContent>
                                </ContextMenu>                                
                            ))}
                            {trashedFiles.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-4">
                                        {t('bin:table.no_files')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between py-4 text-sm text-muted-foreground">
                        <div>
                            {trashedFiles.length === 0 ? (
                                t('common:pagination.empty') // z. B. "No entries found"
                            ) : (
                                t('common:pagination.showing', { 
                                    start: filePage * itemsPerPage + 1,
                                    end: Math.min((filePage + 1) * itemsPerPage, trashedFiles.length),
                                    total: trashedPonds.length 
                                })
                            )}
                        </div>
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFilePage((p) => Math.max(p - 1, 0))}
                                disabled={filePage === 0}
                            >
                                {t('common:actions.previous')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFilePage((p) => p + 1)}
                                disabled={(filePage + 1) * itemsPerPage >= trashedFiles.length}
                            >
                                {t('common:actions.next')}
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>    
        </div>
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader className="items-center text-center">
                    <div className="dark:bg-destructive/35 bg-destructive/20 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
                        <TriangleAlertIcon className="text-destructive size-6" />
                    </div>

                    <AlertDialogTitle>
                        {t('bin:confirm_delete.title')}
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                        {t('bin:confirm_delete.message')}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>
                        {t('common:actions.cancel')}
                    </AlertDialogCancel>

                    <AlertDialogAction
                        className="bg-destructive dark:bg-destructive/60 hover:bg-destructive text-white"
                        onClick={() => {
                            if (!deleteTarget) return;

                            if (deleteTarget.type === "pond") {
                                deletePond(deleteTarget.id);
                            } else {
                                deleteFile(deleteTarget.id);
                            }

                            setDeleteDialogOpen(false);
                        }}
                    >
                        {t('bin:actions.delete_permanently')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </AppLayout>
    )
    


  
}