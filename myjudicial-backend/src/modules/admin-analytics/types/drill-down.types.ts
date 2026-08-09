/**
 * Drill-Down Types
 * 
 * Type definitions for drill-down functionality
 */

import type { BookingStatus } from "../../../generated/prisma/client.js";

export type { BookingStatus };

export interface DrillDownFilters {
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
  citizenId?: string;
  expertId?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BookingDrillDownRecord {
  id: string;
  citizenId: string;
  citizenName: string;
  expertId: string;
  expertName: string;
  serviceId: string;
  serviceName: string;
  status: BookingStatus;
  scheduledStart: Date;
  scheduledEnd: Date;
  totalAmount: number;
  platformFee: number;
  expertPayout: number;
  actualDurationMin: number | null;
  createdAt: Date;
}

export interface BookingDrillDownResult {
  metric: string;
  filters: {
    status?: BookingStatus;
    dateRange?: {
      start: string;
      end: string;
    };
  };
  records: BookingDrillDownRecord[];
  pagination: PaginationResult;
}
