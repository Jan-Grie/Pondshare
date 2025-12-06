"use client";

import React, { useState } from "react";
import axios from "axios";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

import { getDateFnsLocale } from "@/lib/getDateFnsLocale";
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

import { CalendarIcon, PencilIcon } from "lucide-react";

// Wayfinder route for upload-links
import { update } from "@/routes/ponds/upload-links";

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
  link: UploadLink;
  onUpdated?: (u: UploadLink) => void;
  forcePasswordForLinks: boolean;
  forceExpirationDate: boolean;
  minLengthPassword: number;
}

export default function EditUploadLinkDialog({
  pondId,
  link,
  onUpdated,
  forcePasswordForLinks,
  forceExpirationDate,
  minLengthPassword,
}: Props) {
  const { t, i18n } = useTranslation();
  const dateLocale = getDateFnsLocale(i18n.language);

  const [isOpen, setIsOpen] = useState(false);

  const [name, setName] = useState(link.name);
  const [password, setPassword] = useState("");

  const [date, setDate] = useState<Date | undefined>(
    link.expires_at ? parseISO(link.expires_at) : undefined
  );
  const [expiresAt, setExpiresAt] = useState<string | null>(link.expires_at ?? null);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName(link.name);
    setPassword("");
    setDate(link.expires_at ? parseISO(link.expires_at) : undefined);
    setExpiresAt(link.expires_at ?? null);
    setErrors({});
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    toast.info(t("ponds:upload_dialog.preparing"), {
      description: t("ponds:upload_dialog.loading"),
      duration: 3000,
      style: {
        "--normal-bg": "light-dark(var(--color-sky-600), var(--color-sky-400))",
        "--normal-text": "white",
        "--normal-border": "light-dark(var(--color-sky-600), var(--color-sky-400))",
      } as React.CSSProperties,
    });

    try {
      const payload: any = { name };

      if (password.trim()) {
        payload.password = password;
      }

      if (expiresAt) {
        payload.expires_at = expiresAt;
      }

      const response = await axios.put(
        update.url({
          pond: pondId,
          externalUploadLink: link.id, // Wayfinder key
        }),
        payload
      );

      if (response.data?.link) {
        const api = response.data.link;

        const updated: UploadLink = {
          id: api.id,
          name: api.name,
          created_at: api.created_at,
          expires_at: api.expires_at,
          has_password: api.password_enabled,
          uploads: api.upload_count,
          full_url: api.full_url,
        };

        onUpdated?.(updated);

        toast.success(t("ponds:upload_dialog.edit_success"), {
          description: t("ponds:upload_dialog.edit_success_description"),
          style: {
            "--normal-bg":
              "light-dark(var(--color-green-600), var(--color-green-400))",
            "--normal-text": "white",
            "--normal-border":
              "light-dark(var(--color-green-600), var(--color-green-400))",
          } as React.CSSProperties,
        });

        setIsOpen(false);

        router.reload({ only: ["uploadLinks"] });
      }
    } catch (err: any) {
      if (err.response?.status === 422) {
        const validation = err.response.data.errors || {};
        setErrors(validation);

        Object.values(validation)
          .flat()
          .forEach((msg) =>
            toast.error(msg as string, {
              style: {
                "--normal-bg":
                  "light-dark(var(--destructive), color-mix(in oklab, var(--destructive) 60%, var(--background)))",
                "--normal-text": "white",
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
            "--normal-text": "white",
            "--normal-border": "transparent",
          } as React.CSSProperties,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" title={t("ponds:upload_dialog.edit_tooltip")}>
          <PencilIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("ponds:upload_dialog.edit_title")}</DialogTitle>
          <DialogDescription>
            {t("ponds:upload_dialog.edit_description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-4">
          {/* NAME */}
          <div className="flex flex-col">
            <Label className="mb-1">
              {t("ponds:upload_dialog.name")}
            </Label>
            <Input
              required
              disabled={saving}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name[0]}</p>
            )}
          </div>

          {/* PASSWORD */}
          <div className="flex flex-col">
            <Label className="mb-1">
              {t("ponds:upload_dialog.password")}{" "}
              <span className="text-muted-foreground">
                {forcePasswordForLinks
                  ? t("ponds:share_dialog.password_required", {
                      min: minLengthPassword,
                    })
                  : t("ponds:share_dialog.password_optional", {
                      min: minLengthPassword,
                    })}
              </span>
            </Label>

            <Input
              type="password"
              value={password}
              disabled={saving}
              placeholder={t("ponds:upload_dialog.password_new")}
              onChange={(e) => setPassword(e.target.value)}
            />

            {password.length > 0 && password.length < minLengthPassword && (
              <span className="text-xs text-destructive mt-1">
                {t("ponds:share_dialog.password_min_length", {
                  minLength: minLengthPassword,
                })}
              </span>
            )}

            {errors.password && (
              <p className="text-red-600 text-sm mt-1">
                {errors.password[0]}
              </p>
            )}
          </div>

          {/* EXPIRATION */}
          <div className="flex flex-col">
            <Label className="mb-1">
              {t("ponds:upload_dialog.expires_at")}{" "}
              <span className="text-muted-foreground">
                ({forceExpirationDate ? t("common:required") : t("common:optional")})
              </span>
            </Label>

            <Popover modal>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={saving}
                  className={cn(
                    "w-full justify-start text-left",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date
                    ? format(date, "PPP", { locale: dateLocale })
                    : t("ponds:upload_dialog.choose_date")}
                </Button>
              </PopoverTrigger>

              <PopoverContent>
                <Calendar
                  mode="single"
                  locale={dateLocale}
                  selected={date}
                  disabled={{ before: new Date(new Date().setHours(24, 0, 0, 0)) }}
                  onSelect={(d) => {
                    setDate(d);
                    setExpiresAt(d ? format(d, "yyyy-MM-dd") : null);
                  }}
                />
              </PopoverContent>
            </Popover>

            {errors.expires_at && (
              <p className="text-red-600 text-sm mt-1">{errors.expires_at[0]}</p>
            )}
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="secondary">{t("common:actions.cancel")}</Button>
            </DialogClose>

            <Button
              type="submit"
              disabled={
                saving ||
                (forceExpirationDate && !expiresAt) ||
                (password.length > 0 && password.length < minLengthPassword)
              }
            >
              {saving ? t("common:please_wait") : t("common:actions.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
