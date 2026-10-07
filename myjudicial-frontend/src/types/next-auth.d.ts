import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: number;
    error?: string;
    user: {
      id: string;
      phone: string | null;
      role: string;
      status: string;
      emailVerifiedAt: string | null;
      phoneVerifiedAt: string | null;
      firstName?: string;
      lastName?: string;
    } & DefaultSession["user"];
  }

  interface User {
    phone?: string | null;
    role?: string;
    status?: string;
    emailVerifiedAt?: string | null;
    phoneVerifiedAt?: string | null;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    phone?: string | null;
    role?: string;
    status?: string;
    emailVerifiedAt?: string | null;
    phoneVerifiedAt?: string | null;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: number;
    error?: string;
    firstName?: string;
    lastName?: string;
  }
}
