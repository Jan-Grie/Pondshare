import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2Icon, DownloadIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function DownloadSingleFileButton({ fileId, disabled }: { fileId: number,   disabled?: boolean }) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = () => {
    if (disabled) return;
    setIsLoading(true);
    console.log("Preparing download for file ID:", fileId);
    toast.info(t("common:download.preparing"), {
      description: t("common:download.loading"),
      duration: 3000,
      style: {
        '--normal-bg': 'light-dark(var(--color-sky-600), var(--color-sky-400))',
        '--normal-text': 'var(--color-white)',
        '--normal-border': 'light-dark(var(--color-sky-600), var(--color-sky-400))'
      } as React.CSSProperties
    })    

    window.location.href = `/files/${fileId}/download`;

    setIsLoading(false);
    toast.success(t("common:download.started"), {
      description: t("common:download.in_progress"),
      style: {
        '--normal-bg': 'light-dark(var(--color-green-600), var(--color-green-400))',
        '--normal-text': 'var(--color-white)',
        '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
      } as React.CSSProperties
    })    
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      title={t("common:download.title")}
      onClick={handleDownload}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <Loader2Icon className="h-4 w-4 animate-spin" />
      ) : (
        <DownloadIcon className="h-4 w-4" />
      )}
    </Button>
  );
}

