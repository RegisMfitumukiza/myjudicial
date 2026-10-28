"use client";

import { AppSidebar } from "./app-sidebar";
import { ConsumerHeader } from "./consumer-header";
import { useAuth } from "@/providers/auth-provider";
import { usePathname } from "@/i18n/routing";
import { UserRole } from "@/features/auth/types";
import type { PublicUser } from "@/features/auth/types";
import { useNotificationsRealtime } from "@/features/notifications/hooks/use-notifications-realtime";
import { ActiveConsultationProvider } from "@/features/booking/context/active-consultation-context";
import { FloatingMeetingDock } from "@/features/booking/components/floating-meeting-dock";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: PublicUser; // Optional user prop to override useAuth
}

/**
 * Unified Dashboard Layout
 * 
 * - ADMIN & EXPERT: Professional sidebar layout (productivity-focused)
 * - CITIZEN: Consumer top-nav layout (like Airbnb/Amazon)
 * - Both support persistent ActiveConsultationProvider and FloatingMeetingDock
 *   for seamless multitasking during live video consultations.
 */
export function DashboardLayout({ children, user: propUser }: DashboardLayoutProps) {
  const { user: authUser } = useAuth();
  const pathname = usePathname();

  // Use prop user if provided, fallback to auth user
  const rawUser = propUser || authUser;

  // Real-time notification subscription for active user
  useNotificationsRealtime(rawUser?.id);

  if (!rawUser) return null;

  const inferredRole = pathname?.includes("/admin")
    ? UserRole.ADMIN
    : pathname?.includes("/expert")
      ? UserRole.EXPERT
      : UserRole.CITIZEN;

  const role = (rawUser.role as UserRole) || inferredRole;
  const user: PublicUser = { ...rawUser, role };

  const isJoinRoute =
    pathname?.includes("/consultations/") && pathname?.endsWith("/join");

  // Citizens get consumer-style layout (top nav)
  if (user.role === UserRole.CITIZEN) {
    return (
      <ActiveConsultationProvider>
        <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
          {!isJoinRoute && <ConsumerHeader user={user} pathname={pathname} />}
          <main
            className={
              isJoinRoute
                ? "flex-1 w-full h-full min-w-0"
                : "flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 min-w-0"
            }
          >
            {children}
          </main>
          <FloatingMeetingDock />
        </div>
      </ActiveConsultationProvider>
    );
  }

  // Admins & Experts get professional sidebar layout
  return (
    <ActiveConsultationProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar (hidden on full-screen join route, visible everywhere else) */}
        {!isJoinRoute && <AppSidebar user={user} pathname={pathname} />}

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Clear fixed mobile header on screens < 1024px if not on join route */}
          <main
            className={`flex-1 overflow-y-auto overflow-x-hidden min-w-0 ${
              !isJoinRoute ? "pt-16 lg:pt-0" : ""
            }`}
          >
            <div className="w-full min-w-0 min-h-full">{children}</div>
          </main>
        </div>
        <FloatingMeetingDock />
      </div>
    </ActiveConsultationProvider>
  );
}
