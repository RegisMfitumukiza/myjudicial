/**
 * Predictive Analytics Types
 * 
 * Types for forecasting and trend analysis
 */

export type TimeSeriesPoint = {
  date: string;
  value: number;
  actual?: boolean;
  predicted?: boolean;
};

export type TrendAnalysis = {
  direction: "increasing" | "decreasing" | "stable";
  strength: "strong" | "moderate" | "weak";
  changePercent: number;
  confidence: number;
};

export type SeasonalPattern = {
  period: "daily" | "weekly" | "monthly" | "quarterly";
  peaks: Array<{
    period: string;
    averageIncrease: number;
  }>;
  valleys: Array<{
    period: string;
    averageDecrease: number;
  }>;
};

export type Forecast = {
  timeSeries: TimeSeriesPoint[];
  trend: TrendAnalysis;
  seasonality?: SeasonalPattern;
  confidence: {
    lower: number[];
    upper: number[];
  };
  metrics: {
    mape: number; // Mean Absolute Percentage Error
    rmse: number; // Root Mean Square Error
    r2: number;   // R-squared
  };
};

export type BookingForecast = Forecast & {
  expectedVolume: {
    nextWeek: number;
    nextMonth: number;
    nextQuarter: number;
  };
  peakPeriods: Array<{
    startDate: string;
    endDate: string;
    expectedVolume: number;
    confidenceLevel: number;
  }>;
};

export type RevenueForecast = Forecast & {
  projectedRevenue: {
    nextWeek: number;
    nextMonth: number;
    nextQuarter: number;
  };
  growthRate: {
    weekly: number;
    monthly: number;
    quarterly: number;
  };
};

export type UserGrowthForecast = Forecast & {
  projectedUsers: {
    nextWeek: number;
    nextMonth: number;
    nextQuarter: number;
  };
  segmentGrowth: {
    experts: number;
    clients: number;
  };
};

export type CapacityAnalysis = {
  currentUtilization: {
    experts: number; // percentage
    bookingSlots: number; // percentage
    platform: number; // overall percentage
  };
  projectedNeeds: {
    expertsNeeded: {
      nextMonth: number;
      nextQuarter: number;
    };
    capacityGaps: Array<{
      category: string;
      shortage: number;
      timeframe: string;
    }>;
  };
  recommendations: Array<{
    action: string;
    priority: "high" | "medium" | "low";
    impact: string;
    timeline: string;
  }>;
};

export type MarketAnalysis = {
  demand: {
    bySpecialty: Array<{
      specialty: string;
      currentDemand: number;
      projectedGrowth: number;
      saturationLevel: number;
    }>;
    byRegion: Array<{
      region: string;
      currentDemand: number;
      projectedGrowth: number;
      marketPenetration: number;
    }>;
  };
  competition: {
    // Verified experts available per 100 confirmed/completed bookings over the last 90 days
    expertSupplyDemandRatio: number | null;
  };
};

export type PredictiveInsight = {
  type: "opportunity" | "risk" | "trend" | "anomaly";
  title: string;
  description: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  timeframe: string;
  actionRequired: boolean;
  suggestedActions?: string[];
};

export type PredictiveAnalytics = {
  bookingForecast: BookingForecast;
  revenueForecast: RevenueForecast;
  userGrowthForecast: UserGrowthForecast;
  capacityAnalysis: CapacityAnalysis;
  marketAnalysis: MarketAnalysis;
  insights: PredictiveInsight[];
  lastUpdated: string;
  forecastHorizon: {
    startDate: string;
    endDate: string;
  };
};

export type PredictiveAnalyticsResponse = {
  success: true;
  data: PredictiveAnalytics;
};

export type ForecastParams = {
  horizonDays?: number;
  confidenceLevel?: number;
  includeSeasonality?: boolean;
  includeHolidays?: boolean;
};