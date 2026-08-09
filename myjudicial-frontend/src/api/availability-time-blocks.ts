/**
 * Availability Time Blocks API Client
 * Phase 4 - Multiple time blocks per day support
 */

import { apiFetchEnvelope } from "@/lib/api/client";

export interface TimeBlock {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface ScheduleSlotWithBlocks {
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  isAvailable: boolean;
  timeBlocks?: TimeBlock[];
  // Legacy fields (optional, for backward compatibility)
  startTime?: string;
  endTime?: string;
}

export interface UpsertAvailabilityWithBlocksDto {
  presenceStatus?: "ONLINE" | "OFFLINE" | "BUSY" | "ON_LEAVE";
  schedule?: ScheduleSlotWithBlocks[];
}

export interface ExpertAvailabilityWithBlocks {
  id: string;
  expertId: string;
  presenceStatus: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  timeBlocks?: TimeBlock[];
  usesTimeBlocks: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get expert availability (supports both legacy and time blocks format)
 */
export async function getExpertsAvailabilityWithBlocks() {
  return apiFetchEnvelope<{ data: ExpertAvailabilityWithBlocks[] }>(
    "/api/v1/experts/availability"
  );
}

/**
 * Update expert availability with time blocks support
 * Uses new /availability/v2 endpoint
 */
export async function patchExpertsAvailabilityWithBlocks(
  data: UpsertAvailabilityWithBlocksDto
) {
  return apiFetchEnvelope<{ data: ExpertAvailabilityWithBlocks[] }>(
    "/api/v1/experts/availability/v2",
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}
