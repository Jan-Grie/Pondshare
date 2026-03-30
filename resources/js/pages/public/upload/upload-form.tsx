import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatBytes } from '@/lib/formatBytes';
import { deleteMethod } from '@/routes/uploads/files';
import { Head } from '@inertiajs/react';
import { CheckCircle2, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';

interface UploadFormProps {
    token: string;
    pond: {
        id: number;
        name: string;
    };
    upload_link: {
        id: number;
        name: string;
        expires_at: string | null;
    };
}

interface UploadingFile {
    uid: string;
    name: string;
    size: number;
    progress: number;
    status: 'uploading' | 'error';
    errorMessage?: string;
}

interface UploadedFile {
    id: number;
    name: string;
    extension: string;
    size: number;
    deleting?: boolean;
}

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export default function UploadForm({ token, pond, upload_link }: UploadFormProps) {
    const { t } = useTranslation('public');
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

    const uploadSingleFile = useCallback(
        (rawFile: File, uid: string) => {
            return new Promise<UploadedFile>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                const formData = new FormData();
                formData.append('file', rawFile);

                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const progress = Math.round((e.loaded / e.total) * 100);
                        setUploadingFiles((prev) =>
                            prev.map((f) => (f.uid === uid ? { ...f, progress } : f)),
                        );
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            resolve(data.files[0] as UploadedFile);
                        } catch {
                            reject(new Error(t('upload.form.error_invalid_response')));
                        }
                    } else {
                        let message = t('upload.form.error_upload_failed');
                        try {
                            const data = JSON.parse(xhr.responseText);
                            if (data?.message) message = data.message;
                        } catch {}
                        reject(new Error(message));
                    }
                });

                xhr.addEventListener('error', () => reject(new Error(t('upload.form.error_network'))));

                xhr.open('POST', `/uploads/${token}/upload`);
                xhr.setRequestHeader('X-XSRF-TOKEN', getCsrfToken());
                xhr.setRequestHeader('Accept', 'application/json');
                xhr.send(formData);
            });
        },
        [token, t],
    );

    const handleFiles = useCallback(
        (files: File[]) => {
            files.forEach((rawFile) => {
                const uid = crypto.randomUUID();

                setUploadingFiles((prev) => [
                    ...prev,
                    { uid, name: rawFile.name, size: rawFile.size, progress: 0, status: 'uploading' },
                ]);

                uploadSingleFile(rawFile, uid)
                    .then((uploaded) => {
                        setUploadingFiles((prev) => prev.filter((f) => f.uid !== uid));
                        setUploadedFiles((prev) => [...prev, uploaded]);
                    })
                    .catch((err: Error) => {
                        setUploadingFiles((prev) =>
                            prev.map((f) =>
                                f.uid === uid
                                    ? { ...f, status: 'error', errorMessage: err.message }
                                    : f,
                            ),
                        );
                    });
            });
        },
        [uploadSingleFile],
    );

    const dismissError = (uid: string) => {
        setUploadingFiles((prev) => prev.filter((f) => f.uid !== uid));
    };

    const deleteFile = async (fileId: number) => {
        setUploadedFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, deleting: true } : f)),
        );

        try {
            const res = await fetch(deleteMethod.url({ token, file: fileId }), {
                method: 'DELETE',
                headers: {
                    'X-XSRF-TOKEN': getCsrfToken(),
                    Accept: 'application/json',
                },
            });

            if (res.ok) {
                setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
            } else {
                setUploadedFiles((prev) =>
                    prev.map((f) => (f.id === fileId ? { ...f, deleting: false } : f)),
                );
            }
        } catch {
            setUploadedFiles((prev) =>
                prev.map((f) => (f.id === fileId ? { ...f, deleting: false } : f)),
            );
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleFiles,
        multiple: true,
    });

    const hasActivity = uploadingFiles.length > 0 || uploadedFiles.length > 0;

    return (
        <div className="flex min-h-svh items-center justify-center bg-muted p-6">
            <Head title={t('upload.form.title', { name: pond.name })} />
            <Card className="w-full max-w-xl rounded-xl">
                <CardContent className="p-6">
                    <div className="mb-6">
                        <h1 className="text-xl font-semibold">{upload_link.name}</h1>
                        <p className="text-sm text-muted-foreground">{t('upload.form.description', { name: pond.name })}</p>
                    </div>

                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={[
                            'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors',
                            isDragActive
                                ? 'border-primary bg-primary/5'
                                : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50',
                        ].join(' ')}
                    >
                        <input {...getInputProps()} />
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">
                                {isDragActive
                                    ? t('upload.form.drop_active')
                                    : t('upload.form.drop_idle')}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t('upload.form.any_file_type')}
                            </p>
                        </div>
                    </div>

                    {/* File activity */}
                    {hasActivity && (
                        <div className="mt-4 divide-y">
                            {/* Uploading */}
                            {uploadingFiles.map((f) => (
                                <div key={f.uid} className="py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex justify-between gap-2 text-sm">
                                                <span className="truncate font-medium">{f.name}</span>
                                                {f.status === 'uploading' ? (
                                                    <span className="shrink-0 text-muted-foreground">
                                                        {f.progress}%
                                                    </span>
                                                ) : (
                                                    <span className="shrink-0 text-destructive text-xs">
                                                        {f.errorMessage ?? t('upload.form.error_fallback')}
                                                    </span>
                                                )}
                                            </div>
                                            {f.status === 'uploading' ? (
                                                <Progress value={f.progress} className="h-1.5" />
                                            ) : (
                                                <div className="h-1.5 rounded-full bg-destructive/20" />
                                            )}
                                        </div>
                                        {f.status === 'error' && (
                                            <button
                                                onClick={() => dismissError(f.uid)}
                                                className="shrink-0 text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Uploaded */}
                            {uploadedFiles.map((f) => (
                                <div key={f.id} className="flex items-center gap-3 py-3">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                        {f.name}.{f.extension}
                                    </span>
                                    <span className="shrink-0 text-sm text-muted-foreground">
                                        {formatBytes(f.size)}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                        disabled={f.deleting}
                                        onClick={() => deleteFile(f.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>

                {uploadedFiles.length > 0 && (
                    <CardFooter className="px-6 pb-6 pt-0">
                        <p className="text-xs text-muted-foreground">
                            {t('upload.form.uploaded_count', { count: uploadedFiles.length })}
                            {' '}
                            {t('upload.form.uploaded_hint')}
                        </p>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
