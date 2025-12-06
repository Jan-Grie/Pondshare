"use client";

import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { router } from "@inertiajs/react";

import { getDateFnsLocale } from "@/lib/getDateFnsLocale";
import { store as uploadStore } from "@/routes/ponds/upload-links";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import {
  PlusIcon,
  CalendarIcon,
  ClipboardIcon,
  Share2Icon,
} from "lucide-react";

// ----------------------------------------------------------
// Types
// ----------------------------------------------------------
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
  minLengthPassword: number;
  maxlinkduration: number;
  onNewLink?: (link: UploadLink) => void;
}

// ----------------------------------------------------------
// Component
// ----------------------------------------------------------
export default function CreateUploadLinkDialog({
  pondId,
  forcePasswordForLinks,
  minLengthPassword,
  forceexpirationdate,
  maxlinkduration,
  onNewLink,
}: Props) {
  const { t, i18n } = useTranslation();
  const dateLocale = getDateFnsLocale(i18n.language);

  const [isOpen, setIsOpen] = useState(false);

  const [linkName, setLinkName] = useState("");
  const [password, setPassword] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const [fullLink, setFullLink] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [creating, setCreating] = useState(false);

  // Reset state when opening dialog
  const resetForm = () => {
    setLinkName("");
    setPassword("");
    setDate(undefined);
    setExpiresAt(null);
    setFullLink("");
    setErrors({});
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) resetForm();
  };

  // ----------------------------------------------------------
  // CREATE HANDLER
  // ----------------------------------------------------------
  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErrors({});
    setFullLink("");

    toast.info(t("ponds:upload_dialog.preparing"), {
      description: t("ponds:upload_dialog.loading"),
      duration: 3000,
      style: {
        "--normal-bg": "light-dark(var(--color-sky-600), var(--color-sky-400))",
        "--normal-text": "var(--color-white)",
        "--normal-border": "light-dark(var(--color-sky-600), var(--color-sky-400))",
      } as React.CSSProperties,
    });

    try {
      const payload: any = { name: linkName };
      if (password.trim()) payload.password = password;
      if (expiresAt) payload.expires_at = expiresAt;

      const response = await axios.post(uploadStore.url(pondId), payload);

      const api = response.data?.link;
      if (api) {
        const newLink: UploadLink = {
          id: api.id,
          name: api.name,
          created_at: api.created_at,
          expires_at: api.expires_at,
          has_password: api.password_enabled,
          uploads: api.upload_count,
          full_url: api.full_url,
        };

        onNewLink?.(newLink);
        setFullLink(newLink.full_url);

        router.reload({ only: ["uploadLinks"] });

        toast.success(t("ponds:upload_dialog.success"), {
          description: t("ponds:upload_dialog.success_description"),
          style: {
            "--normal-bg": "light-dark(var(--color-green-600), var(--color-green-400))",
            "--normal-text": "var(--color-white)",
            "--normal-border": "light-dark(var(--color-green-600), var(--color-green-400))",
          } as React.CSSProperties,
        });
      }
    } catch (err: any) {
      if (err.response?.status === 422) {
        const validation = err.response.data?.errors || {};
        setErrors(validation);

        Object.values(validation)
          .flat()
          .forEach((msg) =>
            toast.error(msg as string, {
              style: {
                "--normal-bg":
                  "light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))",
                "--normal-text": "var(--color-white)",
                "--normal-border": "transparent",
              } as React.CSSProperties,
            })
          );
      } else {
        toast.error(t("common:error.unknown"), {
          description: err.message,
          style: {
            "--normal-bg":
              "light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))",
            "--normal-text": "var(--color-white)",
            "--normal-border": "transparent",
          } as React.CSSProperties,
        });
      }
    } finally {
      setCreating(false);
    }
  };

  // ----------------------------------------------------------
  // COPY + SHARE HANDLERS
  // ----------------------------------------------------------
  const handleCopy = () => {
    if (!fullLink) return;

    navigator.clipboard
      .writeText(fullLink)
      .then(() => {
        toast.success(t("common:copy.success"), {
          description: t("common:copy.success_description"),
          style: {
            "--normal-bg":
              "light-dark(var(--color-green-600), var(--color-green-400))",
            "--normal-text": "var(--color-white)",
            "--normal-border":
              "light-dark(var(--color-green-600), var(--color-green-400))",
          } as React.CSSProperties,
        });
      })
      .catch(() => {
        toast.error(t("common:copy.error"), {
          style: {
            "--normal-bg":
              "light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))",
            "--normal-text": "var(--color-white)",
            "--normal-border": "transparent",
          } as React.CSSProperties,
        });
      });
  };

  const handleShare = () => {
    if (!navigator.share) {
      toast.error(t("common:share.not_supported"), {
        style: {
          "--normal-bg":
            "light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))",
          "--normal-text": "var(--color-white)",
          "--normal-border": "transparent",
        } as React.CSSProperties,
      });
      return;
    }

    navigator
      .share({
        title: t("ponds:upload_dialog.share_title"),
        text: t("ponds:upload_dialog.share_text"),
        url: fullLink,
      })
      .catch(() => {});
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="mr-2 h-4 w-4" />
          {t("ponds:upload_dialog.open_button")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {fullLink
              ? t("ponds:upload_dialog.created_title")
              : t("ponds:upload_dialog.create_title")}
          </DialogTitle>

          <DialogDescription>
            {t("ponds:upload_dialog.description")}
          </DialogDescription>
        </DialogHeader>

        {/* CREATE FORM */}
        {!fullLink && (
          <form onSubmit={handleCreateLink} className="flex flex-col gap-6 py-4">
            {/* NAME */}
            <div className="flex flex-col">
              <Label className="mb-2">{t("ponds:upload_dialog.name")}</Label>
              <Input
                value={linkName}
                required
                disabled={creating}
                onChange={(e) => setLinkName(e.target.value)}
              />
              {errors.name && (
                <p className="text-red-600 text-sm">{errors.name[0]}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="flex flex-col">
              <Label className="mb-2">
                {t("ponds:upload_dialog.password")}{" "}
                <span className="text-muted-foreground">
                  {!forcePasswordForLinks
                    ? t("ponds:upload_dialog.password_optional", { min: minLengthPassword })
                    : t("ponds:upload_dialog.password_required", { min: minLengthPassword })}
                </span>
              </Label>

              <Input
                type="password"
                disabled={creating}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {password.length > 0 && password.length < minLengthPassword && (
                <span className="mt-1 text-xs text-destructive">
                  {t("ponds:upload_dialog.password_min_length", { min: minLengthPassword })}
                </span>
              )}

              {errors.password && (
                <p className="text-red-600 text-sm">{errors.password[0]}</p>
              )}
            </div>

            {/* EXPIRATION */}
            <div className="flex flex-col">
              <Label className="mb-2">
                {t("ponds:upload_dialog.expires_at")}{" "}
                <span className="text-muted-foreground">
                  {forceexpirationdate ? t("common:required") : t("common:optional")}
                </span>
              </Label>

              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={creating}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date
                      ? format(date, "PPP", { locale: dateLocale })
                      : t("ponds:upload_dialog.choose_date")}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    locale={dateLocale}
                    disabled={{
                      before: new Date(new Date().setHours(24, 0, 0, 0)),
                      after: new Date(
                        new Date().setDate(
                          new Date().getDate() + maxlinkduration
                        )
                      ),
                    }}
                    onSelect={(selected) => {
                      setDate(selected);
                      setExpiresAt(
                        selected ? format(selected, "yyyy-MM-dd") : null
                      );
                    }}
                  />
                </PopoverContent>
              </Popover>

              {errors.expires_at && (
                <p className="text-red-600 text-sm">{errors.expires_at[0]}</p>
              )}
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="secondary">
                  {t("common:actions.cancel")}
                </Button>
              </DialogClose>

              <Button disabled={creating || (forcePasswordForLinks && password.length < minLengthPassword) || (forceexpirationdate && !expiresAt)}>
                {creating ? t("common:please_wait") : t("ponds:upload_dialog.create_button")}
              </Button>
            </div>
          </form>
        )}

        {/* CREATED LINK */}
        {fullLink && (
          <div className="flex flex-col gap-6 py-4">
            <div>
              <Label>{t("ponds:upload_dialog.your_link")}</Label>
              <Input readOnly value={fullLink} />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCopy}>
                <ClipboardIcon className="h-4 w-4 mr-2" />
                {t("common:actions.copy")}
              </Button>

              <Button variant="outline" className="flex-1" onClick={handleShare}>
                <Share2Icon className="h-4 w-4 mr-2" />
                {t("common:actions.share")}
              </Button>
            </div>

            <DialogClose asChild>
              <Button className="self-end">{t("common:actions.close")}</Button>
            </DialogClose>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
