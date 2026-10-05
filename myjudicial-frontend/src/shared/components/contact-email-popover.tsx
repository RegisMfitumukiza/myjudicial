"use client";

import { useState } from "react";
import { Mail, Copy, Check, ExternalLink, Laptop } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface ContactEmailPopoverProps {
  email: string;
  subject?: string;
  body?: string;
  className?: string;
  iconClassName?: string;
  iconSize?: number;
  showIcon?: boolean;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  children?: React.ReactNode;
}

export function ContactEmailPopover({
  email,
  subject = "Inquiry - MyJudicial",
  body = "",
  className,
  iconClassName,
  iconSize = 14,
  showIcon = true,
  align = "start",
  side = "top",
  sideOffset = 8,
  children,
}: ContactEmailPopoverProps) {
  const t = useTranslations("common.emailPopover");
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  const mailtoHref = `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodedSubject}&body=${encodedBody}`;
  const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(email)}&subject=${encodedSubject}&body=${encodedBody}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(email);
        setCopied(true);
        toast.success(t("copied"));
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <a
          href={mailtoHref}
          onClick={(e) => {
            // Prevent silent dead mailto prompt on OS; open popover instead
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }}
          className={cn("cursor-pointer inline-flex items-center gap-2 transition-colors", className)}
          title={t("title")}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          {children ? (
            children
          ) : (
            <>
              {showIcon && <Mail size={iconSize} className={iconClassName} aria-hidden="true" />}
              <span className="break-all">{email}</span>
            </>
          )}
        </a>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className="w-80 p-2 shadow-xl border border-border bg-card rounded-2xl text-foreground z-50"
      >
        {/* Header / Email display & quick copy */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-muted/40 border border-border/50">
          <span className="font-mono text-xs font-semibold text-foreground truncate select-all">
            {email}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            title={t("copyEmail")}
            aria-label={t("copyEmail")}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-muted-foreground hover:text-foreground shrink-0"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t("copied")}</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>{t("copyEmail")}</span>
              </>
            )}
          </button>
        </div>

        {/* Section title */}
        <div className="mt-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("sendVia")}
        </div>

        {/* Actions list */}
        <div className="mt-0.5 space-y-0.5">
          {/* Gmail Web */}
          <a
            href={gmailUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 font-bold text-[11px]">
              G
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs leading-none">{t("gmailWeb")}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t("inBrowser")}</p>
            </div>
            <ExternalLink size={12} className="text-muted-foreground shrink-0" />
          </a>

          {/* Outlook Web */}
          <a
            href={outlookUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold text-[11px]">
              O
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs leading-none">{t("outlookWeb")}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t("inBrowser")}</p>
            </div>
            <ExternalLink size={12} className="text-muted-foreground shrink-0" />
          </a>

          {/* System Mail App */}
          <a
            href={mailtoHref}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-500/10 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-300">
              <Laptop size={12} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs leading-none">{t("defaultApp")}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t("desktopApp")}</p>
            </div>
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
