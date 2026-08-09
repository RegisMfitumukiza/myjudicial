import { getErrorMessage } from "../../../shared/utils/i18n-messages.js";
import { ScheduleSettingsRepository } from "./schedule-settings.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { NotFoundError, ValidationError } from "../../../shared/errors/index.js";
import type { UpdateScheduleSettingsDto } from "./schedule-settings.schemas.js";
import { validateTimezone } from "./schedule-settings.schemas.js";


export const ScheduleSettingsService = {
  /**
   * Get expert's schedule settings (creates default if not exists)
   */
  getSettings: async (userId: string) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    return ScheduleSettingsRepository.findOrCreateDefault(profile.id);
  },

  /**
   * Update expert's schedule settings
   */
  updateSettings: async (userId: string, dto: UpdateScheduleSettingsDto) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    // Validate timezone if provided
    if (dto.timezone && !validateTimezone(dto.timezone)) {
      throw new ValidationError(
        `Invalid timezone: ${dto.timezone}. Please provide a valid IANA timezone identifier.`
      );
    }

    // Validate buffer time is reasonable
    if (dto.bufferTimeMinutes !== undefined && dto.bufferTimeMinutes < 0) {
      throw new ValidationError("Buffer time cannot be negative");
    }

    // Validate advance notice
    if (dto.advanceNoticeHours !== undefined && dto.advanceNoticeHours < 0) {
      throw new ValidationError("Advance notice cannot be negative");
    }

    // Validate booking window
    if (dto.maxDaysInAdvance !== undefined && dto.maxDaysInAdvance < 1) {
      throw new ValidationError("Maximum days in advance must be at least 1");
    }

    // Validate daily limit
    if (dto.maxBookingsPerDay !== undefined && dto.maxBookingsPerDay !== null && dto.maxBookingsPerDay < 1) {
      throw new ValidationError("Maximum bookings per day must be at least 1");
    }

    return ScheduleSettingsRepository.update(profile.id, dto);
  },
};
