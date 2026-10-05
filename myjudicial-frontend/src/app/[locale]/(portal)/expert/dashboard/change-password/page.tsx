"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy /expert/dashboard/change-password route.
 * Password change is available under the Account tab of the profile page.
 * Redirect there to avoid a duplicate UX entry point.
 */
export default function ChangePasswordRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/expert/dashboard/security");
  }, [router]);

  return null;
}