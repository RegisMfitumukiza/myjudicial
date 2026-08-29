/**
 * Pure authorization rules for file-storage documents.
 *
 * Kept free of repositories/network so they can be unit-tested without a
 * database. The service layers these rules over the data lookups
 * (booking lookup, share lookup).
 */

import type { StoredFileMetadata } from "./types/index.js";

export type RequesterContext = {
  userId:          string;
  role:            "CITIZEN" | "EXPERT" | "ADMIN";
  expertProfileId: string | null;
};

export type BookingScope =
  | { citizenId: string; expertId: string }
  | null
  | undefined;

export type AccessibleDoc = Pick<StoredFileMetadata, "id" | "sensitivity">;

/**
 * True when the document is attached to a booking AND the requester is that
 * booking's citizen or its assigned expert. ADMIN bypass is the caller's job
 * (canAccess checks it first), so this rule is purely participant-scoped.
 */
export const isBookingParticipant = (
  doc: Pick<StoredFileMetadata, "bookingId">,
  booking: BookingScope,
  requester: RequesterContext
): boolean =>
  Boolean(
    doc.bookingId &&
      booking &&
      (booking.citizenId === requester.userId ||
        booking.expertId === requester.expertProfileId)
  );

/**
 * Direct ownership match. ADMIN bypass is the caller's job.
 * Used by both canAccess (read) and canDelete (write).
 */
export const isOwner = (
  doc: Pick<StoredFileMetadata, "ownerType" | "ownerId">,
  requester: RequesterContext
): boolean => {
  if (doc.ownerType === "USER" && doc.ownerId === requester.userId) return true;
  if (doc.ownerType === "EXPERT" && doc.ownerId === requester.expertProfileId) return true;
  if (doc.ownerType === "COMPLIANCE" && doc.ownerId === requester.expertProfileId) return true;
  return false;
};

/** Docs with PUBLIC sensitivity are readable by any authenticated user. */
export const isPubliclyReadable = (doc: AccessibleDoc): boolean =>
  doc.sensitivity === "PUBLIC";