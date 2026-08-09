/**
 * Schedule Settings API
 * Manually created until Orval regenerates
 */

import { apiFetchEnvelope } from '@/lib/api/client';

export interface ScheduleSettings {
  id: string;
  expertId: string;
  timezone: string;
  bufferTimeMinutes: number;
  advanceNoticeHours: number;
  maxDaysInAdvance: number;
  maxBookingsPerDay: number | null;
  respectPresenceStatus: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateScheduleSettingsDto {
  timezone?: string;
  bufferTimeMinutes?: number;
  advanceNoticeHours?: number;
  maxDaysInAdvance?: number;
  maxBookingsPerDay?: number | null;
  respectPresenceStatus?: boolean;
}

export interface ScheduleSettingsResponse {
  success: boolean;
  message: string;
  data: ScheduleSettings;
}

/**
 * Get expert's schedule settings
 */
export const getScheduleSettings = async (): Promise<{ data: ScheduleSettingsResponse; status: number; headers: Headers }> => {
  return apiFetchEnvelope<{ data: ScheduleSettingsResponse; status: number; headers: Headers }>(
    '/experts/schedule-settings',
    {
      method: 'GET',
    }
  );
};

/**
 * Update expert's schedule settings
 */
export const updateScheduleSettings = async (
  data: UpdateScheduleSettingsDto
): Promise<{ data: ScheduleSettingsResponse; status: number; headers: Headers }> => {
  return apiFetchEnvelope<{ data: ScheduleSettingsResponse; status: number; headers: Headers }>(
    '/experts/schedule-settings',
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );
};
