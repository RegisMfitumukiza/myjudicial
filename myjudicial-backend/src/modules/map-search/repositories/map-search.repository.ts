import { prisma } from "../../../infrastructure/database/prisma.js";
import { Prisma } from "../../../generated/prisma/client.js";
import { getSignedDownloadUrl } from "../../../infrastructure/storage/oci-object-storage.service.js";
import type {
  NearbyQueryParams,
  ExpertMapRow,
  ExpertCountRow,
  ExpertMapDetailDto,
  ExpertServiceSummaryDto,
} from "../dto/map-search.dto.js";
import { logger } from "../../../shared/utils/logger.js";

// ─── Sort clause builder ────────────────────────────────────────────────────

function buildOrderClause(sort: string): Prisma.Sql {
  switch (sort) {
    case "RECOMMENDED":
      return Prisma.sql`ORDER BY (COALESCE(e."averageRating", 0) * 0.4 + LEAST(e."reviewCount", 50) * 0.1 + COALESCE(e."yearsExperience", 0) * 0.2) DESC, "distanceKm" ASC`;
    case "HIGHEST_RATED":
      return Prisma.sql`ORDER BY e."averageRating" DESC NULLS LAST, "distanceKm" ASC`;
    case "MOST_EXPERIENCED":
      return Prisma.sql`ORDER BY e."yearsExperience" DESC NULLS LAST, "distanceKm" ASC`;
    case "MOST_REVIEWED":
      return Prisma.sql`ORDER BY e."reviewCount" DESC, "distanceKm" ASC`;
    case "AVAILABLE_NOW":
      return Prisma.sql`ORDER BY (CASE WHEN ea."presenceStatus" = 'ONLINE' THEN 0 ELSE 1 END) ASC, "distanceKm" ASC`;
    case "NEAREST":
    default:
      return Prisma.sql`ORDER BY "distanceKm" ASC`;
  }
}

// ─── Repository ─────────────────────────────────────────────────────────────

export const MapSearchRepository = {
  /**
   * Single PostGIS query joining map_markers → experts → users → availability.
   * Returns paginated expert cards ordered by the requested sort.
   * All filters are applied in SQL — no N+1 queries.
   */
  searchNearby: async (
    params: NearbyQueryParams
  ): Promise<{ rows: ExpertMapRow[]; total: number }> => {
    const {
      latitude,
      longitude,
      radiusKm,
      sort,
      page,
      limit,
      specialties,
      languages,
      minRating,
      minYearsExperience,
      availability,
      includeOnLeave,
      search,
      instantConsult,
    } = params;

    const radiusMeters = radiusKm * 1000;
    const offset = (page - 1) * limit;

    // ── Dynamic WHERE clauses ─────────────────────────────────────────────
    const whereClauses: Prisma.Sql[] = [
      Prisma.sql`mm."isVisible" = true`,
      Prisma.sql`e.status = 'VERIFIED'`,
      Prisma.sql`u.status = 'ACTIVE'`,
    ];

    // Constrain by radius when a local proximity is requested (under country-wide 250km)
    if (radiusKm && radiusKm < 250) {
      whereClauses.push(
        Prisma.sql`ST_DWithin(
          mm.location,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${radiusMeters}
        )`
      );
    }

    if (specialties && specialties.length > 0) {
      // Postgres ANY operator — matches if any specialty overlaps
      whereClauses.push(
        Prisma.sql`e.specialties && ARRAY[${Prisma.join(
          specialties.map((s) => Prisma.sql`${s}::"LegalSpecialty"`),
          ", "
        )}]::"LegalSpecialty"[]`
      );
    }

    if (languages && languages.length > 0) {
      whereClauses.push(
        Prisma.sql`e.languages && ARRAY[${Prisma.join(
          languages.map((l) => Prisma.sql`${l}`),
          ", "
        )}]::text[]`
      );
    }

    if (minRating !== undefined) {
      whereClauses.push(
        Prisma.sql`e."averageRating" >= ${minRating}`
      );
    }

    if (minYearsExperience !== undefined) {
      whereClauses.push(
        Prisma.sql`e."yearsExperience" >= ${minYearsExperience}`
      );
    }

    // Availability filter
    if (availability === "ONLINE" || availability === "AVAILABLE_NOW") {
      whereClauses.push(
        Prisma.sql`ea."presenceStatus" = 'ONLINE'`
      );
    } else if (availability === "AVAILABLE_TODAY") {
      // Expert has a schedule slot today with isAvailable = true
      whereClauses.push(
        Prisma.sql`ea."isAvailable" = true`
      );
    }

    // Hide ON_LEAVE experts unless requested
    if (!includeOnLeave) {
      whereClauses.push(
        Prisma.sql`(ea."presenceStatus" IS NULL OR ea."presenceStatus" != 'ON_LEAVE')`
      );
    }

    if (search) {
      whereClauses.push(
        Prisma.sql`(
          u."firstName" ILIKE ${"%" + search + "%"}
          OR u."lastName" ILIKE ${"%" + search + "%"}
          OR e."displayName" ILIKE ${"%" + search + "%"}
        )`
      );
    }

    if (instantConsult) {
      whereClauses.push(
        Prisma.sql`EXISTS (
          SELECT 1 FROM services s
          WHERE s."expertId" = e.id
            AND s."isActive" = true
            AND s.name ILIKE '%instant%'
        )`
      );
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(whereClauses, " AND ")}`;
    const orderClause = buildOrderClause(sort);

    // ── Get current day of week for availability join ─────────────────────
    // PostgreSQL: TO_CHAR(NOW() AT TIME ZONE 'Africa/Kigali', 'FMDAY') → 'MONDAY'
    const currentDay = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "Africa/Kigali",
    }).toUpperCase() as "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

    // ── Main search query ─────────────────────────────────────────────────
    const rows = await prisma.$queryRaw<ExpertMapRow[]>`
      SELECT
        e.id,
        e."displayName",
        u."firstName",
        u."lastName",
        e."profileImageObjectKey",
        e."primarySpecialty",
        e.specialties::text[] AS specialties,
        e."yearsExperience",
        e."averageRating",
        e."reviewCount",
        e."baseConsultationFee"::text,
        e.currency,
        ROUND(
          (ST_Distance(
            mm.location,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
          ) / 1000.0)::numeric,
          2
        ) AS "distanceKm",
        e."officeAddress",
        e.city,
        e.country,
        e.languages,
        ea."presenceStatus",
        (e.status = 'VERIFIED') AS "isVerified",
        mm.latitude::text,
        mm.longitude::text
      FROM map_markers mm
      JOIN experts e ON e.id = mm."expertId"
      JOIN users u ON u.id = e."userId"
      LEFT JOIN expert_availability ea
        ON ea."expertId" = e.id
        AND ea."dayOfWeek" = ${currentDay}::"DayOfWeek"
      ${whereClause}
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}
    `;

    // ── Count query (same filters, no pagination) ─────────────────────────
    const countRows = await prisma.$queryRaw<ExpertCountRow[]>`
      SELECT COUNT(*) AS total
      FROM map_markers mm
      JOIN experts e ON e.id = mm."expertId"
      JOIN users u ON u.id = e."userId"
      LEFT JOIN expert_availability ea
        ON ea."expertId" = e.id
        AND ea."dayOfWeek" = ${currentDay}::"DayOfWeek"
      ${whereClause}
    `;

    const total = parseInt(countRows[0]?.total ?? "0", 10);

    logger.info("MapSearch: query executed", {
      radiusKm,
      sort,
      filters: { specialties, languages, availability, minRating, minYearsExperience },
      resultCount: rows.length,
      total,
    });

    return { rows, total };
  },

  /**
   * Fetch a single expert's full public profile for the detail view.
   * Includes active services so the client can proceed to booking.
   * Returns null if the expert does not exist or is not VERIFIED.
   */
  findExpertDetail: async (expertId: string): Promise<ExpertMapDetailDto | null> => {
    const expert = await prisma.expertProfile.findUnique({
      where: { id: expertId, status: "VERIFIED" },
      select: {
        id: true,
        displayName: true,
        bio: true,
        firmName: true,
        primarySpecialty: true,
        specialties: true,
        languages: true,
        yearsExperience: true,
        averageRating: true,
        reviewCount: true,
        officeAddress: true,
        city: true,
        country: true,
        latitude: true,
        longitude: true,
        profileImageObjectKey: true,
        baseConsultationFee: true,
        currency: true,
        status: true,
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            durationMin: true,
            flatFee: true,
            currency: true,
          },
          orderBy: { flatFee: "asc" },
        },
        availability: {
          select: { presenceStatus: true, dayOfWeek: true, isAvailable: true },
          take: 1,
          orderBy: { updatedAt: "desc" },
        },
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!expert) return null;

    const availability = expert.availability[0]?.presenceStatus ?? null;
    const services: ExpertServiceSummaryDto[] = expert.services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      durationMin: s.durationMin,
      flatFee: Number(s.flatFee),
      currency: s.currency,
    }));
    const avatarUrl = expert.profileImageObjectKey
      ? (await getSignedDownloadUrl(expert.profileImageObjectKey)).url
      : null;

    return {
      id: expert.id,
      fullName: `${expert.user.firstName} ${expert.user.lastName}`,
      profileImage: expert.profileImageObjectKey,
      avatarUrl,
      primarySpecialty: expert.primarySpecialty,
      specialties: expert.specialties,
      bio: expert.bio,
      firmName: expert.firmName,
      yearsOfExperience: expert.yearsExperience,
      rating: expert.averageRating !== null ? Number(expert.averageRating) : null,
      reviewCount: expert.reviewCount,
      distanceKm: 0, // Not applicable for detail view
      officeAddress: expert.officeAddress,
      city: expert.city,
      country: expert.country,
      languages: expert.languages,
      availability,
      verified: expert.status === "VERIFIED",
      latitude: expert.latitude !== null ? Number(expert.latitude) : null,
      longitude: expert.longitude !== null ? Number(expert.longitude) : null,
      baseConsultationFee: expert.baseConsultationFee !== null ? Number(expert.baseConsultationFee) : null,
      currency: expert.currency,
      services,
    };
  },

  /**
   * Upsert the PostGIS map_markers row whenever an expert updates their location.
   * Called from ProfileService.updateProfile when lat/lon changes.
   */
  upsertMapMarker: async (
    expertId: string,
    latitude: number,
    longitude: number
  ): Promise<void> => {
    await prisma.$executeRaw`
      INSERT INTO map_markers ("id", "expertId", latitude, longitude, location, "isVisible", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        ${expertId},
        ${latitude},
        ${longitude},
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT ("expertId") DO UPDATE
        SET
          latitude  = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          location  = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          "updatedAt" = NOW()
    `;
  },

  /**
   * Update denormalized rating stats on ExpertProfile after a new review.
   * Called from the review submission service.
   */
  updateExpertRatingStats: async (expertId: string): Promise<void> => {
    await prisma.$executeRaw`
      UPDATE experts
      SET
        "averageRating" = (
          SELECT ROUND(AVG(rating)::numeric, 2)
          FROM reviews
          WHERE "expertId" = ${expertId}
            AND "isDeleted" = false
            AND "status" = 'PUBLISHED'
        ),
        "reviewCount" = (
          SELECT COUNT(*) FROM reviews
          WHERE "expertId" = ${expertId}
            AND "isDeleted" = false
            AND "status" = 'PUBLISHED'
        ),
        "updatedAt" = NOW()
      WHERE id = ${expertId}
    `;
  },
};
