"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { Logo } from "./logo";
import { ProfileMenu } from "./profile-menu";
import { LanguageSwitcher } from "./language-switcher";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";

export function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations("shared.publicNav");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background shadow-sm">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-3 sm:px-4 lg:px-6 sm:h-16">

        {/* Logo */}
        <Logo light={false} fontSize="text-[15px]" className="shrink-0" />

        {/* Right: LanguageSwitcher, ProfileMenu, Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher variant="compact" />
          <ProfileMenu />

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex items-center gap-1 rounded-full border border-border p-1.5 text-foreground transition-colors hover:shadow-md lg:hidden"
            aria-label={t("toggleMenu")}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-3 shadow-lg lg:hidden">
          <nav className="space-y-1">
            <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              {t("logIn")}
            </Link>
            <Link href="/sign-up" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              {t("signUp")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
