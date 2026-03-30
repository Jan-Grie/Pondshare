"use client"

import React, { use, useCallback, useEffect, useState } from "react"
import {
    Head,
    router,
    usePage,
} from "@inertiajs/react"

import AppLayout from "@/layouts/app-layout"
import { BreadcrumbItem } from "@/types"

import axios, { CancelTokenSource } from "axios"
import { useDropzone } from "react-dropzone"
import { format } from "date-fns"

import { useTranslation, Trans } from "react-i18next"
import { cn } from "@/lib/utils"
import { formatBytes } from "@/lib/formatBytes"


// UI
import { Button, buttonVariants  } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Icons
import {
    UploadCloud,
    FolderOpen,
    Trash2,
    FileIcon,
    Pencil,
    TriangleAlertIcon,
} from "lucide-react"

// Child Components
import PondFilesTable from "@/pages/ponds/PondFilesTable"
import PondShareLinksTable from "@/pages/ponds/PondShareLinksTable"
import ExternalUploadLinksTable from "@/pages/ponds/ExternalUploadLinksTable"
import PreviewDialog from "@/components/PreviewDialog"

// Routes
import { show, destroy as destroyPond } from "@/routes/ponds"
import { destroy as destroyFile } from "@/routes/ponds/files"
import { preview as previewFile } from "@/routes/files"
import { update as updatePond } from "@/routes/ponds"
import { downloadZip } from "@/routes/ponds"
import { DownloadZipButton } from "@/components/download-zip-button"
import { toast } from "sonner"
import { Label } from "@/components/ui/label";
import { useEcho, echo } from "@laravel/echo-react";
import { Deferred } from '@inertiajs/react'
import PondFilesTableSkeleton from "./components/files/PondFilesTableSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface FileItem {
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

interface Pond {
    id: number
    name: string
    created_at: string
    size_bytes: number
}

interface PondDetailProps {
    pond: Pond
    files?: FileItem[]
    shareLinks: { items: any[] }
    uploadLinks: { items: any[] }
    force_password_for_links: boolean
    min_length_password: number
    max_link_duration: number
    force_expiration_date: boolean
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function PondDetailedPage(props: PondDetailProps) {
    const { pond, shareLinks, uploadLinks } = props

    const { t } = useTranslation()

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t("ponds:title"),
            href: show.url(pond.id).replace(`/${pond.id}`, ""), // → /ponds
        },
        {
            title: pond.name,
            href: show.url(pond.id),
        },
    ]

    // -------------------------------------------------------------------------
    // Files State
    // -------------------------------------------------------------------------
    // const [files, setFiles] = useState<FileItem[]>(props.files)
    const lastFilesRef = React.useRef<FileItem[] | null>(null)
    if (props.files !== undefined) {
        lastFilesRef.current = props.files
    }
    const files = props.files ?? lastFilesRef.current ?? []

    const hasFiles = files.length > 0

    const hasDownloadableFiles = files.some(
        (file) => file.scan_status !== "infected"
    )

    const disableDownload = files.length === 0 || !hasDownloadableFiles

    const totalFiles = files.length
    const totalSizeBytes = files.reduce((sum, f) => sum + f.size, 0)

    const [showNewFilesBanner, setShowNewFilesBanner] = useState(false)
    const showNewFilesRef = React.useRef(showNewFilesBanner);
    useEffect(() => {
    showNewFilesRef.current = showNewFilesBanner;
    }, [showNewFilesBanner]);


    const onReloadFiles = async () => {
        console.log("Reload files called")
        await router.reload({ only: ["files"] })
        setShowNewFilesBanner(false)
    }

    // -------------------------------------------------------------------------
    // Preview Modal
    // -------------------------------------------------------------------------
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewMime, setPreviewMime] = useState("")
    const [previewName, setPreviewName] = useState("")
    const [previewUrl, setPreviewUrl] = useState("")

    // -------------------------------------------------------------------------
    // Upload State
    // -------------------------------------------------------------------------
    const [uploading, setUploading] = useState(false)
    const [uploadErrors, setUploadErrors] = useState<string[]>([])
    const [uploadPercent, setUploadPercent] = useState(0)
    const [uploadSpeed, setUploadSpeed] = useState("0 B/s")
    const [uploadEta, setUploadEta] = useState("00:00")
    const [cancelSource, setCancelSource] = useState<CancelTokenSource | null>(null)

    // ETA helper
    const humanTime = (sec: number) => {
        if (!isFinite(sec) || sec <= 0) return "00:00"
        const m = Math.floor(sec / 60)
        const s = Math.floor(sec % 60)
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    }

    // -------------------------------------------------------------------------
    // Upload Logic
    // -------------------------------------------------------------------------
    const CHUNK_SIZE = 5

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!acceptedFiles.length) return
    
        setUploading(true)
        setUploadErrors([])
        setUploadPercent(0)
        setUploadSpeed("0 B/s")
        setUploadEta("00:00")

        const source = axios.CancelToken.source()
        setCancelSource(source)

        const totalBytes = acceptedFiles.reduce((s, f) => s + f.size, 0)
        let loadedAll = 0
        const start = Date.now()

        const batches: File[][] = []
        for (let i = 0; i < acceptedFiles.length; i += CHUNK_SIZE) {
            batches.push(acceptedFiles.slice(i, i + CHUNK_SIZE))
        }

        try {
            for (const batch of batches) {
                let lastLoaded = 0
                let lastTime = Date.now()

                const formData = new FormData()
                batch.forEach((f) => formData.append("files[]", f))
                formData.append("pond_id", String(pond.id))

                const res = await axios.post(`/ponds/${pond.id}/files`, formData, {
                    cancelToken: source.token,
                    headers: { "Content-Type": "multipart/form-data", 'X-Socket-ID': echo().socketId() },

                    onUploadProgress: (e) => {
                        const now = Date.now()
                        const dt = (now - lastTime) / 1000
                        const diff = e.loaded - lastLoaded

                        const speed = diff / dt
                        setUploadSpeed(`${formatBytes(speed)}/s`)

                        loadedAll += diff
                        setUploadPercent(Math.round((loadedAll / totalBytes) * 100))

                        const elapsed = (now - start) / 1000
                        const speedAvg = loadedAll / elapsed
                        const eta = (totalBytes - loadedAll) / speedAvg
                        setUploadEta(humanTime(eta))

                        lastLoaded = e.loaded
                        lastTime = now
                    },
                })

                // const added: FileItem[] = res.data.files
                // setFiles((prev) => [...added, ...prev])
                toast.info(t("ponds:details.new_files_ready"), {                    
                    duration: 3000,
                    style: {
                    "--normal-bg": "light-dark(var(--color-sky-600), var(--color-sky-400))",
                    "--normal-text": "var(--color-white)",
                    "--normal-border": "light-dark(var(--color-sky-600), var(--color-sky-400))",
                    } as React.CSSProperties,
                });


                // router.reload({ only: ["files"] })
                onReloadFiles()
            }
        } catch (err: any) {
            if (axios.isCancel(err)) {
                setUploadErrors([t("ponds:details.upload_canceled")])
            } else {
                setUploadErrors([err.response?.data?.message ?? err.message])
            }
        } finally {
            setUploading(false)
            setCancelSource(null)
        }
    }, [pond.id, t])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        disabled: uploading,
        maxSize: 5 * 1024 * 1024 * 1024, // 5 GB
    })

    const [updating, setUpdating] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    const handleDialogOpenChange = (open: boolean) => {
        setEditDialogOpen(open);
        if (!open) {
            setErrors({});
        }
    };  

    const handleUpdatePond = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUpdating(true);
        
        const formData = new FormData(e.currentTarget);
        const newName = formData.get("pond_name") as string;

        router.put(
            updatePond.url(pond.id),
            { name: newName },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                toast.success(t("ponds:details.update_success"), {
                        style: {
                        "--normal-bg": "light-dark(var(--color-green-600), var(--color-green-400))",
                        "--normal-text": "var(--color-white)",
                        "--normal-border": "light-dark(var(--color-green-600), var(--color-green-400))",
                        } as React.CSSProperties,
                    });
                    router.reload({ only: ["pond"] });
                    setUpdating(false);
                    setEditDialogOpen(false);
                },
                onError: (errors: any) => {
                    const formattedErrors: Record<string, string[]> = {};
                    Object.keys(errors).forEach((key) => {
                        const value = errors[key];
                        formattedErrors[key] = Array.isArray(value) ? value : [String(value)];
                    });
                    setErrors(formattedErrors);
                    
                    Object.values(formattedErrors)
                        .flat()
                        .forEach((msg) =>
                            toast.error(t("common:error.unknown"), {
                                description: msg,
                                style: {
                                "--normal-bg":
                                    "light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))",
                                "--normal-text": "var(--color-white)",
                                "--normal-border": "transparent",
                                } as React.CSSProperties,
                            })
                        );
                    setUpdating(false);
                },
            }
        );
    };

    useEcho(
        `pond.${pond.id}`,
        ".file.uploaded", 
        (e: any) => {
            setShowNewFilesBanner(true)
        },
    );  

    useEcho(
    `pond.${pond.id}`,
    '.file.scan.finished',
    () => {
        if (!showNewFilesRef.current) {
        onReloadFiles();
        }
    }
    );

    const [filesLoadedOnce, setFilesLoadedOnce] = useState(false)

    useEffect(() => {
    if (props.files) {
        setFilesLoadedOnce(true)
    }
    }, [props.files])

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pond.name} />

            <div className="p-4 space-y-10">

                {/* -------------------------------------------------------------- */}
                {/* HEADER */}
                {/* -------------------------------------------------------------- */}
                <div className="rounded-2xl border bg-background p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                            <h1 className="text-3xl font-bold flex items-center gap-2 truncate">
                                <FolderOpen className="h-8 w-8 shrink-0" />
                                <span className="truncate">{pond.name}</span>
                            </h1>


                            {!filesLoadedOnce ? (
                                <Deferred data="files" fallback={<Skeleton className="h-4 w-[250px]" />}>
                                <p className="text-sm text-muted-foreground">
                                {t("ponds:details.summary", {
                                    count: totalFiles,
                                    date: format(new Date(pond.created_at), "dd.MM.yyyy"),
                                    size: formatBytes(totalSizeBytes),
                                })}
                                </p>
                                </Deferred>      
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                {t("ponds:details.summary", {
                                    count: totalFiles,
                                    date: format(new Date(pond.created_at), "dd.MM.yyyy"),
                                    size: formatBytes(totalSizeBytes),
                                })}
                                </p>
                            )}               
                        </div>

                        <div className="flex items-center gap-2">
                            <Dialog open={editDialogOpen} onOpenChange={handleDialogOpenChange}>                                
                                    <DialogTrigger asChild>
                                        <Button variant="outline">
                                            <Pencil />                                        
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                    <form onSubmit={handleUpdatePond}>
                                    <DialogHeader>
                                        <DialogTitle>{t("ponds:details.edit_pond_title")}</DialogTitle>
                                        {/* <DialogDescription>
                                            {t("ponds:details.edit_pond_description")}
                                        </DialogDescription> */}
                                    </DialogHeader>
                                    <div className="grid gap-4 mt-3">
                                        <div className="grid gap-3">   
                                            <Label className="text-sm font-medium leading-none">
                                                {t("ponds:details.edit_pond_name_label")}
                                            </Label>                                 
                                            <Input 
                                                id="pond_name" 
                                                name="pond_name" 
                                                defaultValue={pond.name} 
                                                disabled={updating}
                                                aria-invalid={!!errors.name}
                                            />
                                            {errors.name && <p className="text-red-600 text-sm">{errors.name[0]}</p>}
                                        </div>
                                    </div>
                                    <DialogFooter className="mt-2">
                                        <DialogClose asChild>
                                        <Button variant="outline">{t("common:actions.cancel")}</Button>
                                        </DialogClose>
                                            <Button type="submit" disabled={updating}>
                                                {updating ? t("common:actions.saving") : t("common:actions.save")}
                                            </Button>
                                    </DialogFooter>
                                    </form>
                                    </DialogContent>
                            </Dialog>                            

                            {/* DELETE POND BUTTON */}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        {t("ponds:details.delete_button")}
                                    </Button>
                                </AlertDialogTrigger>

                                <AlertDialogContent>
                                    <AlertDialogHeader className="items-center text-center">
                                        <div className="bg-destructive/20 dark:bg-destructive/35 mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
                                            <TriangleAlertIcon className="text-destructive size-6" />
                                        </div>
                                        <AlertDialogTitle>
                                            {t("ponds:details.delete_title")}
                                        </AlertDialogTitle>

                                        <AlertDialogDescription>
                                            <Trans
                                                i18nKey="ponds:details.delete_text"
                                                values={{ name: pond.name }}
                                                components={{ strong: <strong /> }}
                                            />
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    <AlertDialogFooter>
                                        <AlertDialogCancel>
                                            {t("common:actions.cancel")}
                                        </AlertDialogCancel>

                                        <AlertDialogAction
                                            className="bg-destructive dark:bg-destructive/60 hover:bg-destructive text-white"
                                            onClick={() =>
                                                router.delete(destroyPond.url(pond.id))
                                            }
                                        >
                                            {t("ponds:details.delete_confirm")}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </div>

                {/* -------------------------------------------------------------- */}
                {/* UPLOAD ZONE */}
                {/* -------------------------------------------------------------- */}
                <div
                    {...getRootProps()}
                    className={cn(
                        "rounded-2xl border border-dashed p-10 text-center transition cursor-pointer",
                        isDragActive
                            ? "bg-muted/40"
                            : uploading
                            ? "bg-muted/10 cursor-not-allowed"
                            : "bg-muted/30 hover:bg-muted/40"
                    )}
                >
                    <input {...getInputProps()} />

                    <UploadCloud className="mx-auto mb-3 h-10 w-10" />

                    {uploading ? (
                        <p className="font-medium text-blue-600 text-base">
                            {t("ponds:details.upload_running")}
                        </p>
                    ) : isDragActive ? (
                        <p className="font-medium text-base">
                            {t("ponds:details.upload_drag_active")}
                        </p>
                    ) : (
                        <p className="font-medium text-base">
                            {t("ponds:details.upload_zone_idle")}
                        </p>
                    )}
                </div>

                {/* Upload Progress */}
                {uploading && (
                    <div className="mt-2 space-y-2">
                        
                        <div className="flex items-center gap-4">
                            <progress
                                value={uploadPercent}
                                max={100}
                                className="flex-1 h-2 rounded bg-muted [&::-webkit-progress-bar]:rounded [&::-webkit-progress-value]:rounded"
                            />
                            <p className="text-sm text-muted-foreground tabular-nums">
                                {uploadPercent}%
                            </p>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                            {t("ponds:details.upload_speed", { speed: uploadSpeed })} ·{" "}
                            {t("ponds:details.upload_eta", { eta: uploadEta })}
                        </p>
                        
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-1"
                            onClick={() => cancelSource?.cancel()}
                        >
                            {t("ponds:details.upload_cancel")}
                        </Button>
                    </div>
                )}


                {uploadErrors.length > 0 && (
                    <ul className="text-red-600 list-disc pl-5">
                        {uploadErrors.map((e, i) => (
                            <li key={i}>{e}</li>
                        ))}
                    </ul>
                )}

                {/* -------------------------------------------------------------- */}
                {/* FILES TABLE */}
                {/* -------------------------------------------------------------- */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="flex items-center text-xl font-semibold">
                            <FileIcon className="mr-2 h-5 w-5" /> {t("ponds:details.files_title")}
                        </h2>

                        < DownloadZipButton pondId={pond.id} pondName={pond.name} disabled={disableDownload} />
                    </div>

                
                    {!filesLoadedOnce ? (
                    <Deferred data="files" fallback={<PondFilesTableSkeleton />}>
                    <PondFilesTable
                        files={files}
                        showNewFilesBanner={showNewFilesBanner}
                        onPreview={(file) => {
                            setPreviewMime(file.mime_type)
                            setPreviewName(file.name)
                            setPreviewUrl(previewFile.url(file.id))
                            setPreviewOpen(true)
                        }}
                        onReloadFiles={onReloadFiles}
                        onDeleteFile={(id) =>
                            router.delete(destroyFile.url(id), {
                                preserveScroll: true,
                                preserveState: true,
                                onSuccess: () =>
                                    // setFiles((prev) =>
                                    //     prev.filter((f) => f.id !== id)
                                    // ),
                                    router.reload({ only: ["files"]})
                            })
                        }
                    />
                    </Deferred>
                    ) : (
                    <PondFilesTable
                        files={files}
                        showNewFilesBanner={showNewFilesBanner}
                        onPreview={(file) => {
                            setPreviewMime(file.mime_type)
                            setPreviewName(file.name)
                            setPreviewUrl(previewFile.url(file.id))
                            setPreviewOpen(true)
                        }}
                        onReloadFiles={onReloadFiles}
                        onDeleteFile={(id) =>
                            router.delete(destroyFile.url(id), {
                                preserveScroll: true,
                                preserveState: true,
                                onSuccess: () =>
                                    // setFiles((prev) =>
                                    //     prev.filter((f) => f.id !== id)
                                    // ),
                                    router.reload({ only: ["files"]})
                            })
                        }
                    />
                    )}
                </div>

                {/* -------------------------------------------------------------- */}
                {/* SHARE LINKS */}
                {/* -------------------------------------------------------------- */}
                <PondShareLinksTable
                    pondId={pond.id}
                    // initialLinks={shareLinks.items}
                    forcePasswordForLinks={props.force_password_for_links}
                    minLengthPassword={props.min_length_password}
                    forceExpirationDate={props.force_expiration_date}
                    onDeleteLink={(id) => {
                        console.log("Delete link", id)                        
                    }}
                />

                {/* -------------------------------------------------------------- */}
                {/* EXTERNAL UPLOAD LINKS */}
                {/* -------------------------------------------------------------- */}
                <ExternalUploadLinksTable
                    minLengthPassword={props.min_length_password}
                    pondId={pond.id}
                    // initialLinks={uploadLinks.items}
                    forcePasswordForLinks={props.force_password_for_links}
                    maxlinkduration={props.max_link_duration}
                    forceexpirationdate={props.force_expiration_date}
                />

                {/* -------------------------------------------------------------- */}
                {/* PREVIEW */}
                {/* -------------------------------------------------------------- */}
                <PreviewDialog
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    title={previewName}
                    mimeType={previewMime}
                    url={previewUrl}
                />
            </div>
        </AppLayout>
    )
}
