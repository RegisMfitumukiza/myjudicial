/**
 * User Analytics Service
 * 
 * User metrics and statistics
 */

import { AnalyticsRepository } from "../repositories/analytics.repository.js";
import type { DateRange, UserAnalytics } from "../types/analytics.types.js";

export const UserAnalyticsService = {
  async getUserAnalytics(dateRange?: DateRange): Promise<UserAnalytics> {
    const { totalUsers, usersByRole, usersByStatus, newUsers } = 
      await AnalyticsRepository.getUserStats(dateRange);

    // Process role distribution
    const clients = usersByRole.find((r) => r.role === "CITIZEN")?._count || 0;
    const experts = usersByRole.find((r) => r.role === "EXPERT")?._count || 0;
    const admins = usersByRole.find((r) => r.role === "ADMIN")?._count || 0;

    // Process status distribution
    const active = usersByStatus.find((s) => s.status === "ACTIVE")?._count || 0;
    const pending = usersByStatus.find((s) => s.status === "PENDING")?._count || 0;
    const suspended = usersByStatus.find((s) => s.status === "SUSPENDED")?._count || 0;

    // Get time series data if date range provided
    let timeSeries: Array<{ date: string; count: number }> = [];
    if (dateRange) {
      const users = await AnalyticsRepository.getUserTimeSeries(dateRange);
      timeSeries = this.groupByDate(users.map((u) => u.createdAt));
    }

    return {
      totals: {
        totalUsers,
        totalClients: clients,
        totalExperts: experts,
        totalAdmins: admins,
        newUsers: dateRange ? newUsers : 0,
      },
      byRole: {
        CITIZEN: clients,
        EXPERT: experts,
        ADMIN: admins,
      },
      byStatus: {
        ACTIVE: active,
        PENDING: pending,
        SUSPENDED: suspended,
      },
      timeSeries,
    };
  },

  /**
   * Group dates into daily counts
   */
  groupByDate(dates: Date[]): Array<{ date: string; count: number }> {
    const grouped = new Map<string, number>();

    dates.forEach((date) => {
      const dateStr = date.toISOString().split("T")[0];
      grouped.set(dateStr, (grouped.get(dateStr) || 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
};
