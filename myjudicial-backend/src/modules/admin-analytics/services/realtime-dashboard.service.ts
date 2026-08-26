/**
 * Real-time Operational Dashboard Service
 *
 * Live monitoring and operational metrics
 */

import os from "os";
import { prisma } from "../../../infrastructure/database/prisma.js";
import { redis } from "../../../infrastructure/redis/redis.client.js";
import { logger } from "../../../shared/utils/logger.js";
import type {
  RealtimeDashboard,
  SystemAlert,
  LiveMetric,
  ActiveSession,
  OngoingConsultation,
  QueueMetrics,
  SystemHealth,
  ResourceUtilization,
  RealtimeStatistics,
  DashboardFilter,
} from "../types/realtime.types.js";

const REMINDER_WINDOW_HOURS = 2;

export const RealtimeDashboardService = {
  /**
   * Get complete real-time dashboard data
   */
  async getDashboard(filter: DashboardFilter = {}): Promise<RealtimeDashboard> {
    const [
      alerts,
      liveMetrics,
      activeSessions,
      ongoingConsultations,
      queueMetrics,
      systemHealth,
      resources,
      statistics,
    ] = await Promise.all([
      this.getActiveAlerts(filter),
      this.getLiveMetrics(),
      this.getActiveSessions(),
      this.getOngoingConsultations(),
      this.getQueueMetrics(),
      this.getSystemHealth(),
      this.getResourceUtilization(),
      this.getRealtimeStatistics(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      alerts,
      liveMetrics,
      activeSessions,
      ongoingConsultations,
      queueMetrics,
      systemHealth,
      resources,
      statistics,
      refreshInterval: 30, // Refresh every 30 seconds
    };
  },

  /**
   * Get active system alerts
   */
  async getActiveAlerts(filter: DashboardFilter): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];
    const now = new Date();

    // Check expert capacity
    const expertUtilization = await this.calculateExpertUtilization();
    if (expertUtilization > 85) {
      alerts.push({
        id: `alert-capacity-${Date.now()}`,
        severity: expertUtilization > 95 ? "critical" : "warning",
        status: "active",
        title: "High Expert Utilization",
        description: `Expert capacity at ${expertUtilization.toFixed(1)}%. Immediate action required.`,
        metric: "expert_utilization",
        currentValue: expertUtilization,
        threshold: 85,
        timestamp: now.toISOString(),
        actionRequired: true,
        suggestedActions: [
          "Expedite expert recruitment",
          "Enable waitlist for high-demand slots",
          "Send capacity alert to operations team",
        ],
      });
    }

    // Check booking queue
    const pendingBookings = await prisma.booking.count({
      where: {
        status: "PENDING",
        createdAt: {
          lt: new Date(Date.now() - 30 * 60 * 1000), // Older than 30 minutes
        },
      },
    });

    if (pendingBookings > 10) {
      alerts.push({
        id: `alert-pending-${Date.now()}`,
        severity: "warning",
        status: "active",
        title: "High Pending Bookings",
        description: `${pendingBookings} bookings pending for over 30 minutes`,
        metric: "pending_bookings",
        currentValue: pendingBookings,
        threshold: 10,
        timestamp: now.toISOString(),
        actionRequired: true,
        suggestedActions: [
          "Review payment processing",
          "Check expert availability",
          "Contact clients for follow-up",
        ],
      });
    }

    // Check database connections
    const dbConnections = await this.getDatabaseConnections();
    if (dbConnections > 80) {
      alerts.push({
        id: `alert-db-${Date.now()}`,
        severity: "warning",
        status: "active",
        title: "High Database Connections",
        description: `${dbConnections} active database connections`,
        metric: "db_connections",
        currentValue: dbConnections,
        threshold: 80,
        timestamp: now.toISOString(),
        actionRequired: true,
        suggestedActions: [
          "Review connection pooling",
          "Check for connection leaks",
          "Scale database resources",
        ],
      });
    }

    // Filter by severity if specified
    if (filter.severity && filter.severity.length > 0) {
      return alerts.filter(alert => filter.severity!.includes(alert.severity));
    }

    return alerts;
  },

  /**
   * Get live platform metrics
   */
  async getLiveMetrics(): Promise<LiveMetric[]> {
    const nowMs = Date.now();
    const windowMs = 30 * 60 * 1000;
    const dayMs = 24 * 60 * 60 * 1000;

    const yesterdayStart = new Date(nowMs - dayMs - windowMs);
    const yesterdayEnd = new Date(nowMs - dayMs);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayDayStart = new Date(todayStart.getTime() - dayMs);

    const [
      activeUsers,
      activeUsersYesterday,
      activeConsultations,
      todayRevenue,
      yesterdayRevenue,
      cacheHitRate,
    ] = await Promise.all([
      this.getActiveUserCount(),
      prisma.user.count({
        where: { lastLoginAt: { gte: yesterdayStart, lt: yesterdayEnd } },
      }),
      this.getActiveConsultationCount(),
      this.getTodayRevenue(),
      prisma.booking.aggregate({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: yesterdayDayStart, lt: todayStart },
        },
        _sum: { platformFee: true },
      }),
      this.getCacheHitRate(),
    ]);

    const usersChange = percentChange(activeUsers, activeUsersYesterday);
    const yesterdayRevenueSum = Number(yesterdayRevenue._sum?.platformFee || 0);
    const revenueChange = percentChange(todayRevenue, yesterdayRevenueSum);

    return [
      {
        name: "Active Users",
        value: activeUsers,
        unit: "users",
        trend: trendFromChange(usersChange),
        percentChange: usersChange,
        status: activeUsers > 100 ? "healthy" : "warning",
        lastUpdated: new Date().toISOString(),
      },
      {
        name: "Active Consultations",
        value: activeConsultations,
        unit: "sessions",
        trend: "stable",
        percentChange: null, // no reliable historical baseline for in-progress sessions
        status: "healthy",
        lastUpdated: new Date().toISOString(),
      },
      {
        name: "Today's Revenue",
        value: todayRevenue,
        unit: "RWF",
        trend: trendFromChange(revenueChange),
        percentChange: revenueChange,
        status: "healthy",
        lastUpdated: new Date().toISOString(),
      },
      {
        name: "Cache Hit Rate",
        value: cacheHitRate ?? 0,
        unit: "%",
        trend: "stable",
        percentChange: null, // no historical baseline tracked
        status: cacheHitRate !== null && cacheHitRate > 80 ? "healthy" : "warning",
        lastUpdated: new Date().toISOString(),
      },
    ];
  },

  /**
   * Get active user sessions
   */
  async getActiveSessions(): Promise<ActiveSession[]> {
    // In production, this would pull from Redis session store
    const recentUsers = await prisma.user.findMany({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
        },
      },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        lastLoginAt: true,
      },
      take: 50,
      orderBy: {
        lastLoginAt: 'desc',
      },
    });

    return recentUsers.map(user => ({
      sessionId: `session-${user.id}`,
      userId: user.id,
      userRole: user.role,
      userName: `${user.firstName} ${user.lastName}`,
      activity: "browsing",
      startedAt: user.lastLoginAt?.toISOString() || new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      durationMinutes: user.lastLoginAt
        ? Math.floor((Date.now() - user.lastLoginAt.getTime()) / 60000)
        : 0,
    }));
  },

  /**
   * Get ongoing consultations
   */
  async getOngoingConsultations(): Promise<OngoingConsultation[]> {
    const activeBookings = await prisma.booking.findMany({
      where: {
        status: "ACTIVE",
        scheduledStart: {
          lte: new Date(),
        },
        scheduledEnd: {
          gte: new Date(),
        },
      },
      include: {
        citizen: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        expert: {
          select: {
            displayName: true,
          },
        },
        legalService: {
          select: {
            name: true,
          },
        },
      },
      take: 20,
    });

    return activeBookings.map(booking => {
      const startedAt = booking.scheduledStart;
      const actualDuration = Math.floor((Date.now() - startedAt.getTime()) / 60000);
      const scheduledDuration = Math.floor(
        (booking.scheduledEnd.getTime() - startedAt.getTime()) / 60000
      );

      const serviceName = booking.legalService && 'name' in booking.legalService
        ? (booking.legalService as any).name
        : "General";

      return {
        bookingId: booking.id,
        roomId: booking.meetingRoomId || `room-${booking.id}`,
        expertId: booking.expertId,
        expertName: booking.expert.displayName,
        clientId: booking.citizenId,
        clientName: `${booking.citizen.firstName} ${booking.citizen.lastName}`,
        specialty: serviceName,
        startedAt: startedAt.toISOString(),
        scheduledDuration,
        actualDuration,
        status: actualDuration < 5 ? "starting" : actualDuration > scheduledDuration - 5 ? "ending" : "active",
        participants: 2, // Consultations are always 1-on-1 (citizen + expert)
      } as OngoingConsultation;
    });
  },

  /**
   * Get queue metrics from real email logs and booking reminder state
   */
  async getQueueMetrics(): Promise<QueueMetrics[]> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const [emailsSent, emailsFailed, remindersSentToday, remindersPending] = await Promise.all([
      prisma.emailLog.count({
        where: { status: "SENT", sentAt: { gte: startOfToday } },
      }),
      prisma.emailLog.count({
        where: { status: "FAILED", sentAt: { gte: startOfToday } },
      }),
      prisma.booking.count({
        where: {
          reminderSent: true,
          scheduledStart: { gte: startOfToday, lt: endOfToday },
        },
      }),
      this.getPendingReminderCount(),
    ]);

    return [
      {
        queueName: "email-notifications",
        sentToday: emailsSent,
        failedToday: emailsFailed,
        pending: 0, // Emails are sent synchronously — nothing waits in a queue
      },
      {
        queueName: "booking-reminders",
        sentToday: remindersSentToday,
        failedToday: 0, // Reminder failures are not tracked
        pending: remindersPending,
      },
    ];
  },

  /**
   * Probe an external HTTP endpoint with a 2s timeout.
   * Only called when the service's URL is actually configured.
   */
  async probeExternalService(component: string, url: string): Promise<SystemHealth> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const start = Date.now();

    try {
      const response = await fetch(url, { method: "GET", signal: controller.signal });
      const latency = Date.now() - start;
      return {
        component,
        status:
          response.status >= 500
            ? "down"
            : latency > 1500
              ? "degraded"
              : "operational",
        latency,
        lastCheck: new Date().toISOString(),
      };
    } catch {
      return {
        component,
        status: "down",
        lastCheck: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  },

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth[]> {
    const health: SystemHealth[] = [];

    // Check database
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      health.push({
        component: "PostgreSQL Database",
        status: latency < 100 ? "operational" : latency < 500 ? "degraded" : "down",
        latency,
        lastCheck: new Date().toISOString(),
        errorRate: 0,
      });
    } catch (error) {
      health.push({
        component: "PostgreSQL Database",
        status: "down",
        lastCheck: new Date().toISOString(),
        errorRate: 100,
      });
    }

    // Check Redis
    try {
      const start = Date.now();
      await redis.ping();
      const latency = Date.now() - start;

      health.push({
        component: "Redis Cache",
        status: latency < 50 ? "operational" : latency < 200 ? "degraded" : "down",
        latency,
        lastCheck: new Date().toISOString(),
      });
    } catch (error) {
      health.push({
        component: "Redis Cache",
        status: "down",
        lastCheck: new Date().toISOString(),
      });
    }

    // External services are only reported when their endpoint is configured
    const externalChecks: Array<Promise<SystemHealth>> = [];

    if (process.env.LIVEKIT_HOST) {
      const host = process.env.LIVEKIT_HOST;
      const url = host.startsWith("http") ? host : `https://${host}`;
      externalChecks.push(this.probeExternalService("LiveKit Video Service", url));
    }

    const azamPayUrl = process.env.AZAMPAY_AUTH_URL || process.env.AZAMPAY_CHECKOUT_URL;
    if (azamPayUrl) {
      externalChecks.push(this.probeExternalService("Azam Pay Payment Gateway", azamPayUrl));
    }

    if (process.env.OCI_ENDPOINT) {
      const endpoint = process.env.OCI_ENDPOINT;
      const url = endpoint.startsWith("http") ? endpoint : `https://${endpoint}`;
      externalChecks.push(this.probeExternalService("OCI Object Storage", url));
    }

    const externalResults = await Promise.all(externalChecks);
    health.push(...externalResults);

    return health;
  },

  /**
   * Get resource utilization
   */
  async getResourceUtilization(): Promise<ResourceUtilization> {
    const [dbConnections, cacheHitRate] = await Promise.all([
      this.getDatabaseConnections(),
      this.getCacheHitRate(),
    ]);

    const cpus = os.cpus().length || 1;
    const cpuUsage = Math.min(100, Math.max(0, (os.loadavg()[0] / cpus) * 100));

    const totalMemGb = os.totalmem() / (1024 * 1024 * 1024);
    const usedMemGb = (os.totalmem() - os.freemem()) / (1024 * 1024 * 1024);

    return {
      cpu: {
        usage: Number(cpuUsage.toFixed(1)),
      },
      memory: {
        used: Number(usedMemGb.toFixed(2)),
        total: Number(totalMemGb.toFixed(2)),
        percentage: Number(((usedMemGb / totalMemGb) * 100).toFixed(1)),
      },
      database: {
        connections: dbConnections,
        maxConnections: 100,
      },
      cache: {
        hitRate: cacheHitRate,
        missRate: cacheHitRate === null ? null : Number((100 - cacheHitRate).toFixed(1)),
      },
    };
  },

  /**
   * Get real-time statistics
   */
  async getRealtimeStatistics(): Promise<RealtimeStatistics> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastHourStart = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      activeUsers,
      onlineExperts,
      activeConsultations,
      pendingBookings,
      pendingReminders,
      todayStats,
      lastHourStats,
    ] = await Promise.all([
      this.getActiveUserCount(),
      this.getOnlineExpertCount(),
      this.getActiveConsultationCount(),
      prisma.booking.count({ where: { status: "PENDING" } }),
      this.getPendingReminderCount(),
      this.getTodayStatistics(todayStart),
      this.getLastHourStatistics(lastHourStart),
    ]);

    return {
      current: {
        activeUsers,
        onlineExperts,
        activeConsultations,
        pendingBookings,
        pendingReminders,
      },
      today: todayStats,
      lastHour: lastHourStats,
    };
  },

  // Helper methods
  async calculateExpertUtilization(): Promise<number> {
    const totalExperts = await prisma.expertProfile.count({
      where: { status: 'VERIFIED' }
    });

    const activeBookings = await prisma.booking.count({
      where: {
        status: { in: ['CONFIRMED', 'ACTIVE'] },
        scheduledStart: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const maxCapacity = totalExperts * 10; // 10 bookings per expert per week
    return maxCapacity === 0 ? 0 : (activeBookings / maxCapacity) * 100;
  },

  async getDatabaseConnections(): Promise<number> {
    try {
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*) FROM pg_stat_activity WHERE state = 'active'
      `;
      return Number(result[0]?.count || 0);
    } catch {
      return 0;
    }
  },

  async getActiveUserCount(): Promise<number> {
    return await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000),
        },
      },
    });
  },

  async getOnlineExpertCount(): Promise<number> {
    return await prisma.user.count({
      where: {
        role: 'EXPERT',
        lastLoginAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000),
        },
      },
    });
  },

  async getActiveConsultationCount(): Promise<number> {
    return await prisma.booking.count({
      where: {
        status: 'ACTIVE',
      },
    });
  },

  async getTodayRevenue(): Promise<number> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const result = await prisma.booking.aggregate({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: todayStart,
        },
      },
      _sum: {
        platformFee: true,
      },
    });

    return Number(result._sum?.platformFee || 0);
  },

  /**
   * CONFIRMED bookings starting within the next 2 hours that have not been reminded yet
   */
  async getPendingReminderCount(): Promise<number> {
    const now = new Date();
    return prisma.booking.count({
      where: {
        status: "CONFIRMED",
        reminderSent: false,
        scheduledStart: {
          gte: now,
          lte: new Date(now.getTime() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000),
        },
      },
    });
  },

  async getCacheHitRate(): Promise<number | null> {
    try {
      const info = await redis.info('stats');
      const lines = info.split('\r\n');

      let hits = 0;
      let misses = 0;

      for (const line of lines) {
        if (line.startsWith('keyspace_hits:')) {
          hits = parseInt(line.split(':')[1]);
        }
        if (line.startsWith('keyspace_misses:')) {
          misses = parseInt(line.split(':')[1]);
        }
      }

      const total = hits + misses;
      return total === 0 ? null : Number(((hits / total) * 100).toFixed(1));
    } catch {
      return null; // Redis stats unavailable — report honestly instead of guessing
    }
  },

  async getTodayStatistics(todayStart: Date) {
    const [newUsers, newBookings, completedConsultations, revenue] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.booking.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.booking.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: todayStart },
        },
      }),
      this.getTodayRevenue(),
    ]);

    return {
      newUsers,
      newBookings,
      completedConsultations,
      revenue,
    };
  },

  async getLastHourStatistics(lastHourStart: Date) {
    const [signups, bookings] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: lastHourStart } },
      }),
      prisma.booking.count({
        where: { createdAt: { gte: lastHourStart } },
      }),
    ]);

    return {
      signups,
      bookings,
    };
  },
};

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function trendFromChange(change: number | null): "up" | "down" | "stable" {
  if (change === null) return "stable";
  if (change > 1) return "up";
  if (change < -1) return "down";
  return "stable";
}
