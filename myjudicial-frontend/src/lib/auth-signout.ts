import { signOut } from "next-auth/react";
import { postAuthLogout } from "@/api/generated";
import { setCachedAuthToken } from "@/lib/api/client";

/**
 * Extracts the current locale from explicit parameter, window pathname, or localStorage.
 * Defaults to "en" if none is resolved.
 */
export function getAuthLocale(locale?: string | null): string {
  if (locale && ["en", "fr", "rw"].includes(locale)) return locale;
  if (typeof window !== "undefined") {
    const match = window.location.pathname.match(/^\/(en|fr|rw)(\/|$)/);
    if (match) return match[1];
    const stored = localStorage.getItem("mj_lang");
    if (stored && ["en", "fr", "rw"].includes(stored)) return stored;
  }
  return "en";
}

/**
 * Checks whether the current context corresponds to an Admin session or Admin portal route.
 */
export function isCurrentContextAdmin(options?: {
  role?: string | null;
  pathname?: string | null;
}): boolean {
  if (options?.role === "ADMIN") return true;
  if (options?.pathname?.includes("/admin")) return true;
  if (typeof window !== "undefined") {
    if (window.location.pathname.includes("/admin")) return true;
    if (window.location.search.includes("admin=1")) return true;
    const host = window.location.hostname.toLowerCase();
    const adminHost = (process.env.NEXT_PUBLIC_ADMIN_PORTAL_HOST ?? "admin.myjudicial.com")
      .replace(/^https?:\/\//, "")
      .toLowerCase();
    if (host === adminHost || host.startsWith("admin.")) return true;
  }
  return false;
}

/**
 * Determines the target redirect URL upon sign-out:
 * - Admin users & Admin routes -> `/${locale}/sign-in?admin=1`
 * - Other users (Expert, Client) -> `/${locale}/sign-in`
 */
export function getSignOutRedirectUrl(options?: {
  role?: string | null;
  pathname?: string | null;
  locale?: string | null;
}): string {
  const locale = getAuthLocale(options?.locale);
  const isAdmin = isCurrentContextAdmin(options);
  return isAdmin ? `/${locale}/sign-in?admin=1` : `/${locale}/sign-in`;
}

/**
 * Executes a clean, robust sign-out:
 * 1. Invalidates backend refresh tokens via /auth/logout.
 * 2. Clears all client-side cached auth tokens and session storage.
 * 3. Calls NextAuth signOut with the designated sign-in target URL.
 * 4. Ensures window.location navigates to the sign-in URL if needed.
 */
export async function handleAppSignOut(options?: {
  role?: string | null;
  pathname?: string | null;
  locale?: string | null;
  callbackUrl?: string;
}): Promise<void> {
  const targetUrl = options?.callbackUrl ?? getSignOutRedirectUrl(options);

  try {
    await postAuthLogout().catch(() => {});
  } catch {
    // Non-blocking: continue client cleanup even if network fails
  }

  if (typeof window !== "undefined") {
    setCachedAuthToken(null);
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("tokenExpiresAt");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("tokenExpiresAt");
    sessionStorage.clear();
  }

  try {
    await signOut({ callbackUrl: targetUrl });
  } catch {
    if (typeof window !== "undefined") {
      window.location.href = targetUrl;
    }
  }
}
