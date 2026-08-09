import "server-only";

import { auth } from "./authjs";

import { UserStatus, type UserRole } from "@/features/auth/types";

export type CurrentSession = {
  id: string;
  userId: string;
  accessToken?: string;
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    fullName: string;
    role: UserRole;
    status: UserStatus;
    emailVerifiedAt: Date | null;
    phoneVerifiedAt: Date | null;
  };
};

function parseNullableDate(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

export async function getCurrentSession(): Promise<CurrentSession | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  if (
    session.user.status === UserStatus.SUSPENDED ||
    session.user.status === UserStatus.DELETED
  ) {
    return null;
  }

  const sessionAny = session as unknown as Record<string, unknown>;

  return {
    id: "authjs",
    userId: session.user.id,
    accessToken: sessionAny.accessToken as string | undefined,
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
      phone: session.user.phone,
      fullName: session.user.name ?? "MyJudicial user",
      role: session.user.role as UserRole,
      status: (sessionAny.status as UserStatus) ?? UserStatus.ACTIVE,
      emailVerifiedAt: parseNullableDate(session.user.emailVerifiedAt),
      phoneVerifiedAt: parseNullableDate(session.user.phoneVerifiedAt),
    },
  };
}