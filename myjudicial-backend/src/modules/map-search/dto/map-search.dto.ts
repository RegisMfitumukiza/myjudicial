import type { PresenceStatus } from "../../../generated/prisma/client.js";

// ─── Response DTOs (what the API returns to clients) ────────────────────────

/**
 * Compact expert card — returned in nearby/location search results.
 * Matches the spec response shape exactly. Contains NO sensitive fields.
 */
export interface ExpertMapCardDto {
  id: string;
  fullName: string;
  profileImage: string | null;
  /** Time-limited signed URL to display the photo — null if none uploaded. */
  avatarUrl: string | null;
  primarySpecialty?: string | null;
  specialties: string[];
  yearsOfExperience: number | null;
  rating: number | null;
  reviewCount: number;
  distanceKm: number;
  officeAddress: string | null;
  city: string | null;
  languages: string[];
  availability: PresenceStatus | null;
  verified: boolean;
  latitude: number | null;
  longitude: number | null;
  /** The expert's base consultation fee — null if never set. */
  baseConsultationFee: number | null;
  currency: string;
}

/**
 * Extended public expert detail — returned by GET /map-search/experts/:id.
 * Includes services for the booking flow but no sensitive info.
 */
export interface ExpertMapDetailDto extends ExpertMapCardDto {
  bio: string | null;
  primarySpecialty: string;
  firmName: string | null;
  country: string;
  services: ExpertServiceSummaryDto[];
}

/** Minimal service info exposed to allow the client to proceed to booking */
export interface ExpertServiceSummaryDto {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  flatFee: number;
  currency: string;
}

// ─── Repository query params ─────────────────────────────────────────────────

export interface NearbyQueryParams {
  latitude: number;
  longitude: number;
  radiusKm: number;
  sort: string;
  page: number;
  limit: number;
  specialties?: string[];
  languages?: string[];
  availability?: string;
  minRating?: number;
  minYearsExperience?: number;
  includeOnLeave: boolean;
  search?: string;
  instantConsult?: boolean;
}

// ─── Raw row returned by PostGIS query ───────────────────────────────────────

export interface ExpertMapRow {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  profileImageObjectKey: string | null;
  primarySpecialty: string;
  specialties: string[];
  yearsExperience: number | null;
  averageRating: string | null;   // Decimal comes back as string from raw query
  reviewCount: string;            // bigint from COUNT — comes back as string
  distanceKm: string;             // numeric from ST_Distance — comes back as string
  officeAddress: string | null;
  city: string | null;
  country: string;
  languages: string[];
  presenceStatus: string | null;
  isVerified: boolean;
  latitude: string | null;
  longitude: string | null;
  baseConsultationFee: string | null; // Decimal comes back as string from raw query
  currency: string;
}

export interface ExpertCountRow {
  total: string; // bigint from COUNT
}
