// resources/js/components/preview-dialog.tsx

import { useState, useEffect } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next";

interface PreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  mimeType: string
  url: string
  hasPrevious?: boolean
  hasNext?: boolean
  onPrevious?: () => void
  onNext?: () => void
}

export default function PreviewDialog({
  open,
  onOpenChange,
  title,
  mimeType,
  url,
  hasPrevious = false,
  hasNext = false,
  onPrevious,
  onNext,
}: PreviewDialogProps) {
  const { t } = useTranslation()

  // Loading Status
  const [isLoading, setIsLoading] = useState(true)

  // Reset loading whenever the dialog opens or new URL
  useEffect(() => {
    if (open) {
      setIsLoading(true)
    }
  }, [open, url])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasPrevious) {
        onPrevious?.()
      } else if (e.key === "ArrowRight" && hasNext) {
        onNext?.()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, hasPrevious, hasNext, onPrevious, onNext])

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

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={!hasPrevious}
              onClick={onPrevious}
              title={t("common:actions.previous")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={!hasNext}
              onClick={onNext}
              title={t("common:actions.next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

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
