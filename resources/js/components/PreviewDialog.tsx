// resources/js/components/preview-dialog.tsx

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next";  

interface PreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  mimeType: string
  url: string
}

export default function PreviewDialog({ open, onOpenChange, title, mimeType, url }: PreviewDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Kein sichtbarer Trigger nötig, wir öffnen den Dialog per Prop */}
      <DialogTrigger asChild>
        <span />
      </DialogTrigger>

      {/* Breiteres Modal: 90 % der Viewport-Breite */}
      <DialogContent className="!w-[90vw] !max-w-none sm:!max-w-none">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t("common:previewDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          {mimeType.startsWith("image/") && (
            <img src={url} alt={title} className="w-full max-h-[80vh] object-contain" />
          )}
          {mimeType === "application/pdf" && (
            <embed src={url} type="application/pdf" className="w-full h-[80vh]" />
          )}
          {mimeType.startsWith("video/") && (
            <video controls src={url} className="w-full max-h-[60vh]" />
          )}
          {mimeType.startsWith("audio/") && (
            <audio controls src={url} className="w-full" />
          )}
          {mimeType.startsWith("text/") && (
            <iframe src={url} title={title} className="w-full h-[80vh]" />
          )}
          {!(
            mimeType.startsWith("image/") ||
            mimeType === "application/pdf" ||
            mimeType.startsWith("video/") ||
            mimeType.startsWith("audio/") ||
            mimeType.startsWith("text/")
          ) && (
            <p className="text-muted-foreground text-center py-4">
              {t("common:previewDialog.unsupported_file_type")}
            </p>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">{t("common:actions.close")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
