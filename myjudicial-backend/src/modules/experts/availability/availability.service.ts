import { getErrorMessage } from "../../../shared/utils/i18n-messages.js";
import { AvailabilityRepository } from "./availability.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { NotFoundError, ValidationError } from "../../../shared/errors/index.js";
import type { 
  UpsertAvailabilityDto, 
  UpsertAvailabilityWithBlocksDto, 
  UpdatePresenceDto 
} from "./availability.schemas.js";
import type { DayOfWeek, PresenceStatus } from "../../../generated/prisma/client.js";
import { convertLegacyToTimeBlocks } from "./time-blocks.types.js";


export const AvailabilityService = {
  getAvailability: async (userId: string) => {
    const profile = await ProfileRepository.findByUserId(userId);
    // Return empty schedule for users who haven't created their expert profile yet.
    // An empty array is semantically correct — no schedule configured.
    if (!profile) return [];
    return AvailabilityRepository.findByExpertId(profile.id);
  },

  /**
   * Legacy upsert (Phase 1-3 compatibility)
   * Still used by old API clients
   */
  upsertAvailability: async (userId: string, dto: UpsertAvailabilityDto) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));

    const results: unknown[] = [];

    if (dto.schedule?.length) {
      const slots = dto.schedule.map((s) => ({
        dayOfWeek: s.dayOfWeek as DayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isAvailable: s.isAvailable,
      }));
      const updated = await AvailabilityRepository.upsertSchedule(profile.id, slots);
      results.push(...updated);
    }

    if (dto.presenceStatus) {
      if (dto.presenceStatus === "ONLINE" && profile.status !== "VERIFIED") {
        throw new ValidationError("Verification required: only verified experts can go online.");
      }
      await AvailabilityRepository.updatePresence(
        profile.id,
        dto.presenceStatus as PresenceStatus
      );
    }

    return AvailabilityRepository.findByExpertId(profile.id);
  },

  /**
   * Phase 4: Upsert with time blocks support
   * New API clients should use this method
   */
  upsertAvailabilityWithBlocks: async (userId: string, dto: UpsertAvailabilityWithBlocksDto) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));

    if (dto.schedule?.length) {
      const slots = dto.schedule.map((s) => ({
        dayOfWeek: s.dayOfWeek as DayOfWeek,
        isAvailable: s.isAvailable,
        timeBlocks: s.timeBlocks || (s.startTime && s.endTime 
          ? convertLegacyToTimeBlocks(s.startTime, s.endTime) 
          : undefined),
        startTime: s.startTime,
        endTime: s.endTime,
      }));
      
      await AvailabilityRepository.upsertScheduleWithBlocks(profile.id, slots);
    }

    if (dto.presenceStatus) {
      if (dto.presenceStatus === "ONLINE" && profile.status !== "VERIFIED") {
        throw new ValidationError("Verification required: only verified experts can go online.");
      }
      await AvailabilityRepository.updatePresence(
        profile.id,
        dto.presenceStatus as PresenceStatus
      );
    }

    return AvailabilityRepository.findByExpertId(profile.id);
  },

  updatePresence: async (userId: string, dto: UpdatePresenceDto) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    if (dto.presenceStatus === "ONLINE" && profile.status !== "VERIFIED") {
      throw new ValidationError("Verification required: only verified experts can go online.");
    }
    await AvailabilityRepository.updatePresence(profile.id, dto.presenceStatus as PresenceStatus);
    return { presenceStatus: dto.presenceStatus };
  },
};
