"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { setCachedAuthToken } from "@/lib/api/client";

export function useSessionExpiry() {
  const { data: session } = useSession();

  useEffect(() => {
    if ((session as any)?.error === "RefreshAccessTokenError") {
      setCachedAuthToken(null);
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenExpiresAt");
        const stored = localStorage.getItem("mj_lang");
        const locale = stored && ["en", "fr", "rw"].includes(stored) ? stored : "en";
        toast.error("Your session has expired. Please sign in again.");
        signOut({ redirect: false }).finally(() => {
          window.location.href = `/${locale}/sign-in`;
        });
      }
    }
  }, [session]);
}
