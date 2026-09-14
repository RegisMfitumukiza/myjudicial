"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Legacy /expert/session/[id] route.
 * Redirects to the real consultation join page so any saved deep-links still work.
 */
export default function LegacySessionRedirect() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/expert/dashboard/consultations/${params.id}/join`);
  }, [params.id, router]);

  return null;
}