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

    if (status === "unauthenticated") {
      // If the browser is temporarily offline (e.g. laptop lid opened and Wi-Fi is reconnecting),
      // do not prematurely bounce to sign-in. Wait for connection restoration.
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return;
      }

      const isAdminRoute = pathname.includes("/admin");
      const returnUrl = encodeURIComponent(pathname);
      router.replace(isAdminRoute ? `/sign-in?admin=1&callbackUrl=${returnUrl}` : `/sign-in?callbackUrl=${returnUrl}`);
      return;
    }

    // Role guard: non-admin users must not access /admin/* routes.
    const role = (session?.user as any)?.role as UserRole | undefined;
    if (pathname.includes("/admin/") && role && role !== UserRole.ADMIN) {
      router.replace(role === UserRole.EXPERT ? "/expert/dashboard" : "/client/dashboard");
      return;
    }

    // Role guard: non-expert users must not access /expert/* routes.
    if (pathname.includes("/expert/") && role && role !== UserRole.EXPERT) {
      router.replace(role === UserRole.ADMIN ? "/admin/dashboard" : "/client/dashboard");
      return;
    }

    // Role guard: non-citizen users must not access /client/* routes.
    if (pathname.includes("/client/") && role && role !== UserRole.CITIZEN) {
      router.replace(role === UserRole.ADMIN ? "/admin/dashboard" : "/expert/dashboard");
      return;
    }
  }, [status, session, pathname, router]);

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
  const inferredRole = pathname.includes("/admin")
    ? UserRole.ADMIN
    : pathname.includes("/expert")
      ? UserRole.EXPERT
      : UserRole.CITIZEN;

  const rawRole = (sessionUser as any)?.role || (authUser as any)?.role;
  const effectiveRole = (rawRole as UserRole) || inferredRole;

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
