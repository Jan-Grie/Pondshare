"use client";

import * as React from "react";
import { format } from "date-fns";

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
} from "@tanstack/react-table";

import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";
import { useTranslation, Trans } from "react-i18next";

import { destroy as destroyUpload } from "@/routes/ponds/upload-links";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import {
  Search,
  Link as LinkIcon,
  ShieldIcon,
  ShieldOff,
  Trash2Icon,
  ArrowUpDown,
  CloudUpload,
} from "lucide-react";

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
} from "@/components/ui/alert-dialog";

import CreateUploadLinkDialog from "@/pages/ponds/CreateUploadLinkDialog";
import EditUploadLinkDialog from "@/pages/ponds/EditUploadLinkDialog";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface UploadLink {
  id: number;
  name: string;
  created_at: string;
  expires_at: string | null;
  has_password: boolean;
  uploads: number;
  full_url: string;
}

interface Props {
  pondId: number;
  forcePasswordForLinks: boolean;
  forceexpirationdate: boolean;
  maxlinkduration: number;
  minLengthPassword: number;

  // Optional callbacks
  onCopyLink?: (url: string) => void;
  onUpdateLink?: (link: UploadLink) => void;
  onDeleteLink?: (id: number) => void;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function ExternalUploadLinksTable({
  pondId,
  forcePasswordForLinks,
  forceexpirationdate,
  minLengthPassword,
  maxlinkduration,
  onCopyLink,
  onUpdateLink,
  onDeleteLink,
}: Props) {
  const { t } = useTranslation();

  // UploadLinks now come directly from Inertia partial reload
  const page = usePage();
  const uploadLinks = page.props.uploadLinks as { items: UploadLink[] };
  const links = uploadLinks.items;

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("upload_link") ?? params.get("q") ?? "";
    setGlobalFilter(q);

    //TODO => Search Param läschen, damit bei reload nicht wieder darauf gefiltert wird
  }, []);

  // ---------------------------------------------------------------------------
  // COLUMNS
  // ---------------------------------------------------------------------------

  const columns: ColumnDef<UploadLink>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("Name")}
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) => getValue(),
    },

    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("Created_at")}
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) => format(new Date(getValue() as string), "dd.MM.yyyy"),
    },

    {
      accessorKey: "expires_at",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("Expires")}
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        if (!v) return "-";

        const date = new Date(v);
        const isExpired = date < new Date();

        return (
          <span className={isExpired ? "text-red-500 font-semibold" : ""}>
            {format(date, "dd.MM.yyyy")}
          </span>
        );
      },
    },

    {
      accessorKey: "has_password",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("Password")}
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
      accessorKey: "uploads",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("Uploads")}
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ getValue }) => getValue(),
    },

    // -------------------------------------------------------------------------
    // ACTIONS
    // -------------------------------------------------------------------------

    {
      id: "actions",
      header: t("Actions"),
      cell: ({ row }) => {
        const link = row.original;

        return (
          <div className="flex gap-2">

            {/* COPY */}
            <Button
              size="icon"
              variant="ghost"
              title={t("Copy Link")}
              onClick={() => {
                navigator.clipboard.writeText(link.full_url);
                toast.success(t("ponds:details.upload_links.copied"), {
                  style: {
                    '--normal-bg': 'light-dark(var(--color-green-600), var(--color-green-400))',
                    '--normal-text': 'var(--color-white)',
                    '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
                  } as React.CSSProperties                  
                }
              );
                onCopyLink?.(link.full_url);
              }}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>

            {/* EDIT */}
            <EditUploadLinkDialog
              pondId={pondId}
              link={link}
              forcePasswordForLinks={forcePasswordForLinks}
              forceExpirationDate={forceexpirationdate}
              minLengthPassword={minLengthPassword}
            />

            {/* DELETE */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("Are_you_sure")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    <Trans
                      i18nKey="delete_upload_link_confirm"
                      values={{ name: link.name }}
                      components={[<strong key="x" />]}
                    />
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>

                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => {
                      toast.info(t("ponds:details.upload_links.deleting"), {
                        style: {
                          "--normal-bg": "light-dark(var(--color-sky-600), var(--color-sky-400))",
                          "--normal-text": "var(--color-white)",
                          "--normal-border": "light-dark(var(--color-sky-600), var(--color-sky-400))",
                        } as React.CSSProperties,                        
                      });

                      router.delete(
                        destroyUpload({
                          pond: pondId,
                          uploadLink: link.id,
                        }),
                        {
                          preserveScroll: true,
                          preserveState: true,
                          onSuccess: () => {
                            router.reload({ only: ["uploadLinks"] });

                            toast.success(t("ponds:details.upload_links.deleted"), {
                              description: t("ponds:details.upload_links.delete_success_description"),
                              style: {
                                '--normal-bg': 'light-dark(var(--color-green-600), var(--color-green-400))',
                                '--normal-text': 'var(--color-white)',
                                '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
                              } as React.CSSProperties
                            });

                            onDeleteLink?.(link.id);
                          },
                          onError: () => {
                            toast.error(t("ponds:details.upload_links.delete_error"), {
                              description: t("ponds:details.upload_links.delete_error_description"),
                              style: {
                                '--normal-bg': 'light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))',
                                '--normal-text': 'var(--color-white)',
                                '--normal-border': 'transparent'
                              } as React.CSSProperties
                            });
                          },
                        }
                      );
                    }}
                  >
                    {t("Yes_delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  // ---------------------------------------------------------------------------
  // TABLE INSTANCE
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
  });

  const total = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, total);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-2">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center text-xl font-semibold gap-2">
          <CloudUpload className="h-5 w-5" />
          {t("Upload_links")}
        </h2>

        <CreateUploadLinkDialog
          pondId={pondId}
          forcePasswordForLinks={forcePasswordForLinks}
          minLengthPassword={minLengthPassword}
          maxlinkduration={maxlinkduration}
          forceexpirationdate={forceexpirationdate}
          onNewLink={() => {
            router.reload({ only: ["uploadLinks"] });
            table.setPageIndex(0);
          }}
        />
      </div>

      {/* SEARCH */}
      <div className="rounded-2xl border bg-background p-4 shadow-sm">
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t("ponds:details.upload_links.filter_placeholder")}
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
                <TableCell className="text-center text-muted-foreground py-4" colSpan={columns.length}>
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
  );
}
