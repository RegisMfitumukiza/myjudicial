import { getErrorMessage } from "../../../shared/utils/i18n-messages.js";
import { OverridesRepository } from "./overrides.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { NotFoundError, ValidationError, ConflictError } from "../../../shared/errors/index.js";
import type { CreateOverrideDto, UpdateOverrideDto, BulkCreateOverridesDto } from "./overrides.schemas.js";


export const OverridesService = {
  /**
   * List overrides for expert (optionally filtered by month or date range)
   */
  listOverrides: async (
    userId: string,
    filters?: { month?: string; fromDate?: string; toDate?: string }
  ) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (filters?.month) {
      // Parse YYYY-MM format
      const [year, month] = filters.month.split("-").map(Number);
      fromDate = new Date(year, month - 1, 1);
      toDate = new Date(year, month, 0); // Last day of month
    } else if (filters?.fromDate || filters?.toDate) {
      fromDate = filters.fromDate ? new Date(filters.fromDate) : undefined;
      toDate = filters.toDate ? new Date(filters.toDate) : undefined;
    }

    return OverridesRepository.findByExpertId(profile.id, fromDate, toDate);
  },

  /**
   * Get specific override by ID
   */
  getOverride: async (userId: string, overrideId: string) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    const override = await OverridesRepository.findById(overrideId);

    if (!override) {
      throw new NotFoundError("Override not found");
    }

    if (override.expertId !== profile.id) {
      throw new NotFoundError("Override not found");
    }

    return override;
  },

  /**
   * Create new override
   */
  createOverride: async (userId: string, dto: CreateOverrideDto) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    // Validate date is in the future
    const overrideDate = new Date(dto.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (overrideDate < today) {
      throw new ValidationError("Cannot create override for past dates");
    }

    // Check if override already exists for this date
    const existing = await OverridesRepository.findByDate(profile.id, overrideDate);
    if (existing) {
      throw new ConflictError(`Override already exists for ${dto.date}`);
    }

    // Check if there are existing bookings on this date (warn only, don't block)
    const hasBookings = await OverridesRepository.hasBookingsOnDate(profile.id, overrideDate);
    
    // Create the override
    const override = await OverridesRepository.create(profile.id, dto);

    return {
      override,
      warning: hasBookings
        ? "Note: There are existing bookings on this date. They will remain confirmed but no new bookings will be allowed."
        : undefined,
    };
  },

  /**
   * Update existing override
   */
  updateOverride: async (userId: string, overrideId: string, dto: UpdateOverrideDto) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    // Strip null values — repository expects undefined, not null
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== null) clean[key] = value;
    }

    return OverridesRepository.update(overrideId, clean as Partial<CreateOverrideDto>);
  },

  /**
   * Delete override
   */
  deleteOverride: async (userId: string, overrideId: string) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    const override = await OverridesRepository.findById(overrideId);
    if (!override || override.expertId !== profile.id) {
      throw new NotFoundError("Override not found");
    }

    return OverridesRepository.delete(overrideId);
  },

  /**
   * Bulk create overrides (vacation mode)
   */
  bulkCreateOverrides: async (userId: string, dto: BulkCreateOverridesDto) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    const fromDate = new Date(dto.fromDate);
    const toDate = new Date(dto.toDate);

    // Validate dates are in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (fromDate < today) {
      throw new ValidationError("Cannot create overrides for past dates");
    }

    // Generate array of dates
    const dates: Date[] = [];
    const currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Check if any dates have existing bookings
    const datesWithBookings: string[] = [];
    for (const date of dates) {
      const hasBookings = await OverridesRepository.hasBookingsOnDate(profile.id, date);
      if (hasBookings) {
        datesWithBookings.push(date.toISOString().split("T")[0]);
      }
    }

    // Create overrides
    const result = await OverridesRepository.bulkCreate(
      profile.id,
      dates,
      dto.overrideType,
      dto.reason
    );

    return {
      count: result.count,
      warning:
        datesWithBookings.length > 0
          ? `Existing bookings found on: ${datesWithBookings.join(", ")}. They will remain confirmed.`
          : undefined,
    };
  },

  /**
   * Delete overrides in date range
   */
  deleteRange: async (userId: string, fromDate: string, toDate: string) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    return OverridesRepository.deleteRange(profile.id, from, to);
  },
};
