"use client";

import { AppSidebar } from "./app-sidebar";
import { ConsumerHeader } from "./consumer-header";
import { useAuth } from "@/providers/auth-provider";
import { usePathname } from "@/i18n/routing";
import { UserRole } from "@/features/auth/types";
import type { PublicUser } from "@/features/auth/types";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: PublicUser; // Optional user prop to override useAuth
}

/**
 * Unified Dashboard Layout
 * 
 * - ADMIN & EXPERT: Professional sidebar layout (productivity-focused)
 * - CITIZEN: Consumer top-nav layout (like Airbnb/Amazon)
 */
export function DashboardLayout({ children, user: propUser }: DashboardLayoutProps) {
  const { user: authUser } = useAuth();
  const pathname = usePathname();

  // Use prop user if provided, fallback to auth user
  const user = propUser || authUser;

  if (!user) return null;

  // Citizens get consumer-style layout (top nav)
  if (user.role === UserRole.CITIZEN) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <ConsumerHeader user={user} pathname={pathname} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    );
  }

  // Admins & Experts get professional sidebar layout
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AppSidebar user={user} pathname={pathname} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Add padding top on mobile to account for fixed header */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:pt-6 pt-20">
          {children}
        </main>
      </div>
    </div>
  );
}
