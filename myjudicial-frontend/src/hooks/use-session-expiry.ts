"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getSignOutRedirectUrl, handleAppSignOut } from "@/lib/auth-signout";

export function useSessionExpiry() {
  const { data: session } = useSession();

  useEffect(() => {
    if ((session as any)?.error === "RefreshAccessTokenError") {
      const role = (session?.user as any)?.role;
      const targetUrl = getSignOutRedirectUrl({ role });
      toast.error("Your session has expired. Please sign in again.");
      handleAppSignOut({ role, callbackUrl: targetUrl });
    }
  }, [session]);
}
