import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  isBookingParticipant,
  isOwner,
  isPubliclyReadable,
  type BookingScope,
  type RequesterContext,
} from "../src/modules/file-storage/access-rules.js";

const citizen     = { userId: "citizen-1",             role: "CITIZEN", expertProfileId: null } satisfies RequesterContext;
const expert      = { userId: "expert-user-1",         role: "EXPERT",  expertProfileId: "expert-profile-1" } satisfies RequesterContext;
const admin       = { userId: "admin-1",               role: "ADMIN",   expertProfileId: null } satisfies RequesterContext;
const outsider    = { userId: "other-citizen",         role: "CITIZEN", expertProfileId: null } satisfies RequesterContext;
const otherExpert = { userId: "other-expert-user",     role: "EXPERT",  expertProfileId: "other-expert-profile" } satisfies RequesterContext;
const nullExpert  = { userId: "orphan-expert-user",    role: "EXPERT",  expertProfileId: null } satisfies RequesterContext;

const booking: BookingScope = { citizenId: "citizen-1", expertId: "expert-profile-1" };

describe("isBookingParticipant", () => {
  test("grants the booking's citizen (even when requester has no expert profile)", () => {
    assert.equal(isBookingParticipant({ bookingId: "b1" }, booking, citizen), true);
  });

  test("grants the booking's assigned expert via expertProfileId", () => {
    assert.equal(isBookingParticipant({ bookingId: "b1" }, booking, expert), true);
  });

  test("denies an unrelated user (not citizen of this booking)", () => {
    assert.equal(isBookingParticipant({ bookingId: "b1" }, booking, outsider), false);
  });

  test("denies an expert who is not assigned to this booking", () => {
    assert.equal(isBookingParticipant({ bookingId: "b1" }, booking, otherExpert), false);
  });

  test("denies an expert whose profile was deleted (expertProfileId null)", () => {
    assert.equal(isBookingParticipant({ bookingId: "b1" }, booking, nullExpert), false);
  });

  test("denies when the document is NOT tied to a booking", () => {
    assert.equal(isBookingParticipant({ bookingId: null }, booking, citizen), false);
    assert.equal(isBookingParticipant({ bookingId: undefined }, booking, citizen), false);
  });

  test("denies when the booking could not be found", () => {
    assert.equal(isBookingParticipant({ bookingId: "missing" }, null, citizen), false);
    assert.equal(isBookingParticipant({ bookingId: "missing" }, undefined, citizen), false);
  });

  test("denies when the booking is cancelled/removed from the lookup result", () => {
    assert.equal(isBookingParticipant({ bookingId: "b1" }, null, expert), false);
  });

  test("ADMIN is not special-cased here (canAccess grants admins before this runs)", () => {
    assert.equal(isBookingParticipant({ bookingId: "b1" }, booking, admin), false);
  });

  test("citizen match wins even if it also belongs to the expert via userId collision", () => {
    const weird = { citizenId: "citizen-1", expertId: "citizen-1" } satisfies BookingScope;
    assert.equal(isBookingParticipant({ bookingId: "b1" }, weird, citizen), true);
  });
});

describe("isOwner", () => {
  test("grants USER owner", () => {
    assert.equal(isOwner({ ownerType: "USER", ownerId: "citizen-1" }, citizen), true);
    assert.equal(isOwner({ ownerType: "USER", ownerId: "citizen-1" }, expert), false);
  });

  test("grants EXPERT owner", () => {
    assert.equal(isOwner({ ownerType: "EXPERT", ownerId: "expert-profile-1" }, expert), true);
    assert.equal(isOwner({ ownerType: "EXPERT", ownerId: "expert-profile-1" }, otherExpert), false);
  });

  test("grants COMPLIANCE owner to the expert profile", () => {
    assert.equal(isOwner({ ownerType: "COMPLIANCE", ownerId: "expert-profile-1" }, expert), true);
  });

  test("denies when ownerId does not match the requester's ids", () => {
    assert.equal(isOwner({ ownerType: "USER", ownerId: "someone-else" }, citizen), false);
    assert.equal(isOwner({ ownerType: "EXPERT", ownerId: "someone-else" }, expert), false);
  });

  test("denies when the requester has no expert profile and owner is EXPERT", () => {
    assert.equal(isOwner({ ownerType: "EXPERT", ownerId: "expert-profile-1" }, citizen), false);
  });

  test("ADMIN is not special-cased here (canDelete grants admins before this runs)", () => {
    assert.equal(isOwner({ ownerType: "USER", ownerId: "citizen-1" }, admin), false);
  });
});

describe("isPubliclyReadable", () => {
  test("only PUBLIC sensitivity is readable by any authenticated user", () => {
    assert.equal(isPubliclyReadable({ id: "d1", sensitivity: "PUBLIC" }), true);
    assert.equal(isPubliclyReadable({ id: "d1", sensitivity: "PRIVATE" }), false);
    assert.equal(isPubliclyReadable({ id: "d1", sensitivity: "CONFIDENTIAL" }), false);
  });
});