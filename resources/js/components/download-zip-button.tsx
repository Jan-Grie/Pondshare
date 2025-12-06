import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2Icon, FolderDownIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function DownloadZipButton({ pondId, pondName }: { pondId: number; pondName: string }) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);

    toast(t("common:zip_download.preparing"), {
      description: t("common:zip_download.loading"),
      duration: 3000,
      style: {
        '--normal-bg': 'light-dark(var(--color-sky-600), var(--color-sky-400))',
        '--normal-text': 'var(--color-white)',
        '--normal-border': 'light-dark(var(--color-sky-600), var(--color-sky-400))'
      } as React.CSSProperties
    });

    

    let downloadFailed = false;
    try {
      
      const response = await fetch(`/ponds/${pondId}/download-zip`);
      if (!response.ok) throw new Error("Zip download failed");

      
      const blob = await response.blob();

      
      
      const filename = `${pondName}.zip`;

      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename; 
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      downloadFailed = true;
      toast.error(t("common:zip_download.error"), {
        description: t("common:zip_download.error_description"),
        style: {
          '--normal-bg':
            'light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))',
          '--normal-text': 'var(--color-white)',
          '--normal-border': 'transparent'
        } as React.CSSProperties        
      });
    } finally {    
      setIsLoading(false);
      if (!downloadFailed) {
        toast.success(t("common:zip_download.success"), {
          description: t("common:zip_download.success_description"),
          style: {
            '--normal-bg': 'light-dark(var(--color-green-600), var(--color-green-400))',
            '--normal-text': 'var(--color-white)',
            '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
          } as React.CSSProperties          
        });
      }
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handleDownload} disabled={isLoading}>
      {isLoading ? (
        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FolderDownIcon className="mr-2 h-4 w-4" />
      )}
      {t("ponds:details.download_zip")}
    </Button>
  );
}
