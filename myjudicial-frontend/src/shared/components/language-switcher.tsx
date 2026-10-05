"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "en", label: "English", flag: "EN" },
  { code: "fr", label: "Français", flag: "FR" },
  { code: "rw", label: "Kinyarwanda", flag: "RW" },
];

interface LanguageSwitcherProps {
  variant?: "header" | "compact" | "mobile";
  className?: string;
}

export function LanguageSwitcher({ variant = "header", className }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchLocale = (code: string) => {
    setOpen(false);
    try {
      localStorage.setItem("mj_lang", code);
    } catch {}
    const query = searchParams?.toString();
    const target = query ? `${pathname}?${query}` : pathname;
    router.replace(target, { locale: code });
  };

  const currentLocale = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  if (variant === "mobile") {
    return (
      <div className="flex items-center gap-2">
        <Globe size={14} className="text-black dark:text-white" />
        <div className="flex gap-1">
          {LOCALES.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => switchLocale(code)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                locale === code
                  ? "bg-brand-dark text-on-brand"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("relative", className)} ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={t("language")}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent/20 text-black dark:text-white"
        >
          <Globe size={16} />
        </button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-xl border border-border bg-card py-1 shadow-xl text-foreground">
            {LOCALES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => switchLocale(code)}
                className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors ${
                  locale === code
                    ? "bg-accent font-bold text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${locale === code ? "bg-brand-dark dark:bg-white" : "bg-transparent"}`} />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default: header variant (icon button with globe)
  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent text-black dark:text-white"
        aria-label={t("language")}
      >
        <Globe size={17} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-xl border border-border bg-card py-2 shadow-xl">
          {LOCALES.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => switchLocale(code)}
              className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
                locale === code
                  ? "bg-accent font-bold text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${locale === code ? "bg-brand-dark dark:bg-white" : "bg-transparent"}`} />
              {t(`languages.${code}` as any)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
