"use client";

import { useRouter, usePathname } from "@/i18n/routing";
import { useState } from "react";
import { Menu, LogOut, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { handleAppSignOut } from "@/lib/auth-signout";

export function UserMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = useTranslations("features.auth");
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await handleAppSignOut({ role: session?.user?.role, pathname });
      toast.success(t("signedOut"));
    } finally {
      setIsSigningOut(false);
      setOpen(false);
    }
  }

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 rounded-full border border-brand-border pl-3 pr-1 hover:shadow-sm"
      >
        <Menu size={16} className="text-brand-dark dark:text-foreground" />
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16324f] text-white dark:bg-blue-950/80 dark:text-blue-200 dark:border dark:border-blue-700/50 text-xs font-bold">
          {initials}
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-brand-border bg-white dark:bg-black py-1 shadow-lg">
            {session?.user?.name && (
              <div className="border-b border-slate-100 dark:border-white/10 px-4 py-3">
                <p className="text-sm font-semibold text-brand-dark">{session.user.name}</p>
                <p className="text-xs text-slate-500 dark:text-white/50">{session.user.email}</p>
              </div>
            )}
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-brand-dark hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50"
            >
              {isSigningOut ? (
                <><Loader2 size={15} className="animate-spin" /> {tAuth("signingOut")}</>
              ) : (
                <><LogOut size={15} /> {tNav("signOut")}</>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
