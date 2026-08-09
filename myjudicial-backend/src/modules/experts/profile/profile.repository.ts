import { prisma } from "../../../infrastructure/database/prisma.js";
import type { CreateProfileDto, UpdateProfileDto } from "./profile.schemas.js";
import type { LegalSpecialty } from "../../../generated/prisma/client.js";

const profileSelect = {
  id: true,
  userId: true,
  displayName: true,
  bio: true,
  firmName: true,
  profileImageObjectKey: true,
  barNumber: true,
  yearsExperience: true,
  status: true,
  primarySpecialty: true,
  specialties: true,
  languages: true,
  officeAddress: true,
  city: true,
  country: true,
  latitude: true,
  longitude: true,
  baseConsultationFee: true,
  currency: true,
  credentialsExpiry: true,
  averageRating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
  education: {
    select: {
      id: true,
      institution: true,
      degree: true,
      fieldOfStudy: true,
      yearCompleted: true,
    },
    orderBy: { yearCompleted: "desc" as const },
  },
  certifications: {
    select: {
      id: true,
      certificateName: true,
      issuer: true,
      issueDate: true,
      expiryDate: true,
    },
    orderBy: { issueDate: "desc" as const },
  },
  user: {
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatarObjectKey: true,
    },
  },
} as const;

export const ProfileRepository = {
  findByUserId: async (userId: string) => {
    return prisma.expertProfile.findUnique({
      where: { userId },
      select: profileSelect,
    });
  },

  findById: async (id: string) => {
    return prisma.expertProfile.findUnique({
      where: { id },
      select: profileSelect,
    });
  },

  existsByUserId: async (userId: string): Promise<boolean> => {
    const count = await prisma.expertProfile.count({ where: { userId } });
    return count > 0;
  },

  create: async (userId: string, dto: CreateProfileDto) => {
    return prisma.$transaction(async (tx) => {
      const profile = await tx.expertProfile.create({
        data: {
          userId,
          displayName: dto.displayName,
          bio: dto.bio,
          firmName: dto.firmName,
          barNumber: dto.barNumber,
          yearsExperience: dto.yearsExperience,
          primarySpecialty: dto.primarySpecialty as LegalSpecialty,
          specialties: dto.specialties as LegalSpecialty[],
          languages: dto.languages,
          officeAddress: dto.officeAddress,
          city: dto.city,
          country: dto.country,
          latitude: dto.latitude,
          longitude: dto.longitude,
          baseConsultationFee: dto.baseConsultationFee,
          currency: dto.currency,
          status: "DRAFT",
        },
        select: profileSelect,
      });

      // Always create a map marker so the expert becomes searchable once verified —
      // the onboarding wizard doesn't currently collect coordinates, so default to
      // Kigali city center (same default GET /experts already uses for search origin)
      // rather than silently skipping marker creation.
      const markerLat = dto.latitude ?? -1.9441;
      const markerLng = dto.longitude ?? 30.0619;
      await tx.$executeRaw`
        INSERT INTO map_markers (id, "expertId", latitude, longitude, location, "isVisible", "updatedAt")
        VALUES (
          gen_random_uuid(),
          ${profile.id},
          ${markerLat},
          ${markerLng},
          ST_SetSRID(ST_MakePoint(${markerLng}, ${markerLat}), 4326),
          false,
          NOW()
        )
      `;

      return profile;
    }, {
      timeout: 15000, // 15 seconds timeout for profile creation with map marker
    });
  },

  update: async (expertId: string, dto: UpdateProfileDto) => {
    return prisma.$transaction(async (tx) => {
      const profile = await tx.expertProfile.update({
        where: { id: expertId },
        data: {
          ...(dto.displayName && { displayName: dto.displayName }),
          ...(dto.bio !== undefined && { bio: dto.bio }),
          ...(dto.firmName !== undefined && { firmName: dto.firmName }),
          ...(dto.barNumber && { barNumber: dto.barNumber }),
          ...(dto.yearsExperience !== undefined && { yearsExperience: dto.yearsExperience }),
          ...(dto.primarySpecialty && { primarySpecialty: dto.primarySpecialty as LegalSpecialty }),
          ...(dto.specialties && { specialties: dto.specialties as LegalSpecialty[] }),
          ...(dto.languages && { languages: dto.languages }),
          ...(dto.officeAddress !== undefined && { officeAddress: dto.officeAddress }),
          ...(dto.city !== undefined && { city: dto.city }),
          ...(dto.country && { country: dto.country }),
          ...(dto.latitude !== undefined && { latitude: dto.latitude }),
          ...(dto.longitude !== undefined && { longitude: dto.longitude }),
          ...(dto.baseConsultationFee !== undefined && { baseConsultationFee: dto.baseConsultationFee }),
          ...(dto.currency && { currency: dto.currency }),
        },
        select: profileSelect,
      });

      if (dto.latitude !== undefined || dto.longitude !== undefined) {
        const lat = dto.latitude ?? profile.latitude;
        const lng = dto.longitude ?? profile.longitude;

        if (lat !== null && lng !== null) {
          await tx.$executeRaw`
            INSERT INTO map_markers (id, "expertId", latitude, longitude, location, "isVisible", "updatedAt")
            VALUES (
              gen_random_uuid(),
              ${expertId},
              ${lat},
              ${lng},
              ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
              ${profile.status === "VERIFIED"},
              NOW()
            )
            ON CONFLICT ("expertId") DO UPDATE SET
              latitude = ${lat},
              longitude = ${lng},
              location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
              "updatedAt" = NOW()
          `;
        }
      }

      return profile;
    }, {
      timeout: 15000, // 15 seconds timeout for profile update with map marker
    });
  },
};
