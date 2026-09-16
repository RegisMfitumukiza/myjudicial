"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/shared/layouts";
import { useAuth } from "@/providers/auth-provider";
import { UserRole, UserStatus } from "@/features/auth/types";

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
      router.replace("/sign-in");
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

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-dark border-t-transparent dark:border-white mx-auto" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // Will redirect
  }

  // Use NextAuth session as primary source of truth for user data
  // This ensures role consistency during the authentication flow
  const sessionUser = session?.user;
  const user = authUser && !authLoading ? authUser : (sessionUser ? {
    id: sessionUser.id!,
    email: sessionUser.email!,
    firstName: sessionUser.name?.split(' ')[0] || (sessionUser as any).firstName || '',
    lastName: sessionUser.name?.split(' ').slice(1).join(' ') || (sessionUser as any).lastName || '',
    role: (sessionUser as any).role as UserRole,
    phone: (sessionUser as any).phone || null,
    preferredLanguage: 'en',
    status: ((sessionUser as any).status as UserStatus) || UserStatus.ACTIVE,
    avatarObjectKey: sessionUser.image ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expertProfile: (sessionUser as any).expertProfile ?? null,
  } : null);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-dark border-t-transparent dark:border-white mx-auto" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading user data...</p>
        </div>
      </div>
    );
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
