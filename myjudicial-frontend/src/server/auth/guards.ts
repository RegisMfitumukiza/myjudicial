import "server-only";

import { redirect } from "next/navigation";

import { UserRole } from "@/features/auth/types";

import { getCurrentSession } from "./session";

export async function requireAuth(locale?: string) {
  const session = await getCurrentSession();

  if (!session) {
    redirect(`/${locale ?? "en"}/sign-in`);
  }

  return session;
}

export async function requireRole(roles: UserRole[], locale?: string) {
  const session = await requireAuth(locale);

  if (!roles.includes(session.user.role)) {
    const targetDashboard =
      session.user.role === UserRole.ADMIN
        ? "/admin/dashboard"
        : session.user.role === UserRole.EXPERT
          ? "/expert/dashboard"
          : "/client/dashboard";

    redirect(`/${locale ?? "en"}${targetDashboard}`);
  }

  return session;
}