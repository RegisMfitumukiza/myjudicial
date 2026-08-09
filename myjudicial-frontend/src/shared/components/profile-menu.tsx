"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut, LayoutDashboard, Settings, UserCircle } from "lucide-react";
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
  const t = useTranslations("nav");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-profile-menu]")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const name = session?.user?.name ?? "";
  const email = session?.user?.email ?? "";
  const photoUrl = session?.user?.image ?? null;
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const showPhoto = photoUrl && !photoError;
  const isAuthed = !!session;

  return (
    <div data-profile-menu className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex h-10 items-center gap-2 rounded-full border border-border pl-3 pr-1 hover:shadow-sm transition-shadow">
        {isAuthed ? (
          showPhoto ? (
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full">
              <img key={photoUrl} src={photoUrl!} alt={name} className="h-full w-full object-cover" onError={() => setPhotoError(true)} />
            </span>
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-on-brand">
              {initials}
            </span>
          )
        ) : (
          <span className="flex h-8 w-8 items-center justify-center">
            <UserCircle size={28} className="text-muted-foreground" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-border bg-card p-2 shadow-lg">
          {isAuthed ? (
            <>
              <div className="px-3 pb-2 pt-1">
                <p className="text-sm font-bold text-foreground">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>
              <div className="border-t border-border" />
              <Link href={getDashboardHref(session.user.role)} onClick={() => setOpen(false)}
                className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent">
                <LayoutDashboard size={15} className="text-muted-foreground" /> {t("dashboard")}
              </Link>
              <Link href={getDashboardHref(session.user.role) + "/settings"} onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent">
                <Settings size={15} className="text-muted-foreground" /> {t("settings")}
              </Link>
              <div className="mt-1 border-t border-border" />
              <button onClick={() => signOut({ callbackUrl: "/" })}
                className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent">
                <LogOut size={15} /> {t("signOut")}
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent">
                <User size={15} /> {t("signIn")}
              </Link>
              <Link href="/sign-up" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent">
                <User size={15} /> {t("signUp")}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
