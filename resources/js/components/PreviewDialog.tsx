// resources/js/components/preview-dialog.tsx

import { useState, useEffect } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
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

  // Loading Status
  const [isLoading, setIsLoading] = useState(true)

  // Reset loading whenever the dialog öffnet oder neue URL
  useEffect(() => {
    if (open) {
      setIsLoading(true)
    }
  }, [open, url])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <span />
      </DialogTrigger>

      <DialogContent className="!w-[90vw] !max-w-none sm:!max-w-none">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t("common:previewDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-4 min-h-[200px] flex items-center justify-center">

          {/* Spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
              <Loader2 className="animate-spin w-10 h-10 text-muted-foreground" />
            </div>
          )}

          {/* === IMAGE === */}
          {mimeType.startsWith("image/") && (
            <img
              src={url}
              alt={title}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              className={`w-full max-h-[80vh] object-contain ${isLoading ? "opacity-0" : "opacity-100"}`}
            />
          )}

          {/* === PDF === */}
          {mimeType === "application/pdf" && (
            <iframe
              src={url}
              title={title}
              onLoad={() => setIsLoading(false)}
              className={`w-full h-[80vh] border-none ${isLoading ? "opacity-0" : "opacity-100"}`}
            />
          )}

          {/* === VIDEO === */}
          {mimeType.startsWith("video/") && (
            <video
              controls
              src={url}
              onLoadedData={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              className={`w-full max-h-[60vh] ${isLoading ? "opacity-0" : "opacity-100"}`}
            />
          )}

          {/* === AUDIO === */}
          {mimeType.startsWith("audio/") && (
            <audio
              controls
              src={url}
              onLoadedData={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              className={`w-full ${isLoading ? "opacity-0" : "opacity-100"}`}
            />
          )}

          {/* === TEXT FILES === */}
          {mimeType.startsWith("text/") && (
            <iframe
              src={url}
              title={title}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              className={`w-full h-[80vh] border-none ${isLoading ? "opacity-0" : "opacity-100"}`}
            />
          )}

          {/* === UNSUPPORTED === */}
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
            <Button variant="secondary">
              {t("common:actions.close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
