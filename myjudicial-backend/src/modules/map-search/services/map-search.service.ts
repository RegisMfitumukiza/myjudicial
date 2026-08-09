import { MapSearchRepository } from "../repositories/map-search.repository.js";
import { ExpertNotFoundError } from "../errors/map-search.errors.js";
import { buildPaginationMeta } from "../../../shared/utils/pagination.js";
import { getSignedDownloadUrl } from "../../../infrastructure/storage/oci-object-storage.service.js";
import type { NearbySearchDto } from "../schemas/map-search.schemas.js";
import type { ExpertMapCardDto, ExpertMapDetailDto, NearbyQueryParams } from "../dto/map-search.dto.js";
import type { PaginationMeta } from "../../../shared/utils/pagination.js";
import type { PresenceStatus } from "../../../generated/prisma/client.js";

// ─── Shape raw PostGIS rows into spec-compliant API cards ────────────────────

async function toExpertCard(row: any): Promise<ExpertMapCardDto> {
  const avatarUrl = row.profileImageObjectKey
    ? (await getSignedDownloadUrl(row.profileImageObjectKey)).url
    : null;

  return {
    id: row.id,
    fullName: `${row.firstName} ${row.lastName}`,
    profileImage: row.profileImageObjectKey ?? null,
    avatarUrl,
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
    yearsOfExperience: row.yearsExperience !== null ? Number(row.yearsExperience) : null,
    rating: row.averageRating !== null ? Number(Number(row.averageRating).toFixed(2)) : null,
    reviewCount: parseInt(String(row.reviewCount ?? "0"), 10),
    distanceKm: Number(Number(row.distanceKm).toFixed(2)),
    officeAddress: row.officeAddress ?? null,
    city: row.city ?? null,
    languages: Array.isArray(row.languages) ? row.languages : [],
    availability: (row.presenceStatus as PresenceStatus) ?? null,
    verified: Boolean(row.isVerified),
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    baseConsultationFee: row.baseConsultationFee !== null ? Number(row.baseConsultationFee) : null,
    currency: row.currency ?? "RWF",
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const MapSearchService = {
  /**
   * Search experts near a GPS coordinate with full filter + sort + pagination.
   * Used by both POST /nearby and POST /location (same logic, different semantic intent).
   */
  searchNearby: async (
    dto: NearbySearchDto
  ): Promise<{
    experts: ExpertMapCardDto[];
    pagination: PaginationMeta;
  }> => {
    const params: NearbyQueryParams = {
      latitude: dto.latitude,
      longitude: dto.longitude,
      radiusKm: dto.radiusKm,
      sort: dto.sort,
      page: dto.page,
      limit: dto.limit,
      specialties: dto.filters?.specialties?.map(String),
      languages: dto.filters?.languages,
      availability: dto.filters?.availability,
      minRating: dto.filters?.minRating,
      minYearsExperience: dto.filters?.minYearsExperience,
      includeOnLeave: dto.filters?.includeOnLeave ?? false,
      search: dto.search,
    };

    const { rows, total } = await MapSearchRepository.searchNearby(params);

    const experts = await Promise.all(rows.map(toExpertCard));

    const pagination = buildPaginationMeta(total, {
      page: dto.page,
      limit: dto.limit,
      skip: (dto.page - 1) * dto.limit,
    });

    return { experts, pagination };
  },

  /**
   * Alias for searchNearby — POST /location uses the same logic.
   * Architecturally separate so geocoded addresses can be plugged in later
   * (address string → lat/lon → searchNearby) without touching the nearby endpoint.
   */
  searchByLocation: async (
    dto: NearbySearchDto
  ): Promise<{
    experts: ExpertMapCardDto[];
    pagination: PaginationMeta;
  }> => {
    return MapSearchService.searchNearby(dto);
  },

  /**
   * Get a single expert's full public detail for the booking flow.
   * Throws ExpertNotFoundError if not VERIFIED or not found.
   */
  getExpertDetail: async (expertId: string): Promise<ExpertMapDetailDto> => {
    const detail = await MapSearchRepository.findExpertDetail(expertId);
    if (!detail) {
      throw new ExpertNotFoundError();
    }
    return detail;
  },

  /**
   * Sync the PostGIS map_markers entry when an expert updates their location.
   * Called from ProfileService.updateProfile.
   */
  syncMapMarker: async (
    expertId: string,
    latitude: number,
    longitude: number
  ): Promise<void> => {
    await MapSearchRepository.upsertMapMarker(expertId, latitude, longitude);
  },

  /**
   * Recompute and persist denormalized rating stats after a review is submitted.
   * Called from the Review submission service.
   */
  refreshRatingStats: async (expertId: string): Promise<void> => {
    await MapSearchRepository.updateExpertRatingStats(expertId);
  },
};
