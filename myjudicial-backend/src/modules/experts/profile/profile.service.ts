import { getErrorMessage } from "../../../shared/utils/i18n-messages.js";
import { ProfileRepository } from "./profile.repository.js";
import { ServicesService } from "../services/services.service.js";
import { writeAuditLog } from "../../../shared/utils/audit.js";
import { ConflictError, NotFoundError, AuthorizationError } from "../../../shared/errors/index.js";
import { GeocodingService } from "../../../infrastructure/geocoding/geocoding.service.js";
import { getSignedDownloadUrl } from "../../../infrastructure/storage/oci-object-storage.service.js";
import { logger } from "../../../shared/utils/logger.js";
import type { CreateProfileDto, UpdateProfileDto } from "./profile.schemas.js";
import { triggerEmbeddingSync } from "../../ai/embedding-sync.service.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import { Prisma } from "../../../generated/prisma/client.js";


export const ProfileService = {
  /**
   * Create expert profile.
   * Only users with role EXPERT can create a profile.
   * One profile per user — returns 409 if already exists.
   */
  createProfile: async (userId: string, dto: CreateProfileDto, ipAddress?: string) => {
    const exists = await ProfileRepository.existsByUserId(userId);
    if (exists) {
      throw new ConflictError("You already have an expert profile");
    }

    // Auto-geocode if address provided but coordinates missing
    let enhancedDto = { ...dto };
    if (dto.officeAddress && (!dto.latitude || !dto.longitude)) {
      try {
        const geocodeResult = await GeocodingService.validateAddress(dto.officeAddress);
        if (geocodeResult.isValid && geocodeResult.coordinates) {
          enhancedDto = {
            ...dto,
            latitude: geocodeResult.coordinates.lat,
            longitude: geocodeResult.coordinates.lng,
            formattedAddress: geocodeResult.formattedAddress || dto.officeAddress,
            locationMethod: "autocomplete"
          };
          
          logger.info("Auto-geocoded profile address", {
            userId,
            originalAddress: dto.officeAddress,
            coordinates: geocodeResult.coordinates
          });
        }
      } catch (error) {
        logger.warn("Failed to geocode profile address", { userId, address: dto.officeAddress, error });
        // Continue without coordinates - don't fail profile creation
      }
    }

    const profile = await ProfileRepository.create(userId, enhancedDto);

    // Every expert needs at least one bookable service to appear bookable to
    // citizens. Auto-create a default "Consultation" service from the rate
    // they just set, rather than leaving them with an empty services list
    // until they separately discover the Services page.
    if (enhancedDto.baseConsultationFee) {
      await ServicesService.ensureDefaultConsultationService(
        profile.id,
        enhancedDto.baseConsultationFee,
        enhancedDto.currency
      );
    }

    await writeAuditLog({
      actorId: userId,
      action: "CREATE",
      resource: "EXPERT",
      resourceId: profile.id,
      description: "Expert profile created — pending verification",
      ipAddress,
    });

    // Clear saved onboarding draft since profile is now created
    await prisma.user.update({
      where: { id: userId },
      data: { onboarding: Prisma.DbNull },
    }).catch(err => {
      logger.warn("Failed to clear onboarding draft after profile creation", { userId, error: err });
    });

    // Tier 3 — async embedding sync (fire-and-forget, never blocks the response)
    triggerEmbeddingSync(profile.id, "profile_created");

    return profile;
  },

  /**
   * Get own expert profile.
   * Returns the full profile for the authenticated expert, or null if not created yet.
   */
  getMyProfile: async (userId: string) => {
    return ProfileRepository.findByUserId(userId);
  },


  /**
   * Get public expert profile by ID.
   * Only returns profiles that are VERIFIED (visible on map/search).
   * Enriches with signed image URLs when available.
   */
  getPublicProfile: async (expertId: string) => {
    const profile = await ProfileRepository.findById(expertId);
    if (!profile || profile.status !== "VERIFIED") {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    // Generate signed URLs for profile images
    let profileImageUrl: string | null = null;
    if (profile.profileImageObjectKey) {
      try {
        const { url } = await getSignedDownloadUrl(profile.profileImageObjectKey);
        profileImageUrl = url;
      } catch (err) {
        logger.warn("Failed to generate signed profile image URL", { expertId, error: err });
      }
    } else if (profile.user?.avatarObjectKey) {
      try {
        const { url } = await getSignedDownloadUrl(profile.user.avatarObjectKey);
        profileImageUrl = url;
      } catch (err) {
        logger.warn("Failed to generate signed avatar URL", { expertId, error: err });
      }
    }

    return { ...profile, profileImageUrl };
  },

  /**
   * Update own expert profile.
   * Expert must own the profile being updated.
   */
  updateProfile: async (
    userId: string,
    dto: UpdateProfileDto,
    ipAddress?: string
  ) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    const updated = await ProfileRepository.update(profile.id, dto);

    // Sync the default Consultation service price when base fee changes
    if (dto.baseConsultationFee !== undefined || dto.currency !== undefined) {
      const newFee = dto.baseConsultationFee ?? Number(profile.baseConsultationFee ?? 0);
      const newCurrency = dto.currency ?? profile.currency ?? "RWF";
      await ServicesService.syncDefaultServicePrice(profile.id, newFee, newCurrency);
    }

    await writeAuditLog({
      actorId: userId,
      action: "UPDATE",
      resource: "EXPERT",
      resourceId: profile.id,
      description: "Expert profile updated",
      ipAddress,
    });

    // Tier 3 — re-sync embedding when bio/specialties change (fire-and-forget)
    const embeddingRelevantFieldsChanged =
      dto.bio !== undefined ||
      dto.primarySpecialty !== undefined ||
      dto.specialties !== undefined ||
      dto.yearsExperience !== undefined ||
      dto.displayName !== undefined;

    if (embeddingRelevantFieldsChanged) {
      triggerEmbeddingSync(profile.id, "profile_updated");
    }

    return updated;
  },

  /**
   * Get status message for the expert's current lifecycle state.
   */
  getStatusMessage: (status: string): string => {
    switch (status) {
      case "PENDING_VERIFICATION":
        return "Your profile is under review. Estimated review time: 24-48 hours.";
      case "VERIFIED":
        return "Your profile is active and visible to clients.";
      case "SUSPENDED":
        return "Your credentials have expired. Please upload updated documents.";
      case "REJECTED":
        return "Your profile was rejected. Please review the feedback and resubmit.";
      case "DRAFT":
        return "Profile created in Draft. Submit your verification documents to get accredited and start accepting client bookings.";
      default:
        return "Unknown status.";
    }
  },
};
