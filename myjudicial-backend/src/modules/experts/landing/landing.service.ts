import { prisma } from "../../../infrastructure/database/prisma.js";
import { getSignedDownloadUrl } from "../../../infrastructure/storage/oci-object-storage.service.js";

async function resolveAvatarUrl(key: string | null): Promise<string | null> {
  if (!key) return null;
  try {
    const { url } = await getSignedDownloadUrl(key);
    return url;
  } catch {
    return null;
  }
}

const SPECIALTY_LABELS: Record<string, string> = {
  FAMILY_LAW: "Family Law",
  COMMERCIAL_LAW: "Commercial Law",
  EMPLOYMENT_LAW: "Employment Law",
  LAND_LAW: "Land & Property Law",
  CRIMINAL_LAW: "Criminal Defense",
  TAX_LAW: "Tax & Revenue Law",
  IMMIGRATION_LAW: "Immigration Law",
  CORPORATE_LAW: "Corporate Law",
  CONTRACT_LAW: "Contract Law",
  INTELLECTUAL_PROPERTY: "Intellectual Property",
  OTHER: "Other",
};

export type SectionSource = "real_metrics" | "curated" | "disabled";

export type SectionResponse<T> = {
  data: T[];
  source: SectionSource;
  isEmpty: boolean;
};

function wrapSection<T>(data: T[], source: SectionSource): SectionResponse<T> {
  return { data, source, isEmpty: data.length === 0 };
}

function toExpertSummary(e: any, avatarUrl: string | null) {
  return {
    id: e.id,
    name: e.displayName || `${e.user.firstName} ${e.user.lastName}`,
    specialty: e.primarySpecialty,
    specialties: e.specialties ?? [],
    rating: e.averageRating ? Number(e.averageRating) : null,
    reviewCount: e.reviewCount ?? 0,
    city: e.city,
    flatFee: e.baseConsultationFee ? Number(e.baseConsultationFee) : null,
    currency: e.currency || "RWF",
    avatarUrl,
    yearsExperience: e.yearsExperience ?? null,
    languages: e.languages ?? [],
    verified: e.status === "VERIFIED",
    presenceStatus: e.availability?.[0]?.presenceStatus ?? "OFFLINE",
  };
}

const BASE_SELECT = {
  id: true,
  displayName: true,
  primarySpecialty: true,
  specialties: true,
  averageRating: true,
  reviewCount: true,
  city: true,
  baseConsultationFee: true,
  currency: true,
  profileImageObjectKey: true,
  yearsExperience: true,
  languages: true,
  status: true,
  availability: {
    select: { presenceStatus: true },
    take: 1,
  },
  user: { select: { firstName: true, lastName: true } },
};

export const LandingService = {
  getPublicStats: async () => {
    const [userCounts, expertCounts, bookingCounts, practiceAreaCount] = await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: true }),
      prisma.expertProfile.groupBy({ by: ["status"], _count: true }),
      prisma.booking.groupBy({ by: ["status"], _count: true }),
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT s)::bigint AS count
        FROM experts e, UNNEST(e.specialties) AS s
        WHERE e.status = 'VERIFIED'
      `,
    ]);

    const totalClients = userCounts.find((c) => c.role === "CITIZEN")?._count || 0;
    const totalExperts = userCounts.find((c) => c.role === "EXPERT")?._count || 0;
    const verifiedExperts = expertCounts.find((c) => c.status === "VERIFIED")?._count || 0;
    const completedConsultations = bookingCounts.find((c) => c.status === "COMPLETED")?._count || 0;
    const totalPracticeAreas = Number(practiceAreaCount[0]?.count || 0);

    return {
      verifiedExperts,
      completedConsultations,
      totalClients,
      totalPracticeAreas,
      totalLawyers: totalExperts,
    };
  },

  getPracticeAreas: async () => {
    const rows = await prisma.$queryRaw<{ specialty: string; count: bigint }[]>`
      SELECT s AS specialty, COUNT(*)::bigint AS count
      FROM experts e, UNNEST(e.specialties) AS s
      WHERE e.status = 'VERIFIED'
      GROUP BY s
      ORDER BY count DESC
    `;

    return rows.map((r) => ({
      specialty: r.specialty,
      label: SPECIALTY_LABELS[r.specialty] || r.specialty,
      expertCount: Number(r.count),
    }));
  },

  getNewest: async (limit = 6): Promise<SectionResponse<any>> => {
    const experts = await prisma.expertProfile.findMany({
      where: { status: "VERIFIED" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: BASE_SELECT,
    });

    const results = await Promise.all(
      experts.map(async (e) =>
        toExpertSummary(e, await resolveAvatarUrl(e.profileImageObjectKey))
      )
    );
    return wrapSection(results, "real_metrics");
  },

  /** Recommended: Bayesian-weighted blend of rating, reviews, and verification. */
  getRecommended: async (limit = 8): Promise<SectionResponse<any>> => {
    const C = 3; // Bayesian constant (minimum reviews for full weight)
    const m = 3.5; // prior mean rating (global average estimate)

    const experts = await prisma.expertProfile.findMany({
      where: { status: "VERIFIED" },
      select: {
        ...BASE_SELECT,
        _count: { select: { bookings: { where: { status: "COMPLETED" } } } },
      },
    });

    const scored = experts.map((e) => {
      const avg = e.averageRating ? Number(e.averageRating) : 0;
      const count = e.reviewCount ?? 0;
      // Bayesian average: weight toward prior when review count is low
      const bayesianRating = count > 0 ? (C * m + count * avg) / (C + count) : m * 0.8;
      const bookingBonus = Math.min(((e as any)._count?.bookings ?? 0) / 20, 1) * 0.5;
      const score = bayesianRating + bookingBonus;
      return { expert: e, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, limit);

    const results = await Promise.all(
      top.map(async ({ expert: e }) =>
        toExpertSummary(e, await resolveAvatarUrl(e.profileImageObjectKey))
      )
    );
    return wrapSection(results, "real_metrics");
  },

  getMostBooked: async (limit = 6): Promise<SectionResponse<any>> => {
    // Cold-start: check if any bookings exist in last 30 days
    const recentBookingCount = await prisma.booking.count({
      where: {
        status: "COMPLETED",
        completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const expertsWithCounts = await prisma.expertProfile.findMany({
      where: { status: "VERIFIED" },
      select: {
        ...BASE_SELECT,
        _count: { select: { bookings: { where: { status: "COMPLETED" } } } },
      },
    });

    const sorted = expertsWithCounts
      .sort((a, b) => ((b as any)._count?.bookings ?? 0) - ((a as any)._count?.bookings ?? 0))
      .slice(0, limit);

    const source: SectionSource = recentBookingCount > 0 ? "real_metrics" : "curated";

    const results = await Promise.all(
      sorted.map(async (e) => ({
        ...toExpertSummary(e, await resolveAvatarUrl(e.profileImageObjectKey)),
        completedBookings: (e as any)._count?.bookings ?? 0,
      }))
    );
    return wrapSection(results, source);
  },

  getHighestRated: async (limit = 6): Promise<SectionResponse<any>> => {
    const MIN_REVIEWS = 2;
    const C = 3;
    const m = 3.5;

    const experts = await prisma.expertProfile.findMany({
      where: {
        status: "VERIFIED",
        averageRating: { not: null },
        reviewCount: { gte: MIN_REVIEWS },
      },
      select: {
        ...BASE_SELECT,
        _count: { select: { bookings: { where: { status: "COMPLETED" } } } },
      },
    });

    const scored = experts.map((e) => {
      const avg = Number(e.averageRating);
      const count = e.reviewCount;
      const bayesianRating = (C * m + count * avg) / (C + count);
      return { expert: e, score: bayesianRating };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, limit);

    const results = await Promise.all(
      top.map(async ({ expert: e }) =>
        toExpertSummary(e, await resolveAvatarUrl(e.profileImageObjectKey))
      )
    );
    return wrapSection(results, "real_metrics");
  },

  /**
   * Available Today: experts with an availability slot for today's day-of-week
   * and who are not marked as BUSY/ON_LEAVE in their latest presence status.
   */
  getAvailableToday: async (limit = 6): Promise<SectionResponse<any>> => {
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const dayOfWeek = days[new Date().getDay()] as any;

    const experts = await prisma.expertProfile.findMany({
      where: {
        status: "VERIFIED",
        availability: {
          some: {
            dayOfWeek,
            isAvailable: true,
            presenceStatus: { not: "ON_LEAVE" },
          },
        },
      },
      take: limit,
      select: BASE_SELECT,
    });

    const results = await Promise.all(
      experts.map(async (e) =>
        toExpertSummary(e, await resolveAvatarUrl(e.profileImageObjectKey))
      )
    );
    return wrapSection(results, "real_metrics");
  },

  /**
   * Legal Services: active services grouped by category
   */
  getLegalServices: async (limit = 8): Promise<SectionResponse<any>> => {
    const services = await prisma.legalService.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        deliveryMode: true,
        durationMin: true,
        flatFee: true,
        currency: true,
        expert: {
          select: {
            id: true,
            displayName: true,
            primarySpecialty: true,
            averageRating: true,
            city: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const results = services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.category ?? "other",
      deliveryMode: s.deliveryMode,
      durationMin: s.durationMin,
      flatFee: s.flatFee ? Number(s.flatFee) : null,
      currency: s.currency || "RWF",
      expertId: s.expert.id,
      expertName:
        s.expert.displayName ||
        `${s.expert.user.firstName} ${s.expert.user.lastName}`,
      expertSpecialty: s.expert.primarySpecialty,
      expertRating: s.expert.averageRating
        ? Number(s.expert.averageRating)
        : null,
      expertCity: s.expert.city,
    }));
    return wrapSection(results, "real_metrics");
  },

  getFeaturedReviews: async (limit = 6): Promise<SectionResponse<any>> => {
    const reviews = await prisma.review.findMany({
      where: {
        status: "PUBLISHED",
        isDeleted: false,
        comment: { not: null },
      },
      orderBy: [{ rating: "desc" }, { helpfulCount: "desc" }],
      take: limit,
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        createdAt: true,
        citizen: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        expert: {
          select: {
            id: true,
            displayName: true,
            primarySpecialty: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        booking: {
          select: {
            service: { select: { name: true } },
          },
        },
      },
    });

    const results = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      createdAt: r.createdAt,
      clientName: `${r.citizen.firstName} ${r.citizen.lastName}`,
      expertId: r.expert.id,
      expertName:
        r.expert.displayName ||
        `${r.expert.user.firstName} ${r.expert.user.lastName}`,
      expertSpecialty: r.expert.primarySpecialty,
      serviceName: r.booking?.service?.name || null,
    }));
    return wrapSection(results, "real_metrics");
  },

  /**
   * Popular Searches: aggregate specialties from completed bookings + active services
   * over the last 30 days. Falls back to all verified expert specialties if no bookings.
   */
  getPopularSearches: async (limit = 6): Promise<SectionResponse<{ specialty: string; label: string; count: number }>> => {
    // Try to derive from recent booking service categories
    const recentBookings = await prisma.booking.findMany({
      where: {
        status: "COMPLETED",
        completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      include: {
        service: { select: { category: true } },
        expert: { select: { primarySpecialty: true } },
      },
    });

    if (recentBookings.length > 0) {
      // Aggregate from booking service categories
      const categoryCounts = new Map<string, number>();
      for (const booking of recentBookings) {
        const cat = booking.service?.category || booking.expert?.primarySpecialty;
        if (cat) {
          categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
        }
      }

      const sorted = [...categoryCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([specialty, count]) => ({
          specialty,
          label: SPECIALTY_LABELS[specialty] || specialty,
          count,
        }));

      return wrapSection(sorted, "real_metrics");
    }

    // Cold-start: fall back to verified expert specialty counts
    const rows = await prisma.$queryRaw<{ specialty: string; count: bigint }[]>`
      SELECT s AS specialty, COUNT(*)::bigint AS count
      FROM experts e, UNNEST(e.specialties) AS s
      WHERE e.status = 'VERIFIED'
      GROUP BY s
      ORDER BY count DESC
      LIMIT ${limit}
    `;

    const results = rows.map((r) => ({
      specialty: r.specialty,
      label: SPECIALTY_LABELS[r.specialty] || r.specialty,
      count: Number(r.count),
    }));
    return wrapSection(results, results.length > 0 ? "curated" : "disabled");
  },
};
