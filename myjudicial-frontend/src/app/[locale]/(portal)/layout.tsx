"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/shared/layouts";
import { PortalShellSkeleton } from "@/shared/components/dashboard";
import { useAuth } from "@/providers/auth-provider";
import { UserRole, UserStatus, type PublicUser } from "@/features/auth/types";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { user: authUser, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (status === "loading") return;

    const isBrowser = typeof window !== "undefined";
    const host = isBrowser ? window.location.hostname.toLowerCase() : "";
    const adminHost = (process.env.NEXT_PUBLIC_ADMIN_PORTAL_HOST ?? "admin.myjudicial.com")
      .replace(/^https?:\/\//, "")
      .toLowerCase();
    const isAdminHost = host.startsWith("admin.") || host === adminHost;

    if (status === "unauthenticated") {
      // If the browser is temporarily offline (e.g. laptop lid opened and Wi-Fi is reconnecting),
      // do not prematurely bounce to sign-in. Wait for connection restoration.
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return;
      }

      const isAdminRoute = isAdminHost || pathname.includes("/admin");
      const returnUrl = encodeURIComponent(pathname);
      router.replace(isAdminRoute ? `/sign-in?admin=1&callbackUrl=${returnUrl}` : `/sign-in?callbackUrl=${returnUrl}`);
      return;
    }

    const rawRole = (session?.user as any)?.role || (authUser as any)?.role;
    const normRole = rawRole ? String(rawRole).trim().toUpperCase() : undefined;

    // Strict boundary enforcement for admin host:
    if (isAdminHost) {
      if (pathname.includes("/admin/")) {
        // Only administrators are allowed inside /admin/*
        if (normRole && normRole !== "ADMIN") {
          // Hard external redirect to main site — never soft router.replace to client/expert on admin host!
          const target = normRole === "EXPERT" ? "/expert/dashboard" : "/client/dashboard";
          window.location.href = `https://www.myjudicial.com${target}`;
          return;
        }
      } else {
        // If user somehow lands on non-admin routes on the admin host (e.g. /client/dashboard or /expert/dashboard):
        if (normRole === "ADMIN" || !normRole) {
          router.replace("/admin/dashboard");
          return;
        } else {
          window.location.href = `https://www.myjudicial.com${pathname}`;
          return;
        }
      }
      return;
    }

    // Role guards for non-admin hosts (myjudicial.com):
    // Role guard: non-admin users must not access /admin/* routes.
    if (pathname.includes("/admin/") && normRole && normRole !== "ADMIN") {
      router.replace(normRole === "EXPERT" ? "/expert/dashboard" : "/client/dashboard");
      return;
    }

    // Role guard: non-expert users must not access /expert/* routes.
    if (pathname.includes("/expert/") && normRole && normRole !== "EXPERT") {
      router.replace(normRole === "ADMIN" ? "/admin/dashboard" : "/client/dashboard");
      return;
    }

    // Role guard: non-citizen users must not access /client/* routes.
    if (pathname.includes("/client/") && normRole && normRole !== "CITIZEN") {
      router.replace(normRole === "ADMIN" ? "/admin/dashboard" : "/expert/dashboard");
      return;
    }
  }, [status, session, authUser, pathname, router]);

  // When connection comes back online after sleep, re-verify session if it was temporarily unauthenticated
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => {
      if (status === "unauthenticated") {
        window.location.reload();
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [status]);

  // Show structural shell skeleton while checking authentication
  if (status === "loading") {
    return <PortalShellSkeleton />;
  }

  if (status === "unauthenticated") {
    return <PortalShellSkeleton />; // Keep layout stable during redirect
  }

  // Use NextAuth session as primary source of truth for user data
  // This ensures role consistency during the authentication flow
  const sessionUser = session?.user;
  const isBrowser = typeof window !== "undefined";
  const currentHost = isBrowser ? window.location.hostname.toLowerCase() : "";
  const configuredAdminHost = (process.env.NEXT_PUBLIC_ADMIN_PORTAL_HOST ?? "admin.myjudicial.com")
    .replace(/^https?:\/\//, "")
    .toLowerCase();
  const isOnAdminHost = currentHost.startsWith("admin.") || currentHost === configuredAdminHost;

  const inferredRole = (isOnAdminHost || pathname.includes("/admin"))
    ? UserRole.ADMIN
    : pathname.includes("/expert")
      ? UserRole.EXPERT
      : UserRole.CITIZEN;

  const rawRole = (sessionUser as any)?.role || (authUser as any)?.role;
  const normRole = rawRole ? String(rawRole).trim().toUpperCase() : undefined;
  const effectiveRole = (normRole as UserRole) || inferredRole;

  const user: PublicUser | null = authUser && !authLoading ? {
    ...authUser,
    role: authUser.role || effectiveRole,
  } : (sessionUser ? {
    id: sessionUser.id || 'current-user',
    email: sessionUser.email || '',
    firstName: sessionUser.name?.split(' ')[0] || (sessionUser as any).firstName || '',
    lastName: sessionUser.name?.split(' ').slice(1).join(' ') || (sessionUser as any).lastName || '',
    role: effectiveRole,
    phone: (sessionUser as any).phone || null,
    preferredLanguage: 'en',
    status: ((sessionUser as any).status as UserStatus) || UserStatus.ACTIVE,
    avatarObjectKey: sessionUser.image ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expertProfile: (sessionUser as any).expertProfile ?? null,
  } : null);

  if (!user) {
    return <PortalShellSkeleton />;
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
