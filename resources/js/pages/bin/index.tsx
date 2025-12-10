"use client"

import { dashboard } from '@/routes';
import { index } from '@/routes/bin';
import { restore as RestorePond } from '@/routes/bin/ponds';
import AppLayout from "@/layouts/app-layout"
import { Head, usePage, router } from "@inertiajs/react"
import * as React from 'react'
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
import { Trash2, Undo2Icon } from 'lucide-react'
import { type BreadcrumbItem } from "@/types"
import { useTranslation } from 'react-i18next';
import { formatBytes } from '@/lib/formatBytes';

//Helperfunction to calculate the expiration date (deleted_at + 30 days)
function getDeletionExpiry(deleted_at: string){
    const deletedDate = new Date(deleted_at);
    deletedDate.setDate(deletedDate.getDate() + 30);
    return deletedDate;
}

export default function TrashPage() {
    const { trashedPonds, trashedFiles } = usePage<{
    trashedPonds: { id: number; name: string; size: number; deleted_at: string }[]
    trashedFiles: { id: number; name: string; pondName: string; size: number; deleted_at: string }[]
    }>().props

    const { t } = useTranslation();

    const totalPondSize = trashedPonds.reduce((total, pond) => total + pond.size, 0);
    const totalFileSize = trashedFiles.reduce((total, file) => total + file.size, 0);
    const totalSize = totalPondSize + totalFileSize;


    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('bin:title', { trashSize: formatBytes(totalSize) }),
            href: index().url,
        },
    ];

    

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
                            {t('bin:ponds_tab_title', { count: trashedPonds.length, size: formatBytes(totalPondSize)})}
                        </TabsTrigger>
                        <TabsTrigger value="files">
                            {t('bin:trash.files_tab_title', { count: trashedFiles.length, size: formatBytes(totalFileSize)})}
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
                                    <>
                                    {console.log(pond)}
                                    <TableRow key={pond.id}>
                                        
                                        <TableCell>{pond.name}</TableCell>
                                        <TableCell>{formatBytes(pond.size)}</TableCell>
                                        <TableCell>{new Date(pond.deleted_at).toLocaleDateString()}</TableCell>
                                        <TableCell>{getDeletionExpiry(pond.deleted_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="flex gap-2">
                                            <Button 
                                                size="sm"
                                                variant="outline"
                                                onClick={() => 
                                                    router.post(
                                                        RestorePond.url(pond.id),
                                                        {},
                                                        {
                                                            preserveScroll: true,
                                                            preserveState: true,
                                                        }
                                                    )
                                                }
                                                >
                                                <Undo2Icon className="mr-2 h-4 w-4" />
                                                {t('bin:actions.restore')}
                                            </Button>                                                

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm" variant="destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        {t('bin:actions.delete_permanently')}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>{t('bin:confirm_delete.title')}</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            {t('bin:confirm_delete.message')}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>                                                    
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className={buttonVariants({ variant: 'destructive' })}                                                            
                                                        >
                                                            {t('bin:actions.delete_permanently')}
                                                        </AlertDialogAction>
                                                </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>                                            
                                        </TableCell>
                                    </TableRow>
                                    </>
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
                                <TableHead>{t('bin:trash.table.file_name')}</TableHead>
                                <TableHead>{t('bin:trash.table.pond_name')}</TableHead>
                                <TableHead>{t('bin:trash.table.size')}</TableHead>
                                <TableHead>{t('bin:trash.table.deleted_at')}</TableHead>
                                <TableHead>{t('bin:trash.table.expires_at')}</TableHead>
                                <TableHead className="text-right">{t('bin:trash.table.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedFiles.map((file) => (
                                <TableRow key={file.id}>
                                    <TableCell>{file.name}</TableCell>
                                    <TableCell>{file.pondName}</TableCell>
                                    <TableCell>{formatBytes(file.size)}</TableCell>
                                    <TableCell>{new Date(file.deleted_at).toLocaleDateString()}</TableCell>
                                    <TableCell>{getDeletionExpiry(file.deleted_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            // onClick
                                            >
                                            <Undo2Icon className="mr-2 h-4 w-4" />
                                            {t('bin:actions.restore')}
                                        </Button>
                                        //TODO ALERT DIALOG EINBAUEN
                                    </TableCell>                                    
                                </TableRow>
                            ))}
                            {trashedFiles.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-4">
                                        {t('bin:trash.table.no_files')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between py-4 text-sm text-muted-foreground">
                        <div>
                            {t('bin:trash.pagination.showing')} {filePage * itemsPerPage + 1} - {Math.min((filePage + 1) * itemsPerPage, trashedFiles.length)} {t('bin:trash.pagination.of')} {trashedFiles.length}
                        </div>
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFilePage((p) => Math.max(p - 1, 0))}
                                disabled={filePage === 0}
                            >
                                {t('bin:trash.pagination.previous')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFilePage((p) => p + 1)}
                                disabled={(filePage + 1) * itemsPerPage >= trashedFiles.length}
                            >
                                {t('bin:trash.pagination.next')}
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>    
        </div>
    </AppLayout>
    )
    


  
}