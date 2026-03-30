"use client"

import React, { useState } from "react"
import {
    Head,
    Link,
    router,
    useForm,
    usePage,
} from "@inertiajs/react"

import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    ColumnDef,
    flexRender,
    SortingState,
} from "@tanstack/react-table"

import AppLayout from "@/layouts/app-layout"
import { BreadcrumbItem } from "@/types"

import {
    Button,
    buttonVariants,
} from "@/components/ui/button"
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"

import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {
    Plus,
    Loader2,
    SquareArrowOutUpRight,
    ArrowUpDown,
    Trash2Icon,
    Search,
    TriangleAlertIcon,
} from "lucide-react"

import { formatBytes } from "@/lib/formatBytes"
import { useTranslation } from "react-i18next"

// Wayfinder routes
import { index as pondsIndex, store, show, destroy } from "@/routes/ponds"

interface Pond {
    id: number
    name: string
    description: string
    created_at: string
    files_count: number
    size_bytes: number
    shared_links_count: number
}

export default function MyPonds() {
    const { t } = useTranslation()

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t("ponds:title"), href: pondsIndex().url },
    ]

    const { ponds } = usePage<{ ponds: Pond[] }>().props

    const [open, setOpen] = useState(false)
    const [globalFilter, setGlobalFilter] = useState("")
    const [sorting, setSorting] = useState<SortingState>([])

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm<{ name: string }>({ name: "" })

    const submit = (e: React.FormEvent) => {
        e.preventDefault()

        post(store.url(), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                reset()
                setOpen(false)
            },
        })
    }

    const columns: ColumnDef<Pond>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    {t("ponds:table.name")} <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <Link
                    href={show.url(row.original.id)}
                    className="flex items-center gap-1 hover:underline"
                >
                    {row.original.name}
                    <SquareArrowOutUpRight className="h-4 w-4 text-muted-foreground" />
                </Link>
            ),
        },
        {
            accessorKey: "files_count",
            header: t("ponds:table.files"),
        },
        {
            accessorKey: "size_bytes",
            header: t("ponds:table.size"),
            cell: ({ getValue }) => formatBytes(getValue() as number),
        },
        {
            accessorKey: "shared_links_count",
            header: t("ponds:table.shared_links"),
        },
        {
            accessorKey: "created_at",
            header: t("ponds:table.created_at"),
            cell: ({ getValue }) => {
                const raw = getValue()

                if (!raw || typeof raw !== "string") {
                    return "—"
                }

                const date = new Date(raw)
                if (isNaN(date.getTime())) {
                    return "—"
                }

                return date.toLocaleDateString()
            }
        },
        {
            id: "actions",
            header: t("ponds:table.actions"),
            cell: ({ row }) => (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost">
                            <Trash2Icon className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader className="items-center text-center">
                            <div className="bg-destructive/20 dark:bg-destructive/35 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
                                <TriangleAlertIcon className="text-destructive size-6" />
                            </div>
                            <AlertDialogTitle>
                                {t("ponds:delete_confirm_title")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {t("ponds:delete_confirm_message")}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>
                                {t("ponds:cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive dark:bg-destructive/60 hover:bg-destructive text-white"
                                onClick={() =>
                                    router.delete(
                                        destroy.url(row.original.id)
                                    )
                                }
                            >
                                {t("ponds:delete_confirm_yes")}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ),
        },
    ]

    const table = useReactTable({
        data: ponds,
        columns,
        state: { globalFilter, sorting },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    const total = table.getFilteredRowModel().rows.length
    const { pageIndex, pageSize } = table.getState().pagination

    const start = total === 0 ? 0 : pageIndex * pageSize + 1
    const end = Math.min((pageIndex + 1) * pageSize, total)

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t("ponds:title")} />

            <div className="p-4 space-y-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">{t("ponds:title")}</h1>
                    <p className="text-muted-foreground">
                        {t("ponds:subtitle", { count: ponds.length })}
                    </p>

                    <div className="flex justify-between items-center">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="mt-2">
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t("ponds:create_button")}
                                </Button>
                            </DialogTrigger>

                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{t("ponds:dialog_title")}</DialogTitle>
                                    <DialogDescription>
                                        {t("ponds:dialog_text")}
                                    </DialogDescription>
                                </DialogHeader>

                                <form onSubmit={submit} className="space-y-4">
                                    <div>
                                        <Label htmlFor="name">{t("ponds:name")}</Label>
                                        <Input
                                            aria-invalid={!!errors.name}
                                            id="name"
                                            name="name"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData("name", e.target.value)
                                            }
                                        />
                                        {errors.name && (
                                            <div className="text-sm text-red-600">
                                                {errors.name}
                                            </div>
                                        )}
                                    </div>

                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline" type="button">
                                                {t("ponds:cancel")}
                                            </Button>
                                        </DialogClose>

                                        <Button type="submit" disabled={processing}>
                                            {processing && (
                                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                            )}
                                            {t("ponds:create")}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder={t("ponds:search_placeholder")}
                                value={globalFilter}
                                onChange={(e) =>
                                    setGlobalFilter(e.target.value)
                                }
                                className="pl-10"
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>

                        <TableBody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row
                                            .getVisibleCells()
                                            .map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="text-center py-4"
                                    >
                                        {t("ponds:no_entries_found")}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between py-4 text-sm text-muted-foreground">
                    <div>
                        {total === 0
                            ? t("ponds:pagination_no_entries")
                            : t("ponds:pagination_showing", {
                                  start,
                                  end,
                                  total,
                              })}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            {t("common:actions.previous")}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            {t("common:actions.next")}
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
