"use client"

import * as React from "react"
import { format } from "date-fns"
import { destroy } from "@/routes/ponds/share-links"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table"
import { usePage } from "@inertiajs/react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { router } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Link as LinkIcon, ShieldIcon, Trash2Icon, ArrowUpDown, ShieldOff } from "lucide-react"

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

import CreateShareLinkDialog from "@/components/CreateShareLinkDialog"
import EditShareLinkDialog from "@/pages/ponds/EditShareLinkDialog"

import { toast } from "sonner"
import { useTranslation, Trans } from "react-i18next"

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ShareLink {
  id: number
  name: string
  created_at: string
  expires_at: string | null
  has_password: boolean
  downloads: number
  full_url: string
}

interface Props {
  pondId: number
  // initialLinks: ShareLink[]
  forcePasswordForLinks: boolean
  forceExpirationDate: boolean
  minLengthPassword: number

  // Wayfinder-Style props:
  onDeleteLink: (id: number) => void
  onUpdateLink?: (link: ShareLink) => void
  onCopyLink?: (url: string) => void
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function PondShareLinksTable({
  pondId,
  // initialLinks,
  forcePasswordForLinks,
  forceExpirationDate,
  minLengthPassword,
  onDeleteLink,
  onUpdateLink,
  onCopyLink,
}: Props) {
  const { t } = useTranslation()
  const page = usePage()
  const shareLinks = page.props.shareLinks as { items: ShareLink[] }
  const links = shareLinks.items
  // const [links, setLinks] = React.useState<ShareLink[]>(initialLinks)  
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

    React.useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("share_link") ?? params.get("q") ?? "";
      setGlobalFilter(q);
  
      //TODO => Search Param läschen, damit bei reload nicht wieder darauf gefiltert wird
    }, []);

  // ---------------------------------------------------------------------------
  // COLUMN DEFINITIONS
  // ---------------------------------------------------------------------------

  const columns: ColumnDef<ShareLink>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("ponds:details.share_links.table.name")}
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) => getValue(),
    },

    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("ponds:details.share_links.table.created_at")}
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) => format(new Date(getValue() as string), "dd.MM.yyyy"),
    },

    {
      accessorKey: "expires_at",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("ponds:details.share_links.table.expires_at")}
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) => {
        const v = getValue() as string | null
        return v ? format(new Date(v), "dd.MM.yyyy") : "-"
      },
    },

    {
      accessorKey: "has_password",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("ponds:details.share_links.table.password")}
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) =>
        getValue() ? (
          <Badge className='border-none bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 focus-visible:outline-none dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5'>
            <ShieldIcon className="h-4 w-4 text-green-600" />                  
            {t("common:states.active")}            
          </Badge>
        ) : (
          <Badge className='bg-destructive/20 [a&]:hover:bg-destructive/5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive border-none focus-visible:outline-none'>
            <ShieldOff className="h-4 w-4 text-destructive" />                  
            {t("common:states.inactive")}            
          </Badge>
        ),
    },

    {
      accessorKey: "downloads",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("ponds:details.share_links.table.downloads")}
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) => getValue(),
    },

    {
      id: "actions",
      header: t("ponds:details.share_links.table.actions"),
      cell: ({ row }) => {
        const link = row.original

        return (
          <div className="flex gap-2">
            {/* Copy */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(link.full_url)
                toast.success(t("ponds:details.share_links.copied"), {
                  style: {
                    "--normal-bg": "light-dark(var(--color-green-600), var(--color-green-400))",
                    "--normal-text": "var(--color-white)",
                    "--normal-border": "light-dark(var(--color-green-600), var(--color-green-400))",
                  } as React.CSSProperties,                  
                })
                onCopyLink?.(link.full_url)
              }}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>

            {/* Edit Dialog */}
            <EditShareLinkDialog
              pondId={pondId}
              link={link}
              forcePasswordForLinks={forcePasswordForLinks}
              minLengthPassword={minLengthPassword}
              forceExpirationDate={forceExpirationDate}
            />


            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("ponds:details.share_links.delete_title")}
                  </AlertDialogTitle>

                  <AlertDialogDescription>
                    <Trans
                      i18nKey="ponds:details.share_links.delete_message"
                      values={{ name: link.name }}
                      components={{ strong: <strong /> }}
                    />
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t("common:actions.cancel")}
                  </AlertDialogCancel>

                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90 text-white"
                    onClick={() => {
                        toast.info(t("ponds:details.share_links.deleting"), {
                            style: {
                                "--normal-bg":
                                    "light-dark(var(--color-sky-600), var(--color-sky-400))",
                                "--normal-text": "var(--color-white)",
                                "--normal-border":
                                    "light-dark(var(--color-sky-600), var(--color-sky-400))",
                            } as React.CSSProperties,
                        });

                        router.delete(
                            destroy({
                                pond: pondId,
                                share_link: link.id,
                            }),
                            {
                                preserveScroll: true,
                                preserveState: true,

                                onSuccess: () => {
                                    // setLinks((ls) => ls.filter((l) => l.id !== link.id));
                                    router.reload({ only: ['shareLinks'] })

                                    toast.success(t("ponds:details.share_links.deleted"), {
                                        description: t(
                                            "ponds:details.share_links.deleted_description"
                                        ),
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
                                    toast.error(
                                        t("ponds:details.share_links.delete_error"),
                                        {
                                            style: {
                                                "--normal-bg":
                                                    "light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))",
                                                "--normal-text": "var(--color-white)",
                                                "--normal-border": "transparent",
                                            } as React.CSSProperties,
                                        }
                                    );
                                },
                            }
                        );
                    }}
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

  // ---------------------------------------------------------------------------
  // Table Instance
  // ---------------------------------------------------------------------------

  const table = useReactTable({
    data: links,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const total = table.getFilteredRowModel().rows.length
  const { pageIndex, pageSize } = table.getState().pagination

  const start = total === 0 ? 0 : pageIndex * pageSize + 1
  const end = Math.min((pageIndex + 1) * pageSize, total)

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          {t("ponds:details.share_links.title")}
        </h2>

        {/* Create new link */}
        <CreateShareLinkDialog
          pondId={pondId}
          forcePasswordForLinks={forcePasswordForLinks}
          forceExpirationDate={forceExpirationDate}
          minLengthPassword={minLengthPassword}
          onNewLink={(newLink) => {
            // setLinks((ls) => [newLink, ...ls])
            router.reload({ only: ['shareLinks'] })
            table.setPageIndex(0)
          }}
        />
      </div>

      <div className="rounded-2xl border bg-background p-4">
        {/* SEARCH */}
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t("ponds:details.share_links.filter_placeholder")}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
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
                <TableCell colSpan={columns.length} className="text-center py-4">
                  {t("ponds:details.share_links.no_entries")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* PAGINATION */}
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
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              {t("common:actions.previous")}
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              {t("common:actions.next")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
