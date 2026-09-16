import type { Role, ExpertStatus } from "../generated/prisma/client.js";

declare global {
  namespace Express {
    interface Request {
      /**
       * Attached by the `authenticate` middleware after JWT verification.
       * Contains the minimal fields needed for authorization decisions.
       */
      user?: AuthenticatedUser;

      /**
       * Attached by `validateQuery` middleware — typed parsed query params.
       */
      validatedQuery?: Record<string, unknown>;
    }
  }
}

/**
 * The shape of req.user after authentication middleware runs.
 * Sourced from Supabase JWT claims + a single DB lookup for role/status.
 */
export type AuthenticatedUser = {
  /** Supabase Auth UUID — matches users.id in our PostgreSQL */
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  /** null if user has no expert profile */
  expertProfileId: string | null;
  /** Expert verification status — null for clients */
  expertStatus: ExpertStatus | null;
  /** Nested expert profile for UI status mapping */
  expertProfile?: { id: string; status: ExpertStatus } | null;
  preferredLanguage: string;
  /** OCI object key for the user's profile photo — null if never uploaded */
  avatarObjectKey: string | null;
  /** User's phone number — null if not provided */
  phone: string | null;
};

export {};
