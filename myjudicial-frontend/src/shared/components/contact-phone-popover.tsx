"use client";

import { useState } from "react";
import { Phone, Copy, Check, ExternalLink } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

function WhatsAppIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

export interface ContactPhonePopoverProps {
  phone: string;
  className?: string;
  iconClassName?: string;
  iconSize?: number;
  showIcon?: boolean;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  children?: React.ReactNode;
}

export function ContactPhonePopover({
  phone,
  className,
  iconClassName,
  iconSize = 14,
  showIcon = true,
  align = "start",
  side = "top",
  sideOffset = 8,
  children,
}: ContactPhonePopoverProps) {
  const t = useTranslations("common.phonePopover");
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const cleanTel = phone.replace(/[^\d+]/g, "");
  const digitsOnly = phone.replace(/[^\d]/g, "");

  const telHref = `tel:${cleanTel.startsWith("+") ? cleanTel : `+${cleanTel}`}`;
  const whatsappUrl = `https://wa.me/${digitsOnly}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(phone);
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
          href={telHref}
          onClick={(e) => {
            // Prevent broken tel: OS prompt on laptops; provide choice on phone and desktop
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
              {showIcon && <Phone size={iconSize} className={iconClassName} aria-hidden="true" />}
              <span>{phone}</span>
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
        {/* Header / Phone display & quick copy */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-muted/40 border border-border/50">
          <span className="font-mono text-xs font-semibold text-foreground truncate select-all">
            {phone}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            title={t("copyPhone")}
            aria-label={t("copyPhone")}
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
                <span>{t("copyPhone")}</span>
              </>
            )}
          </button>
        </div>

        {/* Section title */}
        <div className="mt-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("contactVia")}
        </div>

        {/* Actions list */}
        <div className="mt-0.5 space-y-0.5">
          {/* WhatsApp Action (High priority in Rwanda) */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <WhatsAppIcon className="h-3.5 w-3.5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs leading-none">{t("whatsapp")}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t("whatsappDesc")}</p>
            </div>
            <ExternalLink size={12} className="text-muted-foreground shrink-0" />
          </a>

          {/* Direct Phone Call */}
          <a
            href={telHref}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-500/10 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-300">
              <Phone size={12} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs leading-none">{t("directCall")}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t("callInApp")}</p>
            </div>
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
