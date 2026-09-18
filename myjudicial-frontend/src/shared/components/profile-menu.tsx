"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useSession, signOut } from "next-auth/react";
import {
  LogOut,
  LayoutDashboard,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useTranslations } from "next-intl";

function getDashboardHref(role?: string): string {
  switch (role) {
    case "ADMIN": return "/admin/dashboard";
    case "EXPERT": return "/expert/dashboard";
    default: return "/client/dashboard";
  }
}

export function ProfileMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const tNav = useTranslations("nav");

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-profile-menu]")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isAuthed = !!session;

  // ─── Unauthenticated (Guest): Direct 1-Click Actions (Desktop lg+) ───
  if (!isAuthed) {
    return (
      <div className="hidden lg:flex items-center gap-1 ml-1">
        <Link
          href="/sign-in"
          className="inline-flex h-9 items-center px-3 text-sm font-semibold text-foreground hover:text-brand-dark dark:hover:text-white transition-colors rounded-full hover:bg-accent"
        >
          {tNav("signIn")}
        </Link>
        <Link
          href="/sign-up"
          className="inline-flex h-9 items-center px-3.5 text-sm font-semibold rounded-full bg-brand-dark text-white hover:bg-brand-dark/90 dark:bg-white dark:text-brand-dark dark:hover:bg-white/90 shadow-2xs transition-all"
        >
          {tNav("signUp")}
        </Link>
      </div>
    );
  }

  // ─── Authenticated User: Profile Pill with Account Menu ───
  const name = session?.user?.name ?? "";
  const firstName = name ? name.split(" ")[0] : "";
  const email = session?.user?.email ?? "";
  const photoUrl = session?.user?.image ?? null;
  const initials = name
    ? name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";
  const showPhoto = photoUrl && !photoError;

  return (
    <div data-profile-menu className="relative ml-0.5">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-9 items-center gap-1.5 sm:gap-2 rounded-full border border-border bg-background pl-1 pr-1 sm:pr-2.5 transition-all hover:bg-accent hover:border-foreground/20 hover:shadow-2xs"
      >
        {showPhoto ? (
          <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-border/60 shrink-0">
            <img
              key={photoUrl}
              src={photoUrl!}
              alt={name}
              className="h-full w-full object-cover"
              onError={() => setPhotoError(true)}
            />
          </span>
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-dark text-[11px] font-bold text-white shrink-0">
            {initials}
          </span>
        )}
        <span className="hidden sm:inline text-sm font-semibold text-foreground max-w-[110px] truncate">
          {firstName || name}
        </span>
        <ChevronDown
          size={12}
          className={`hidden sm:inline text-muted-foreground transition-transform duration-200 shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-60 rounded-2xl border border-border bg-card p-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2.5">
            <p className="text-sm font-bold text-foreground truncate">{name}</p>
            <p className="truncate text-xs text-muted-foreground mt-0.5">{email}</p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-foreground/80 tracking-wide">
              {session.user.role === "EXPERT"
                ? "Verified Advocate"
                : session.user.role === "ADMIN"
                ? "Platform Admin"
                : "Client"}
            </div>
          </div>
          <div className="my-1 border-t border-border" />
          <Link
            href={getDashboardHref(session.user.role)}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <LayoutDashboard size={15} className="text-muted-foreground" />
            <span>{tNav("dashboard")}</span>
          </Link>
          <Link
            href={getDashboardHref(session.user.role) + "/settings"}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Settings size={15} className="text-muted-foreground" />
            <span>{tNav("settings")}</span>
          </Link>
          <div className="my-1 border-t border-border" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut size={15} />
            <span>{tNav("signOut")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
