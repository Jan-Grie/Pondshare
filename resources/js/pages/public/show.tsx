import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { formatBytes } from '@/lib/formatBytes';
import { downloadFile, downloadZip } from '@/routes/shares';
import { Head } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ShareFile {
    id: number;
    name: string;
    extension: string;
    mime_type: string;
    previewable: boolean;
    size: number;
}

interface ShowProps {
    token: string;
    pond: {
        id: number;
        name: string;
        file_count: number;
        total_size_bytes: number;
    };
    files: ShareFile[];
}

export default function Show({ token, pond, files }: ShowProps) {
    const { t } = useTranslation('public');
    const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());

    const allSelected = files.length > 0 && selectedFiles.size === files.length;
    const someSelected = selectedFiles.size > 0 && !allSelected;

    const toggleFile = (id: number) => {
        setSelectedFiles((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (allSelected) {
            setSelectedFiles(new Set());
        } else {
            setSelectedFiles(new Set(files.map((f) => f.id)));
        }
    };

    const buildZipUrl = () => {
        const base = downloadZip.url(token);
        if (!someSelected) return base;
        const params = new URLSearchParams();
        selectedFiles.forEach((id) => params.append('file_ids[]', id.toString()));
        return `${base}?${params.toString()}`;
    };

    const zipButtonLabel = someSelected
        ? t('share.show.download_selected', { count: selectedFiles.size })
        : t('share.show.download_all');

    return (
        <div className="flex min-h-svh items-center justify-center bg-muted p-6">
            <Head title={pond.name} />
            <Card className="w-full max-w-xl rounded-xl">
                <CardContent className="p-6">
                    <div className="mb-4">
                        <h1 className="text-xl font-semibold">{pond.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            {t('share.show.file', { count: pond.file_count })} ·{' '}
                            {t('share.show.total_size')} {formatBytes(pond.total_size_bytes)}
                        </p>
                    </div>

                    {files.length > 0 && (
                        <>
                            <div className="flex items-center gap-3 border-b py-2">
                                <Checkbox
                                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                                    onCheckedChange={toggleAll}
                                />
                                <span className="text-sm text-muted-foreground">{t('share.show.select_all')}</span>
                            </div>

                            <div className="max-h-96 divide-y overflow-y-auto">
                                {files.map((file) => (
                                    <div key={file.id} className="flex items-center gap-3 py-3">
                                        <Checkbox
                                            checked={selectedFiles.has(file.id)}
                                            onCheckedChange={() => toggleFile(file.id)}
                                        />
                                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                            {file.name}.{file.extension}
                                        </span>
                                        <span className="shrink-0 text-sm text-muted-foreground">
                                            {formatBytes(file.size)}
                                        </span>
                                        <a href={downloadFile.url({ token, file: file.id })}>
                                            <Button size="sm">
                                                <Download className="mr-1.5 h-4 w-4" />
                                                Download
                                            </Button>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {files.length === 0 && (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            {t('share.show.no_files')}
                        </p>
                    )}
                </CardContent>

                {files.length > 0 && (
                    <CardFooter className="px-6 pb-6 pt-0">
                        <a href={buildZipUrl()} className="w-full">
                            <Button className="w-full">
                                <Download className="mr-2 h-4 w-4" />
                                {zipButtonLabel}
                            </Button>
                        </a>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
