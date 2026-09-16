"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { ChevronDown, Menu, Bot, HelpCircle, Info, Search, Scale } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProfileMenu } from "./profile-menu";
import { usePracticeAreas } from "@/lib/api/landing";
import { SPECIALTY_ICON_MAP } from "@/shared/constants/marketplace";

export function Header() {
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const practiceRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const t = useTranslations("header");

  const { data: practiceAreas } = usePracticeAreas();

  const isHomePage = pathname === "/";

  useEffect(() => {
    if (!practiceOpen) return;
    const handler = (e: MouseEvent) => {
      if (practiceRef.current && !practiceRef.current.contains(e.target as Node)) setPracticeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [practiceOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) setMobileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  useEffect(() => {
    if (!practiceOpen && !mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setPracticeOpen(false); setMobileOpen(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [practiceOpen, mobileOpen]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const navLinkClass = (href: string) =>
    `hidden lg:block px-3 py-2 text-sm font-medium rounded-full transition-colors ${
      pathname === href ? "text-brand-dark dark:text-white font-semibold" : "text-foreground hover:bg-accent"
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="mx-auto flex max-w-[1400px] h-16 items-center gap-2 px-4 sm:px-6">

          {/* Logo */}
          <div className="flex flex-1 items-center justify-start shrink-0 mr-4">
            <Logo iconSize={22} fontSize="text-[18px]" className="text-brand-dark dark:text-white" />
          </div>

          {/* Primary Nav Links */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {!isHomePage && (
              <div className="relative" ref={practiceRef}>
                <button
                  onClick={() => setPracticeOpen((v) => !v)}
                  className="hidden lg:flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-full transition-colors text-foreground hover:bg-accent"
                >
                  Practice Areas <ChevronDown size={14} className={`transition-transform ${practiceOpen ? "rotate-180" : ""}`} />
                </button>
                {practiceOpen && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border bg-card p-2 shadow-xl max-h-[70vh] overflow-y-auto">
                  {practiceAreas?.map((area) => {
                    const Icon = SPECIALTY_ICON_MAP[area.specialty] ?? Scale;
                      return (
                        <Link
                          key={area.specialty}
                          href={`/search?specialty=${area.specialty}`}
                          onClick={() => setPracticeOpen(false)}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                        >
                          <Icon size={14} className="text-muted-foreground shrink-0" />
                          <span className="truncate">{area.label}</span>
                        </Link>
                      );
                    })}
                    <div className="px-2 pt-2 mt-1 border-t border-border">
                      <Link
                        href="/practice-areas"
                        onClick={() => setPracticeOpen(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-brand-dark dark:text-white transition-colors hover:bg-accent"
                      >
                        {t("practiceAreas")} &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link href="/ai" className={navLinkClass("/ai")}>
              <span className="flex items-center gap-1.5"><Bot size={14} /> {t("aiAssistant")}</span>
            </Link>
            <Link href="/how-it-works" className={navLinkClass("/how-it-works")}>{t("howItWorks")}</Link>
            <Link href="/about" className={navLinkClass("/about")}>{t("about")}</Link>
          </nav>

          {/* Right side actions */}
          <div className="flex flex-1 items-center justify-end gap-1">
            <Link
              href="/expert/onboarding"
              className="hidden md:block px-4 py-2 text-sm font-semibold text-foreground rounded-full border border-border transition-colors hover:bg-accent hover:text-brand-dark dark:hover:text-white"
            >
              {t("listYourPractice")}
            </Link>

            <LanguageSwitcher variant="header" />

            <ThemeToggle />

            <ProfileMenu />

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="flex lg:hidden h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent text-foreground ml-1"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div ref={mobileRef} className="lg:hidden border-t border-border bg-background px-4 py-4 space-y-1">
            <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent">
              <Search size={15} /> {t("findLawyer")}
            </Link>
            <Link href="/practice-areas" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent">
              <Scale size={15} /> {t("practiceAreas")}
            </Link>
            <Link href="/ai" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent">
              <Bot size={15} /> {t("aiAssistant")}
            </Link>
            <Link href="/how-it-works" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent">
              <HelpCircle size={15} /> {t("howItWorks")}
            </Link>
            <Link href="/about" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent">
              <Info size={15} /> {t("about")}
            </Link>
            <div className="pt-2 border-t border-border">
              <Link href="/expert/onboarding" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-dark dark:text-white hover:bg-accent">
                {t("listYourPractice")} &rarr;
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
