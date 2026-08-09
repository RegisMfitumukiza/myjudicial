import "server-only";

import { redirect } from "next/navigation";

import type { UserRole } from "@/features/auth/types";

import { getCurrentSession } from "./session";

export async function requireAuth(locale?: string) {
  const session = await getCurrentSession();

  if (!session) {
    redirect(locale ? `/${locale}/sign-in` : "/sign-in");
  }

  return session;
}

export async function requireRole(roles: UserRole[], locale?: string) {
  const session = await requireAuth(locale);

  if (!roles.includes(session.user.role)) {
    redirect(locale ? `/${locale}/client/dashboard` : "/client/dashboard");
  }

  return session;
}