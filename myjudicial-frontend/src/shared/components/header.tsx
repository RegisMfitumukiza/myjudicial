"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, Link } from "@/i18n/routing";
import { useSession, signOut } from "next-auth/react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { Menu, X, Bot, HelpCircle, Search, Scale, LayoutDashboard, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProfileMenu } from "./profile-menu";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("header");
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const mobileRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lastScrollY = useRef(0);

  // Smart scroll header: hide on scroll down, reveal on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show when near the very top of the page
      if (currentScrollY < 60) {
        setVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Scrolling down -> hide header; Scrolling up -> reveal header
      if (currentScrollY > lastScrollY.current + 8) {
        if (!mobileOpen) setVisible(false);
      } else if (currentScrollY < lastScrollY.current - 8) {
        setVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileOpen]);

  // Synchronize CSS custom property --header-offset for seamless sub-bar docking
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--header-offset",
      visible ? "4rem" : "0px"
    );
    return () => {
      document.documentElement.style.setProperty("--header-offset", "4rem");
    };
  }, [visible]);

  const isAdvocate = session?.user?.role === "EXPERT";
  const advocateHref = isAdvocate ? "/expert/dashboard" : "/sign-up?role=EXPERT";
  const advocateLabel = isAdvocate ? t("advocateDashboard") : t("joinAsAdvocate");

  // Close mobile drawer on outside click (ignoring the toggle button itself)
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (mobileRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return;
      }
      setMobileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [mobileOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Close mobile drawer and reveal header on route change
  useEffect(() => {
    setMobileOpen(false);
    setVisible(true);
  }, [pathname]);

  const navLinkClass = (href: string) => {
    const active = pathname.startsWith(href);
    return `rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "bg-accent text-brand-dark dark:text-white font-semibold"
        : "text-foreground/80 hover:text-foreground hover:bg-accent/60"
    }`;
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border transition-transform duration-300 ease-in-out",
        visible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="mx-auto flex max-w-[1400px] h-16 items-center gap-2 px-4 sm:px-6">

        {/* Logo */}
        <div className="flex items-center justify-start shrink-0 mr-3 lg:mr-6">
          <Logo iconSize={22} fontSize="text-[18px]" className="text-brand-dark dark:text-white" />
        </div>

        {/* Primary Nav Links */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink-0">
          <Link href="/search" className={navLinkClass("/search")}>
            {t("findLawyer")}
          </Link>
          <Link href="/practice-areas" className={navLinkClass("/practice-areas")}>
            {t("practiceAreas")}
          </Link>
          <Link href="/ai" className={navLinkClass("/ai")}>
            <span className="flex items-center gap-1.5">
              <Bot size={14} /> {t("aiAssistant")}
            </span>
          </Link>
          <Link href="/how-it-works" className={navLinkClass("/how-it-works")}>
            {t("howItWorks")}
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center justify-end gap-1.5 shrink-0 ml-auto">
          <Link
            href={advocateHref}
            className="hidden md:inline-flex items-center h-9 px-3.5 sm:px-4 text-sm font-semibold text-foreground rounded-full border border-border transition-all hover:bg-accent hover:text-brand-dark dark:hover:text-white shadow-2xs whitespace-nowrap shrink-0"
          >
            {advocateLabel}
          </Link>

          <LanguageSwitcher variant="header" />

          <ThemeToggle variant="header" />

          <ProfileMenu />

          <button
            ref={buttonRef}
            onClick={() => setMobileOpen((v) => !v)}
            className="flex lg:hidden h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent text-foreground ml-1"
            aria-label={mobileOpen ? t("close") : t("menu")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div ref={mobileRef} className="lg:hidden border-t border-border bg-background px-4 py-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <Link
            href="/search"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
          >
            <Search size={16} className="text-muted-foreground" /> {t("findLawyer")}
          </Link>
          <Link
            href="/practice-areas"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
          >
            <Scale size={16} className="text-muted-foreground" /> {t("practiceAreas")}
          </Link>
          <Link
            href="/ai"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
          >
            <Bot size={16} className="text-muted-foreground" /> {t("aiAssistant")}
          </Link>
          <Link
            href="/how-it-works"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
          >
            <HelpCircle size={16} className="text-muted-foreground" /> {t("howItWorks")}
          </Link>
          <div className="pt-2 mt-2 border-t border-border">
            <Link
              href={advocateHref}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-xl bg-accent/60 px-3.5 py-2.5 text-sm font-semibold text-brand-dark dark:text-white hover:bg-accent"
            >
              <span>{advocateLabel}</span>
              <span className="text-xs">&rarr;</span>
            </Link>
          </div>
          {!session ? (
            <div className="pt-2 mt-1 border-t border-border flex items-center gap-2">
              <Link
                href="/sign-in"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center rounded-xl border border-border py-2 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
              >
                {tNav("signIn")}
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center rounded-xl bg-brand-dark text-white dark:bg-white dark:text-black dark:hover:bg-white/90 py-2 text-sm font-semibold hover:bg-brand-dark/90 transition-colors"
              >
                {tNav("signUp")}
              </Link>
            </div>
          ) : (
            <div className="pt-2 mt-1 border-t border-border space-y-1">
              <Link
                href={
                  session.user.role === "EXPERT"
                    ? "/expert/dashboard"
                    : session.user.role === "ADMIN"
                    ? "/admin/dashboard"
                    : "/client/dashboard"
                }
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <LayoutDashboard size={16} className="text-muted-foreground" />
                <span>{tNav("dashboard")}</span>
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={16} />
                <span>{tNav("signOut")}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
