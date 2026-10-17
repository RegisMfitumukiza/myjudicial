"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { getAuthLocale, getSignOutRedirectUrl, handleAppSignOut } from "@/lib/auth-signout";

export const SESSION_EXPIRED_TOAST_ID = "session-expired";

const AUTH_ROUTE_REGEX = /\/(sign-in|sign-up|post-auth|forgot-password|reset-password)(\/|$)/;

export function isAuthRoute(pathname?: string | null): boolean {
  if (!pathname) return false;
  return AUTH_ROUTE_REGEX.test(pathname);
}

const EXPIRY_MESSAGES: Record<string, string> = {
  en: "Your session has expired. Please sign in again.",
  fr: "Votre session a expiré. Veuillez vous reconnecter.",
  rw: "Igihe cy'umukono wawe cyararangiye. Nyamuneka ongera winjire.",
};

// Module-level lock to ensure only one signout/toast event triggers across components
let globalExpiryHandled = false;

export function resetSessionExpiryState(): void {
  globalExpiryHandled = false;
}

export function useSessionExpiry() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // If user is actively authenticated without error, reset locks
    if (status === "authenticated" && !(session as any)?.error) {
      globalExpiryHandled = false;
      hasTriggeredRef.current = false;
      return;
    }

    const hasRefreshError = (session as any)?.error === "RefreshAccessTokenError";
    if (!hasRefreshError) {
      return;
    }

    // Never display session expired toasts or trigger signout loops on authentication routes
    if (isAuthRoute(pathname)) {
      return;
    }

    // Ensure we notify and initiate sign-out only once per expiration event
    if (hasTriggeredRef.current || globalExpiryHandled) {
      return;
    }

    hasTriggeredRef.current = true;
    globalExpiryHandled = true;

    const role = (session?.user as any)?.role;
    const targetUrl = getSignOutRedirectUrl({ role, pathname });

    const locale = getAuthLocale();
    const message = EXPIRY_MESSAGES[locale] ?? EXPIRY_MESSAGES.en;

    // Fixed toast id guarantees Sonner will update/deduplicate and NEVER stack multiple cards
    toast.error(message, {
      id: SESSION_EXPIRED_TOAST_ID,
      duration: 5000,
    });

    handleAppSignOut({ role, pathname, callbackUrl: targetUrl }).catch((err) => {
      console.error("[useSessionExpiry] Sign out failed:", err);
    });
  }, [session, status, pathname]);
}
