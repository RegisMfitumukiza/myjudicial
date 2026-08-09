/**
 * Availability Overrides API
 * Phase 3 - Date-specific availability management
 */

import { apiFetchEnvelope } from '@/lib/api/client';

export type OverrideType = 'CLOSED' | 'CUSTOM_HOURS' | 'REDUCED_CAPACITY';

export interface AvailabilityOverride {
  id: string;
  expertId: string;
  date: string; // YYYY-MM-DD
  overrideType: OverrideType;
  startTime: string | null; // HH:MM
  endTime: string | null; // HH:MM
  maxBookings: number | null;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOverrideDto {
  date: string; // YYYY-MM-DD
  overrideType: OverrideType;
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  maxBookings?: number;
  reason?: string;
}

export interface UpdateOverrideDto {
  overrideType?: OverrideType;
  startTime?: string | null;
  endTime?: string | null;
  maxBookings?: number | null;
  reason?: string | null;
}

export interface BulkCreateOverridesDto {
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  overrideType: OverrideType;
  reason?: string;
}

export interface OverridesResponse {
  success: boolean;
  message: string;
  data: AvailabilityOverride[];
}

export interface OverrideResponse {
  success: boolean;
  message: string;
  data: {
    override: AvailabilityOverride;
    warning?: string;
  };
}

export interface BulkCreateResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    warning?: string;
  };
}

/**
 * List overrides (optionally filtered by month or date range)
 */
export const getOverrides = async (params?: {
  month?: string; // YYYY-MM
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
}): Promise<{ data: OverridesResponse; status: number; headers: Headers }> => {
  const query = new URLSearchParams();
  if (params?.month) query.append('month', params.month);
  if (params?.fromDate) query.append('fromDate', params.fromDate);
  if (params?.toDate) query.append('toDate', params.toDate);

  const queryString = query.toString();
  const url = `/experts/availability/overrides${queryString ? `?${queryString}` : ''}`;

  return apiFetchEnvelope<{ data: OverridesResponse; status: number; headers: Headers }>(
    url,
    { method: 'GET' }
  );
};

/**
 * Create new override
 */
export const createOverride = async (
  data: CreateOverrideDto
): Promise<{ data: OverrideResponse; status: number; headers: Headers }> => {
  return apiFetchEnvelope<{ data: OverrideResponse; status: number; headers: Headers }>(
    '/experts/availability/overrides',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );
};

/**
 * Update existing override
 */
export const updateOverride = async (
  id: string,
  data: UpdateOverrideDto
): Promise<{ data: { success: boolean; message: string; data: AvailabilityOverride }; status: number; headers: Headers }> => {
  return apiFetchEnvelope<{ data: { success: boolean; message: string; data: AvailabilityOverride }; status: number; headers: Headers }>(
    `/experts/availability/overrides/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );
};

/**
 * Delete override
 */
export const deleteOverride = async (
  id: string
): Promise<{ data: { success: boolean; message: string }; status: number; headers: Headers }> => {
  return apiFetchEnvelope<{ data: { success: boolean; message: string }; status: number; headers: Headers }>(
    `/experts/availability/overrides/${id}`,
    { method: 'DELETE' }
  );
};

/**
 * Bulk create overrides (vacation mode)
 */
export const bulkCreateOverrides = async (
  data: BulkCreateOverridesDto
): Promise<{ data: BulkCreateResponse; status: number; headers: Headers }> => {
  return apiFetchEnvelope<{ data: BulkCreateResponse; status: number; headers: Headers }>(
    '/experts/availability/overrides/bulk',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );
};

/**
 * Delete overrides in date range
 */
export const deleteOverrideRange = async (
  fromDate: string,
  toDate: string
): Promise<{ data: { success: boolean; message: string }; status: number; headers: Headers }> => {
  return apiFetchEnvelope<{ data: { success: boolean; message: string }; status: number; headers: Headers }>(
    `/experts/availability/overrides/range?fromDate=${fromDate}&toDate=${toDate}`,
    { method: 'DELETE' }
  );
};
