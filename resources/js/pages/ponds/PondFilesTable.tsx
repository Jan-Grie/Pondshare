"use client"

import * as React from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table"


import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Trash2Icon, ArrowUpDown, Eye as EyeIcon, Search, RefreshCcw,  ShieldEllipsis, ShieldCheck, ShieldX, ShieldAlert } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

import { DownloadSingleFileButton } from "@/components/download-single-file"
import { getFileIconPath } from "@/lib/getIconPath"
import { formatBytes } from "@/lib/formatBytes"

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface FileItem {
  id: number
  name: string
  human_size: string
  uploaded_at: string
  uploader: string | null
  extension: string
  mime_type: string
  scan_status: string
  size: number
  path: string
  previewable: boolean
}

interface Props {
  files: FileItem[]
  onDeleteFile: (id: number) => void
  onPreview: (file: FileItem) => void
  showNewFilesBanner: boolean           
  onReloadFiles: () => Promise<void> 
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function PondFilesTable({ files, onDeleteFile, onPreview, showNewFilesBanner, onReloadFiles }: Props) {
  const { t } = useTranslation()
  const [isReloading, setIsReloading] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const handleReloadClick = async () => {
    setIsReloading(true)
    await onReloadFiles()   // Router.reload kommt aus der Parent-Komponente
    setIsReloading(false)
  }
  
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("file") ?? params.get("q") ?? "";
    setGlobalFilter(q);

    //TODO => Search Param läschen, damit bei reload nicht wieder darauf gefiltert wird
  }, []);


  const scanIconMap: Record<string, React.ReactNode> = {
    pending: (
      <Tooltip>
        <TooltipTrigger asChild>
          <ShieldEllipsis className="h-6 w-6 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("ponds:details.scan.pending")}</p>
        </TooltipContent>
      </Tooltip>
    ),

    clean: (
      <Tooltip>
        <TooltipTrigger asChild>
          <ShieldCheck className="h-6 w-6 text-green-600" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("ponds:details.scan.clean")}</p>
        </TooltipContent>
      </Tooltip>
    ),

    infected: (
      <Tooltip>
        <TooltipTrigger asChild>
          <ShieldAlert className="h-6 w-6 text-destructive-foreground" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("ponds:details.scan.infected")}</p>
        </TooltipContent>
      </Tooltip>
    ),

    failed: (
      <Tooltip>
        <TooltipTrigger asChild>
          <ShieldX className="h-6 w-6 text-orange-600" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("ponds:details.scan.failed")}</p>
        </TooltipContent>
      </Tooltip>
    ),
  };

  

  // ----------------------------------------------------------------------------
  // Column definitions
  // ----------------------------------------------------------------------------

  const columns: ColumnDef<FileItem>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("ponds:details.table.name")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const file = row.original
        return (
          <div className="flex items-center gap-2">
            <img
              src={getFileIconPath(file.extension)}
              alt={file.extension}
              className="h-8 w-8"
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate">{file.name}</span>
              </TooltipTrigger>
              <TooltipContent>
                {file.name}
              </TooltipContent>
            </Tooltip>            
            {file.previewable && (
              <button
                onClick={() => onPreview(file)}
                title={t("ponds:details.preview")}
                className="text-green-600 hover:text-green-800"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      },
    },

    {
      accessorKey: "size",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("ponds:details.table.size")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) => formatBytes(getValue() as number),
    },
    {
      accessorKey: "scan_status",
      header: ({ column }) => (
        <div className="flex items-center justify-center w-full">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center justify-center"
          >
            {t("ponds:details.table.scan_status")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ getValue }) => {
        const status = getValue() as string;

        return (
          <div className="flex items-center justify-center w-full py-1">
            {scanIconMap[status] ?? null}
          </div>
        );
      },
    },
    {
      accessorKey: "uploaded_at",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("ponds:details.table.uploaded_at")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) => {
        const v = getValue()
        const d = new Date(v as string)
        return isNaN(d.getTime()) ? "—" : d.toLocaleString()
      },
    },

    {
      accessorKey: "uploader",
      header: t("ponds:details.table.uploaded_by"),
      cell: ({ getValue }) => getValue() ?? "",
    },

    {
      id: "actions",
      header: t("ponds:details.table.actions"),
      cell: ({ row }) => {
        const file = row.original
        return (
          <div className="flex gap-2">
            <DownloadSingleFileButton fileId={file.id} disabled={file.scan_status === "infected"} />

            {/* DELETE FILE */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("ponds:details.delete_file_title")}
                  </AlertDialogTitle>

                  <AlertDialogDescription>
                    {t("ponds:details.delete_file_message", { name: file.name })}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t("common:actions.cancel")}
                  </AlertDialogCancel>

                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => onDeleteFile(file.id)}
                  >
                    {t("common:actions.delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]

  // ----------------------------------------------------------------------------
  // Table state
  // ----------------------------------------------------------------------------

  const table = useReactTable({
    data: files,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  })

  const total = table.getFilteredRowModel().rows.length
  const { pageSize, pageIndex } = table.getState().pagination

  const start = total === 0 ? 0 : pageIndex * pageSize + 1
  const end = Math.min((pageIndex + 1) * pageSize, total)

  // ----------------------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------------------

  return (
    <div className="rounded-2xl border bg-background p-4">

      {/* SEARCH FIELD */}
      <div className="flex items-center justify-between mb-4">

        {/* LEFT: Search field */}
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t("ponds:details.table.filter_placeholder")}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* RIGHT: Reload button */}
        {showNewFilesBanner && (
          <Button
            size="icon"
            variant="outline"
            className="ml-4 hover:bg-muted transition animate-bounce"
            onClick={handleReloadClick}
            disabled={isReloading}
            title={t("ponds:details.reload_files")}
          >
              {isReloading ? (
                <RefreshCcw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
          </Button>
        )}

      </div>


      {/* TABLE */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-4 text-muted-foreground">
                {t("ponds:details.table.no_files")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* FOOTER / PAGINATION */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? t("common:pagination.empty")
            : t("common:pagination.showing", { start, end, total })}
        </p>

        <div className="flex gap-2">
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
  )
}
