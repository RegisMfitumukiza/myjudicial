"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { UserRole } from "@/features/auth/types";

/**
 * Gate for booking actions — only citizens can create bookings (backend
 * enforces this too). Unauthenticated visitors are sent to sign in with a
 * `callbackUrl` back to the given return path, so they land back on the
 * booking flow they started instead of a generic dashboard.
 */
export function useRequireBookingAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  function requireAuth(returnPath: string): boolean {
    if (status === "loading") return false;

    if (status !== "authenticated") {
      router.replace(`/sign-in?callbackUrl=${encodeURIComponent(returnPath)}`);
      return false;
    }

    if (session.user.role !== UserRole.CITIZEN) {
      toast.error("Only citizen accounts can book consultations.");
      return false;
    }

    return true;
  }

  return { requireAuth, isAuthenticated: status === "authenticated", status };
}
