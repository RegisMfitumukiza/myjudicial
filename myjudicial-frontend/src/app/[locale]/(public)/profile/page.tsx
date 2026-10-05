"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useSession } from "next-auth/react";

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || !session) {
      router.replace("/sign-in?callbackUrl=/client/dashboard/profile");
      return;
    }

    const role = (session?.user as { role?: string })?.role;
    if (role === "EXPERT") {
      router.replace("/expert/dashboard/profile");
    } else if (role === "ADMIN") {
      router.replace("/admin/dashboard/settings");
    } else {
      router.replace("/client/dashboard/profile");
    }
  }, [session, status, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
      <p className="mt-4 text-sm text-muted-foreground">Redirecting to profile...</p>
    </div>
  );
}
