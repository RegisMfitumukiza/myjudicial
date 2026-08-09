"use client";

import { Link } from "@/i18n/routing";
import { Logo } from "@/shared/components/logo";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { LanguageSwitcher } from "@/shared/components/language-switcher";
import { useTranslations } from "next-intl";

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  const t = useTranslations("expertDashboard_auth-shell");

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* Top bar — matches platform Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="mx-auto flex max-w-[1400px] h-16 items-center gap-2 px-4 sm:px-6">
          <div className="flex flex-1 items-center justify-start shrink-0 mr-4">
            <Logo iconSize={22} fontSize="text-[18px]" className="text-brand-dark dark:text-white" />
          </div>
          <div className="flex flex-1 items-center justify-end gap-1">
            <LanguageSwitcher variant="compact" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Centered form */}
      <div className="flex flex-1 items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-card shadow-xl px-5 py-8 sm:px-8 sm:py-10">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-6 py-4 text-center">
        <p className="text-[11px] text-muted-foreground">
          {t("copyright")}{" "}
          <Link href="#" className="hover:text-foreground">{t("privacy")}</Link>
          {" \u00b7 "}
          <Link href="#" className="hover:text-foreground">{t("terms")}</Link>
        </p>
      </div>
    </div>
  );
}
