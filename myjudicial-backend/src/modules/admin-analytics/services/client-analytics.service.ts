/**
 * Client Analytics Service
 * 
 * Client-specific metrics
 */

import { prisma } from "../../../infrastructure/database/prisma.js";
import type { DateRange, ClientAnalytics } from "../types/analytics.types.js";

export const ClientAnalyticsService = {
  async getClientAnalytics(dateRange?: DateRange): Promise<ClientAnalytics> {
    const where = dateRange ? {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    } : undefined;

    const [totalClients, activeClients, clientBookings] = await Promise.all([
      prisma.user.count({
        where: {
          role: "CITIZEN",
          ...where,
        },
      }),

      prisma.user.count({
        where: {
          role: "CITIZEN",
          status: "ACTIVE",
          ...where,
        },
      }),

      // Get booking counts per client
      prisma.booking.groupBy({
        by: ["citizenId"],
        _count: true,
        where: dateRange ? {
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        } : undefined,
      }),
    ]);

    // Calculate engagement metrics
    const clientsWithBookings = clientBookings.length;
    const totalBookings = clientBookings.reduce((sum, cb) => sum + cb._count, 0);
    const avgBookingsPerClient = clientsWithBookings > 0 ? totalBookings / clientsWithBookings : 0;

    // Find most active clients
    const topClients = clientBookings
      .sort((a, b) => b._count - a._count)
      .slice(0, 10);

    // Get client details for top clients
    const topClientIds = topClients.map((tc) => tc.citizenId);
    const clientDetails = await prisma.user.findMany({
      where: {
        id: { in: topClientIds },
        role: "CITIZEN",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const mostActiveClients = topClients.map((tc) => {
      const client = clientDetails.find((cd) => cd.id === tc.citizenId);
      return {
        clientId: tc.citizenId,
        clientName: client ? `${client.firstName} ${client.lastName}` : "Unknown",
        bookingCount: tc._count,
      };
    });

    return {
      totals: {
        totalClients,
        activeClients,
        newClients: dateRange ? totalClients : 0,
      },
      engagement: {
        clientsWithBookings,
        averageBookingsPerClient: Number(avgBookingsPerClient.toFixed(2)),
        totalBookings,
      },
      mostActiveClients,
    };
  },
};
