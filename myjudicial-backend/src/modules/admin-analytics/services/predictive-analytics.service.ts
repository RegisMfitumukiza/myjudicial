/**
 * Predictive Analytics Service
 * 
 * Advanced forecasting and trend analysis for admin dashboard
 */

import { prisma } from "../../../infrastructure/database/prisma.js";
import { AnalyticsRepository } from "../repositories/analytics.repository.js";
import { 
  generateForecast, 
  analyzeTrend, 
  detectSeasonality,
  linearRegression 
} from "../utils/forecasting.utils.js";
import { detectAnomalies } from "../utils/anomaly-detection.utils.js";
import { adjustForHolidays, getHolidaysInRange } from "../utils/holiday-calendar.utils.js";
import type { 
  PredictiveAnalytics,
  BookingForecast,
  RevenueForecast,
  UserGrowthForecast,
  CapacityAnalysis,
  MarketAnalysis,
  PredictiveInsight,
  TimeSeriesPoint,
  ForecastParams 
} from "../types/predictive.types.js";

export const PredictiveAnalyticsService = {
  /**
   * Generate comprehensive predictive analytics
   */
  async getPredictiveAnalytics(params: ForecastParams = {}): Promise<PredictiveAnalytics> {
    const {
      horizonDays = 90,
      confidenceLevel = 0.95,
      includeSeasonality = true,
    } = params;

    const [
      bookingForecast,
      revenueForecast,
      userGrowthForecast,
      capacityAnalysis,
      marketAnalysis,
    ] = await Promise.all([
      this.generateBookingForecast(horizonDays, confidenceLevel, params.includeHolidays),
      this.generateRevenueForecast(horizonDays, confidenceLevel),
      this.generateUserGrowthForecast(horizonDays, confidenceLevel),
      this.analyzeCapacity(),
      this.analyzeMarket(),
    ]);

    const insights = await this.generateInsights({
      bookingForecast,
      revenueForecast,
      userGrowthForecast,
      capacityAnalysis,
      marketAnalysis,
    });

    const forecastEndDate = new Date();
    forecastEndDate.setDate(forecastEndDate.getDate() + horizonDays);

    return {
      bookingForecast,
      revenueForecast,
      userGrowthForecast,
      capacityAnalysis,
      marketAnalysis,
      insights,
      lastUpdated: new Date().toISOString(),
      forecastHorizon: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: forecastEndDate.toISOString().split('T')[0],
      },
    };
  },

  /**
   * Generate booking volume forecast
   */
  async generateBookingForecast(
    horizonDays: number, 
    confidenceLevel: number,
    includeHolidays: boolean = false
  ): Promise<BookingForecast> {
    // Get historical booking data for the last 180 days
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 180);

    const bookingHistory = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isDeleted: false,
      },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group bookings by day
    const dailyBookings = new Map<string, number>();
    bookingHistory.forEach(booking => {
      const date = booking.createdAt.toISOString().split('T')[0];
      dailyBookings.set(date, (dailyBookings.get(date) || 0) + 1);
    });

    // Create time series data
    const timeSeries: TimeSeriesPoint[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const bookingCount = dailyBookings.get(dateString) || 0;
      
      timeSeries.push({
        date: dateString,
        value: bookingCount,
        actual: true,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate forecast
    const baseForecast = generateForecast(timeSeries, horizonDays, confidenceLevel);

    // Apply holiday adjustments if requested
    if (includeHolidays) {
      const forecastDates = baseForecast.timeSeries
        .filter(point => point.predicted)
        .map(point => point.date);
      
      const forecastValues = baseForecast.timeSeries
        .filter(point => point.predicted)
        .map(point => point.value);
      
      const adjustedValues = adjustForHolidays(forecastValues, forecastDates);
      
      // Update forecast values
      let adjustedIndex = 0;
      baseForecast.timeSeries = baseForecast.timeSeries.map(point => {
        if (point.predicted) {
          return { ...point, value: adjustedValues[adjustedIndex++] };
        }
        return point;
      });
    }

    // Calculate expected volumes
    const forecastValues = baseForecast.timeSeries
      .filter(point => point.predicted)
      .map(point => point.value);

    const nextWeek = forecastValues.slice(0, 7).reduce((a, b) => a + b, 0);
    const nextMonth = forecastValues.slice(0, 30).reduce((a, b) => a + b, 0);
    const nextQuarter = forecastValues.slice(0, 90).reduce((a, b) => a + b, 0);

    // Identify peak periods (periods with >20% above average)
    const avgDailyBookings = forecastValues.reduce((a, b) => a + b, 0) / forecastValues.length;
    const peakThreshold = avgDailyBookings * 1.2;
    
    const peakPeriods = baseForecast.timeSeries
      .filter(point => point.predicted && point.value > peakThreshold)
      .map(point => ({
        startDate: point.date,
        endDate: point.date, // Single day peaks for now
        expectedVolume: Math.round(point.value),
        confidenceLevel: baseForecast.metrics.r2 * 100,
      }));

    return {
      ...baseForecast,
      expectedVolume: {
        nextWeek: Math.round(nextWeek),
        nextMonth: Math.round(nextMonth),
        nextQuarter: Math.round(nextQuarter),
      },
      peakPeriods,
    };
  },

  /**
   * Generate revenue forecast
   */
  async generateRevenueForecast(horizonDays: number, confidenceLevel: number): Promise<RevenueForecast> {
    // Get historical revenue data
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 180);

    const revenueHistory = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
        isDeleted: false,
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group revenue by day
    const dailyRevenue = new Map<string, number>();
    revenueHistory.forEach(booking => {
      const date = booking.createdAt.toISOString().split('T')[0];
      const currentRevenue = dailyRevenue.get(date) || 0;
      dailyRevenue.set(date, currentRevenue + Number(booking.totalAmount));
    });

    // Create time series data
    const timeSeries: TimeSeriesPoint[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const revenue = dailyRevenue.get(dateString) || 0;
      
      timeSeries.push({
        date: dateString,
        value: revenue,
        actual: true,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate forecast
    const baseForecast = generateForecast(timeSeries, horizonDays, confidenceLevel);
    
    // Calculate projected revenue
    const forecastValues = baseForecast.timeSeries
      .filter(point => point.predicted)
      .map(point => point.value);

    const nextWeek = forecastValues.slice(0, 7).reduce((a, b) => a + b, 0);
    const nextMonth = forecastValues.slice(0, 30).reduce((a, b) => a + b, 0);
    const nextQuarter = forecastValues.slice(0, 90).reduce((a, b) => a + b, 0);

    // Calculate growth rates
    const currentWeeklyAvg = timeSeries.slice(-7).reduce((sum, point) => sum + point.value, 0) / 7;
    const currentMonthlyAvg = timeSeries.slice(-30).reduce((sum, point) => sum + point.value, 0) / 30;
    const currentQuarterlyAvg = timeSeries.slice(-90).reduce((sum, point) => sum + point.value, 0) / 90;

    const projectedWeeklyAvg = nextWeek / 7;
    const projectedMonthlyAvg = nextMonth / 30;
    const projectedQuarterlyAvg = nextQuarter / 90;

    return {
      ...baseForecast,
      projectedRevenue: {
        nextWeek: Math.round(nextWeek),
        nextMonth: Math.round(nextMonth),
        nextQuarter: Math.round(nextQuarter),
      },
      growthRate: {
        weekly: currentWeeklyAvg === 0 ? 0 : ((projectedWeeklyAvg - currentWeeklyAvg) / currentWeeklyAvg) * 100,
        monthly: currentMonthlyAvg === 0 ? 0 : ((projectedMonthlyAvg - currentMonthlyAvg) / currentMonthlyAvg) * 100,
        quarterly: currentQuarterlyAvg === 0 ? 0 : ((projectedQuarterlyAvg - currentQuarterlyAvg) / currentQuarterlyAvg) * 100,
      },
    };
  },

  /**
   * Generate user growth forecast
   */
  async generateUserGrowthForecast(horizonDays: number, confidenceLevel: number): Promise<UserGrowthForecast> {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 180);

    const userHistory = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isDeleted: false,
      },
      select: {
        createdAt: true,
        role: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group users by day
    const dailyUsers = new Map<string, { total: number; experts: number; clients: number }>();
    
    userHistory.forEach(user => {
      const date = user.createdAt.toISOString().split('T')[0];
      const current = dailyUsers.get(date) || { total: 0, experts: 0, clients: 0 };
      
      current.total += 1;
      if (user.role === 'EXPERT') current.experts += 1;
      if (user.role === 'CITIZEN') current.clients += 1;
      
      dailyUsers.set(date, current);
    });

    // Create time series data
    const timeSeries: TimeSeriesPoint[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const userCount = dailyUsers.get(dateString)?.total || 0;
      
      timeSeries.push({
        date: dateString,
        value: userCount,
        actual: true,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate forecast
    const baseForecast = generateForecast(timeSeries, horizonDays, confidenceLevel);
    
    const forecastValues = baseForecast.timeSeries
      .filter(point => point.predicted)
      .map(point => point.value);

    const nextWeek = forecastValues.slice(0, 7).reduce((a, b) => a + b, 0);
    const nextMonth = forecastValues.slice(0, 30).reduce((a, b) => a + b, 0);
    const nextQuarter = forecastValues.slice(0, 90).reduce((a, b) => a + b, 0);

    // Calculate expert/client ratios from historical data
    const totalExperts = Array.from(dailyUsers.values()).reduce((sum, day) => sum + day.experts, 0);
    const totalClients = Array.from(dailyUsers.values()).reduce((sum, day) => sum + day.clients, 0);
    const totalUsers = totalExperts + totalClients;
    
    const expertRatio = totalUsers === 0 ? 0.1 : totalExperts / totalUsers;
    const clientRatio = totalUsers === 0 ? 0.9 : totalClients / totalUsers;

    return {
      ...baseForecast,
      projectedUsers: {
        nextWeek: Math.round(nextWeek),
        nextMonth: Math.round(nextMonth),
        nextQuarter: Math.round(nextQuarter),
      },
      segmentGrowth: {
        experts: Math.round(nextQuarter * expertRatio),
        clients: Math.round(nextQuarter * clientRatio),
      },
    };
  },

  /**
   * Analyze platform capacity and utilization
   */
  async analyzeCapacity(): Promise<CapacityAnalysis & { expertSampleSize: number }> {
    const [expertStats, bookingStats, platformStats] = await Promise.all([
      this.analyzeExpertCapacity(),
      this.analyzeBookingCapacity(),
      this.analyzePlatformCapacity(),
    ]);

    return {
      currentUtilization: {
        experts: expertStats.utilization,
        bookingSlots: bookingStats.utilization,
        platform: platformStats.utilization,
      },
      projectedNeeds: {
        expertsNeeded: {
          nextMonth: Math.ceil(expertStats.shortfall * 1.2),
          nextQuarter: Math.ceil(expertStats.shortfall * 1.5),
        },
        capacityGaps: [
          {
            category: "Expert Availability",
            shortage: expertStats.shortfall,
            timeframe: "Next 30 days",
          },
          {
            category: "Booking Slots",
            shortage: bookingStats.shortfall,
            timeframe: "Peak hours",
          },
        ],
      },
      recommendations: [
        {
          action: `Recruit additional experts — weekly expert utilization is at ${expertStats.utilization.toFixed(0)}% of capacity`,
          priority: expertStats.utilization > 80 ? "high" : "medium",
          impact: "Reduce wait times and improve client satisfaction",
          timeline: "2-4 weeks",
        },
        {
          action: `Add bookable capacity — ${bookingStats.utilization.toFixed(0)}% of available slots over the next 30 days are already booked`,
          priority: bookingStats.utilization > 75 ? "high" : "low",
          impact: "Better distribute demand across time slots",
          timeline: "1-2 weeks",
        },
      ],
      expertSampleSize: expertStats.totalExperts,
    };
  },

  /**
   * Analyze market trends and opportunities
   */
  async analyzeMarket(): Promise<MarketAnalysis> {
    const [specialtyDemand, regionalDemand, verifiedExperts] = await Promise.all([
      this.analyzeSpecialtyDemand(),
      this.analyzeRegionalDemand(),
      prisma.expertProfile.count({ where: { status: 'VERIFIED' } }),
    ]);

    const totalDemand = specialtyDemand.reduce((sum, s) => sum + s.currentDemand, 0);

    return {
      demand: {
        bySpecialty: specialtyDemand,
        byRegion: regionalDemand,
      },
      competition: {
        // Verified experts available per 100 confirmed/completed bookings over the last 90 days
        expertSupplyDemandRatio:
          totalDemand === 0 ? null : Number(((verifiedExperts / totalDemand) * 100).toFixed(1)),
      },
    };
  },

  /**
   * Generate actionable insights
   */
  async generateInsights(analytics: {
    bookingForecast: BookingForecast;
    revenueForecast: RevenueForecast;
    userGrowthForecast: UserGrowthForecast;
    capacityAnalysis: CapacityAnalysis & { expertSampleSize?: number };
    marketAnalysis: MarketAnalysis;
  }): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    // Detect anomalies in historical data
    const bookingTimeSeries = analytics.bookingForecast.timeSeries.filter(point => point.actual);
    const bookingAnomalies = detectAnomalies(bookingTimeSeries);

    if (bookingAnomalies.length > 0) {
      const recentAnomalies = bookingAnomalies.slice(-3); // Last 3 anomalies
      insights.push({
        type: "anomaly",
        title: "Recent Booking Anomalies Detected",
        description: `Found ${recentAnomalies.length} unusual booking patterns: ${recentAnomalies.map(a => a.description).join('; ')}`,
        confidence: confidenceFromSample(bookingTimeSeries.length),
        impact: recentAnomalies.some(a => a.severity === "high") ? "high" : "medium",
        timeframe: "Past 30 days",
        actionRequired: true,
        suggestedActions: [
          "Investigate causes of unusual booking patterns",
          "Review marketing campaigns and external factors",
          "Adjust forecasting models if patterns persist",
        ],
      });
    }

    // Booking trend insights
    if (analytics.bookingForecast.trend.direction === 'increasing' && 
        analytics.bookingForecast.trend.strength === 'strong') {
      insights.push({
        type: "opportunity",
        title: "Strong Booking Growth Predicted",
        description: `Bookings are forecasted to grow by ${analytics.bookingForecast.trend.changePercent.toFixed(1)}% over the next quarter with high confidence.`,
        confidence: analytics.bookingForecast.trend.confidence,
        impact: "high",
        timeframe: "Next 3 months",
        actionRequired: true,
        suggestedActions: [
          "Scale expert recruitment",
          "Optimize onboarding processes",
          "Prepare infrastructure for increased load",
        ],
      });
    }

    // Revenue insights
    if (analytics.revenueForecast.growthRate.monthly > 10) {
      const revenueSampleSize = analytics.revenueForecast.timeSeries.filter(p => p.actual).length;
      insights.push({
        type: "opportunity",
        title: "Revenue Acceleration Detected",
        description: `Monthly revenue growth of ${analytics.revenueForecast.growthRate.monthly.toFixed(1)}% indicates strong market traction.`,
        confidence: confidenceFromSample(revenueSampleSize),
        impact: "high",
        timeframe: "Ongoing",
        actionRequired: false,
      });
    }

    // Capacity warnings
    if (analytics.capacityAnalysis.currentUtilization.experts > 80) {
      insights.push({
        type: "risk",
        title: "Expert Capacity Constraint",
        description: `Expert utilization at ${analytics.capacityAnalysis.currentUtilization.experts}% may lead to service delays.`,
        confidence: confidenceFromSample(analytics.capacityAnalysis.expertSampleSize ?? 0),
        impact: "high",
        timeframe: "Immediate",
        actionRequired: true,
        suggestedActions: [
          "Expedite expert recruitment",
          "Implement waitlist system",
          "Consider temporary capacity expansion",
        ],
      });
    }

    // Market opportunities
    const highDemandSpecialties = analytics.marketAnalysis.demand.bySpecialty
      .filter(specialty => specialty.projectedGrowth > 20);

    if (highDemandSpecialties.length > 0) {
      const demandSampleSize = highDemandSpecialties.reduce((sum, s) => sum + s.currentDemand, 0);
      insights.push({
        type: "opportunity",
        title: "High-Growth Specialty Markets",
        description: `${highDemandSpecialties.map(s => s.specialty).join(", ")} showing strong growth potential.`,
        confidence: confidenceFromSample(demandSampleSize),
        impact: "medium",
        timeframe: "3-6 months",
        actionRequired: true,
        suggestedActions: [
          "Recruit experts in high-growth specialties",
          "Develop targeted marketing campaigns",
          "Create specialty-specific onboarding",
        ],
      });
    }

    // User growth insights
    if (analytics.userGrowthForecast.segmentGrowth.experts < analytics.userGrowthForecast.segmentGrowth.clients * 0.1) {
      const userSampleSize = analytics.userGrowthForecast.timeSeries.filter(p => p.actual).length;
      insights.push({
        type: "risk",
        title: "Expert-Client Ratio Imbalance",
        description: "Client growth significantly outpacing expert growth may create supply constraints.",
        confidence: confidenceFromSample(userSampleSize),
        impact: "medium",
        timeframe: "Next 2-3 months",
        actionRequired: true,
        suggestedActions: [
          "Launch expert referral program",
          "Improve expert onboarding experience",
          "Increase expert marketing efforts",
        ],
      });
    }

    return insights;
  },

  // Helper methods for capacity analysis
  async analyzeExpertCapacity() {
    const totalExperts = await prisma.expertProfile.count({
      where: { status: 'VERIFIED' }
    });

    const activeBookings = await prisma.booking.count({
      where: {
        status: { in: ['CONFIRMED', 'ACTIVE'] },
        scheduledStart: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
      },
    });

    // Assume each expert can handle 10 bookings per week
    const maxCapacity = totalExperts * 10;
    const utilization = maxCapacity === 0 ? 0 : (activeBookings / maxCapacity) * 100;
    const shortfall = Math.max(0, activeBookings - maxCapacity);

    return { utilization, shortfall, totalExperts };
  },

  async analyzeBookingCapacity() {
    const totalSlots = 24 * 7 * 4; // 24 hours * 7 days * 4 weeks of slots
    const bookedSlots = await prisma.booking.count({
      where: {
        status: { in: ['CONFIRMED', 'ACTIVE'] },
        scheduledStart: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        },
      },
    });

    const utilization = (bookedSlots / totalSlots) * 100;
    const shortfall = Math.max(0, bookedSlots - totalSlots * 0.8); // 80% capacity threshold

    return { utilization, shortfall };
  },

  async analyzePlatformCapacity() {
    // Simple platform utilization based on daily active patterns
    const dailyActiveUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    // Assume platform can handle 1000 concurrent users efficiently
    const utilization = Math.min(100, (dailyActiveUsers / 1000) * 100);

    return { utilization };
  },

  async analyzeSpecialtyDemand() {
    const windowMs = 90 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const [currentGroups, previousGroups] = await Promise.all([
      prisma.booking.groupBy({
        by: ['serviceId'],
        _count: { id: true },
        where: {
          createdAt: {
            gte: new Date(now - windowMs), // Last 90 days
          },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
          isDeleted: false,
        },
      }),
      prisma.booking.groupBy({
        by: ['serviceId'],
        _count: { id: true },
        where: {
          createdAt: {
            gte: new Date(now - 2 * windowMs),
            lt: new Date(now - windowMs),
          },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
          isDeleted: false,
        },
      }),
    ]);

    const serviceIds = [...new Set([...currentGroups, ...previousGroups].map(g => g.serviceId))];
    if (serviceIds.length === 0) return [];

    const services = await prisma.legalService.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, expert: { select: { primarySpecialty: true } } },
    });
    const serviceToSpecialty = new Map(services.map(s => [s.id, s.expert.primarySpecialty]));

    const currentDemand = new Map<string, number>();
    for (const group of currentGroups) {
      const specialty = serviceToSpecialty.get(group.serviceId);
      if (!specialty) continue;
      currentDemand.set(specialty, (currentDemand.get(specialty) || 0) + group._count.id);
    }

    const previousDemand = new Map<string, number>();
    for (const group of previousGroups) {
      const specialty = serviceToSpecialty.get(group.serviceId);
      if (!specialty) continue;
      previousDemand.set(specialty, (previousDemand.get(specialty) || 0) + group._count.id);
    }

    const supplyBySpecialty = new Map<string, number>(
      (
        await prisma.expertProfile.groupBy({
          by: ['primarySpecialty'],
          _count: { id: true },
          where: { status: 'VERIFIED' },
        })
      ).map(g => [g.primarySpecialty as string, g._count.id])
    );

    return [...currentDemand.entries()]
      .map(([specialty, demand]) => {
        const previous = previousDemand.get(specialty) || 0;
        const growth = previous === 0 ? (demand > 0 ? 100 : 0) : ((demand - previous) / previous) * 100;
        // Saturation heuristic: verified experts offering the specialty per unit of demand (×100, capped at 100)
        const supply = supplyBySpecialty.get(specialty) || 0;
        const saturationLevel = Math.min(100, Math.round((supply / Math.max(demand, 1)) * 100));
        return {
          specialty,
          currentDemand: demand,
          projectedGrowth: Number(growth.toFixed(1)),
          saturationLevel,
        };
      })
      .sort((a, b) => b.currentDemand - a.currentDemand)
      .slice(0, 5);
  },

  async analyzeRegionalDemand() {
    const windowMs = 90 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const [currentBookings, previousBookings] = await Promise.all([
      prisma.booking.findMany({
        where: {
          createdAt: { gte: new Date(now - windowMs) }, // Last 90 days
          status: { in: ['CONFIRMED', 'COMPLETED'] },
          isDeleted: false,
        },
        select: { expert: { select: { city: true } } },
      }),
      prisma.booking.findMany({
        where: {
          createdAt: {
            gte: new Date(now - 2 * windowMs),
            lt: new Date(now - windowMs),
          },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
          isDeleted: false,
        },
        select: { expert: { select: { city: true } } },
      }),
    ]);

    const tallyByCity = (bookings: Array<{ expert: { city: string | null } }>) => {
      const counts = new Map<string, number>();
      for (const booking of bookings) {
        const region = booking.expert.city || "Unknown";
        counts.set(region, (counts.get(region) || 0) + 1);
      }
      return counts;
    };

    const currentDemand = tallyByCity(currentBookings);
    const previousDemand = tallyByCity(previousBookings);
    const totalDemand = [...currentDemand.values()].reduce((sum, count) => sum + count, 0);

    return [...currentDemand.entries()]
      .map(([region, demand]) => {
        const previous = previousDemand.get(region) || 0;
        const growth = previous === 0 ? (demand > 0 ? 100 : 0) : ((demand - previous) / previous) * 100;
        return {
          region,
          currentDemand: demand,
          projectedGrowth: Number(growth.toFixed(1)),
          marketPenetration: totalDemand === 0 ? 0 : Number(((demand / totalDemand) * 100).toFixed(1)),
        };
      })
      .sort((a, b) => b.currentDemand - a.currentDemand)
      .slice(0, 5);
  },
};

// Confidence scales with underlying sample size n: 50 + 45 * (1 - 100/(100+n)), capped at 95
function confidenceFromSample(n: number): number {
  return Math.min(95, Math.round(50 + 45 * (1 - 100 / (100 + n))));
}