/**
 * Analytics Service
 * 
 * Main orchestration service - aggregates all analytics
 */

import { PlatformOverviewService } from "./platform-overview.service.js";
import { BookingAnalyticsService } from "./booking-analytics.service.js";
import { RevenueAnalyticsService } from "./revenue-analytics.service.js";
import { UserAnalyticsService } from "./user-analytics.service.js";
import { ExpertAnalyticsService } from "./expert-analytics.service.js";
import { ClientAnalyticsService } from "./client-analytics.service.js";
import { ReviewAnalyticsService } from "./review-analytics.service.js";
import { CommunicationAnalyticsService } from "./communication-analytics.service.js";
import { ComplianceAnalyticsService } from "./compliance-analytics.service.js";
import { EscrowAnalyticsService } from "./escrow-analytics.service.js";
import { PredictiveAnalyticsService } from "./predictive-analytics.service.js";
import { RealtimeDashboardService } from "./realtime-dashboard.service.js";
import { SystemHealthService } from "./system-health.service.js";
import { AnalyticsCache } from "../cache/analytics.cache.js";
import { parseDateRange } from "../utils/date-filter.utils.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import type {
  PlatformSummaryResponse,
  BookingAnalyticsResponse,
  RevenueAnalyticsResponse,
  UserAnalyticsResponse,
  ExpertAnalyticsResponse,
  ClientAnalyticsResponse,
  ReviewAnalyticsResponse,
  CommunicationAnalyticsResponse,
  ComplianceAnalyticsResponse,
  EscrowAnalyticsResponse,
  SystemHealthResponse,
  DateRangeQuery,
} from "../types/analytics.types.js";
import type { 
  PredictiveAnalyticsResponse, 
  ForecastParams 
} from "../types/predictive.types.js";
import type { 
  RealtimeDashboardResponse,
  DashboardFilter 
} from "../types/realtime.types.js";

export const AnalyticsService = {
  /**
   * Platform Summary - High-level overview
   */
  async getPlatformSummary(): Promise<PlatformSummaryResponse> {
    const cacheKey = "analytics:summary";
    const cached = await AnalyticsCache.get<PlatformSummaryResponse>(cacheKey);
    if (cached) return cached;

    const [platform, bookings, revenue, activity] = await Promise.all([
      PlatformOverviewService.getPlatformSummary(),
      PlatformOverviewService.getBookingSummary(),
      PlatformOverviewService.getRevenueSummary(),
      PlatformOverviewService.getActivitySummary(),
    ]);

    const result: PlatformSummaryResponse = {
      success: true,
      data: {
        platform,
        bookings,
        revenue,
        activity,
      },
    };

    await AnalyticsCache.set(cacheKey, result, 300); // 5 min
    return result;
  },

  /**
   * Booking Analytics
   */
  async getBookingAnalytics(query: DateRangeQuery): Promise<BookingAnalyticsResponse> {
    const dateRange = parseDateRange(query) || {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    };
    const cacheKey = AnalyticsCache.generateKey("bookings", dateRange);
    const cached = await AnalyticsCache.get<BookingAnalyticsResponse>(cacheKey);
    if (cached) return cached;

    const data = await BookingAnalyticsService.getBookingAnalytics(dateRange);

    const result: BookingAnalyticsResponse = {
      success: true,
      data,
    };

    await AnalyticsCache.set(cacheKey, result, 300); // 5 min
    return result;
  },

  /**
   * Revenue Analytics
   */
  async getRevenueAnalytics(query: DateRangeQuery): Promise<RevenueAnalyticsResponse> {
    const dateRange = parseDateRange(query) || {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    };
    const cacheKey = AnalyticsCache.generateKey("revenue", dateRange);
    const cached = await AnalyticsCache.get<RevenueAnalyticsResponse>(cacheKey);
    if (cached) return cached;

    const data = await RevenueAnalyticsService.getRevenueAnalytics(dateRange);

    const result: RevenueAnalyticsResponse = {
      success: true,
      data,
    };

    await AnalyticsCache.set(cacheKey, result, 300); // 5 min
    return result;
  },

  /**
   * User Analytics
   */
  async getUserAnalytics(query: DateRangeQuery): Promise<UserAnalyticsResponse> {
    const dateRange = parseDateRange(query);
    const cacheKey = AnalyticsCache.generateKey("users", dateRange);
    const cached = await AnalyticsCache.get<UserAnalyticsResponse>(cacheKey);
    if (cached) return cached;

    const data = await UserAnalyticsService.getUserAnalytics(dateRange);

    const result: UserAnalyticsResponse = {
      success: true,
      data,
    };

    await AnalyticsCache.set(cacheKey, result, 600); // 10 min
    return result;
  },

  /**
   * Expert Analytics
   */
  async getExpertAnalytics(): Promise<ExpertAnalyticsResponse> {
    const cacheKey = "analytics:experts";
    const cached = await AnalyticsCache.get<ExpertAnalyticsResponse>(cacheKey);
    if (cached) return cached;

    const data = await ExpertAnalyticsService.getExpertAnalytics();

    const result: ExpertAnalyticsResponse = {
      success: true,
      data,
    };

    await AnalyticsCache.set(cacheKey, result, 600); // 10 min
    return result;
  },

  /**
   * Client Analytics
   */
  async getClientAnalytics(query: DateRangeQuery): Promise<ClientAnalyticsResponse> {
    const dateRange = parseDateRange(query);
    const cacheKey = AnalyticsCache.generateKey("clients", dateRange);
    const cached = await AnalyticsCache.get<ClientAnalyticsResponse>(cacheKey);
    if (cached) return cached;

    const data = await ClientAnalyticsService.getClientAnalytics(dateRange);

    const result: ClientAnalyticsResponse = {
      success: true,
      data,
    };

    await AnalyticsCache.set(cacheKey, result, 600); // 10 min
    return result;
  },

  /**
   * Review Analytics
   */
  async getReviewAnalytics(query: DateRangeQuery): Promise<ReviewAnalyticsResponse> {
    const dateRange = parseDateRange(query);
    const cacheKey = AnalyticsCache.generateKey("reviews", dateRange);
    const cached = await AnalyticsCache.get<ReviewAnalyticsResponse>(cacheKey);
    if (cached) return cached;

    const data = await ReviewAnalyticsService.getReviewAnalytics(dateRange);

    const result: ReviewAnalyticsResponse = {
      success: true,
      data,
    };

    await AnalyticsCache.set(cacheKey, result, 600); // 10 min
    return result;
  },

  /**
   * Communication Analytics
   */
  async getCommunicationAnalytics(query: DateRangeQuery): Promise<CommunicationAnalyticsResponse> {
    const dateRange = parseDateRange(query);
    const cacheKey = AnalyticsCache.generateKey("communications", dateRange);
    const cached = await AnalyticsCache.get<CommunicationAnalyticsResponse>(cacheKey);
    if (cached) return cached;

    const data = await CommunicationAnalyticsService.getCommunicationAnalytics(dateRange);

    const result: CommunicationAnalyticsResponse = {
      success: true,
      data,
    };

    await AnalyticsCache.set(cacheKey, result, 300); // 5 min
    return result;
  },

  /**
   * Compliance Analytics
   */
  async getComplianceAnalytics(): Promise<ComplianceAnalyticsResponse> {
    const cacheKey = "analytics:compliance";
    const cached = await AnalyticsCache.get<ComplianceAnalyticsResponse>(cacheKey);
    if (cached) return cached;

    const data = await ComplianceAnalyticsService.getComplianceAnalytics();

    const result: ComplianceAnalyticsResponse = {
      success: true,
      data,
    };

    await AnalyticsCache.set(cacheKey, result, 900); // 15 min
    return result;
  },

  /**
   * Geographic Distribution - experts by city
   */
  async getGeographicDistribution() {
    const experts = await prisma.expertProfile.groupBy({
      by: ["city"],
      _count: { id: true },
      where: { city: { not: null } },
      orderBy: { _count: { id: "desc" } },
    });

    const totalExperts = experts.reduce((sum, e) => sum + e._count.id, 0);

    const cities = experts.map((e) => ({
      city: e.city || "Unknown",
      experts: e._count.id,
      percentage: totalExperts > 0 ? Math.round((e._count.id / totalExperts) * 100) : 0,
    }));

    return {
      cities,
      totals: {
        totalExperts,
        totalRegions: cities.length,
      },
    };
  },

  /**
   * Escrow Analytics
   */
  async getEscrowAnalytics(): Promise<EscrowAnalyticsResponse> {
    const cacheKey = "analytics:escrow";
    const cached = await AnalyticsCache.get<EscrowAnalyticsResponse>(cacheKey);
    if (cached) return cached;

    const data = await EscrowAnalyticsService.getEscrowAnalytics();

    const result: EscrowAnalyticsResponse = {
      success: true,
      data,
    };

    await AnalyticsCache.set(cacheKey, result, 300); // 5 min
    return result;
  },

  /**
   * Real-time Operational Dashboard
   */
  async getRealtimeDashboard(filter: DashboardFilter = {}): Promise<RealtimeDashboardResponse> {
    // Real-time data should have minimal caching (5 seconds)
    const cacheKey = `analytics:realtime:${JSON.stringify(filter)}`;
    const cached = await AnalyticsCache.get<RealtimeDashboardResponse>(cacheKey);
    if (cached) return cached;

    const data = await RealtimeDashboardService.getDashboard(filter);

    const result: RealtimeDashboardResponse = {
      success: true,
      data,
    };

    await AnalyticsCache.set(cacheKey, result, 5); // 5 second cache for real-time data
    return result;
  },

  /**
   * Predictive Analytics
   */
  async getPredictiveAnalytics(params: ForecastParams = {}): Promise<PredictiveAnalyticsResponse> {
    const cacheKey = `analytics:predictive:${JSON.stringify(params)}`;
    const cached = await AnalyticsCache.get<PredictiveAnalyticsResponse>(cacheKey);
    if (cached) return cached;

    const data = await PredictiveAnalyticsService.getPredictiveAnalytics(params);

    const result: PredictiveAnalyticsResponse = {
      success: true,
      data,
    };

    await AnalyticsCache.set(cacheKey, result, 1800); // 30 min cache for predictive analytics
    return result;
  },

  /**
   * System Health
   */
  async getSystemHealth(): Promise<SystemHealthResponse> {
    const cacheKey = "analytics:system";
    const cached = await AnalyticsCache.get<SystemHealthResponse>(cacheKey);
    if (cached) return cached;

    const data = await SystemHealthService.getSystemHealth();

    const result: SystemHealthResponse = {
      success: true,
      data,
    };

    await AnalyticsCache.set(cacheKey, result, 120); // 2 min
    return result;
  },
};
