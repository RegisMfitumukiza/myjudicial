/**
 * Real-time Operational Dashboard Types
 *
 * Types for live monitoring and operational metrics
 */

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "active" | "acknowledged" | "resolved";

export type SystemAlert = {
  id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  threshold: number;
  timestamp: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  actionRequired: boolean;
  suggestedActions?: string[];
};

export type LiveMetric = {
  name: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  percentChange: number | null; // null when no reliable yesterday baseline exists
  status: "healthy" | "warning" | "critical";
  lastUpdated: string;
};

export type ActiveSession = {
  sessionId: string;
  userId: string;
  userRole: "CITIZEN" | "EXPERT" | "ADMIN";
  userName: string;
  activity: string;
  startedAt: string;
  lastActivity: string;
  durationMinutes: number;
  ipAddress?: string;
  location?: string;
};

export type OngoingConsultation = {
  bookingId: string;
  roomId: string;
  expertId: string;
  expertName: string;
  clientId: string;
  clientName: string;
  specialty: string;
  startedAt: string;
  scheduledDuration: number;
  actualDuration: number;
  status: "starting" | "active" | "ending";
  participants: number; // always 2: consultations are 1-on-1 (citizen + expert)
};

export type QueueMetrics = {
  queueName: "email-notifications" | "booking-reminders";
  sentToday: number;
  failedToday: number;
  pending: number;
};

export type SystemHealth = {
  component: string;
  status: "operational" | "degraded" | "down";
  latency?: number;
  lastCheck: string;
  errorRate?: number;
};

export type ResourceUtilization = {
  cpu: {
    usage: number;
  };
  memory: {
    used: number; // GB
    total: number; // GB
    percentage: number;
  };
  database: {
    connections: number;
    maxConnections: number;
  };
  cache: {
    hitRate: number | null; // null when Redis stats are unavailable
    missRate: number | null;
  };
};

export type RealtimeStatistics = {
  current: {
    activeUsers: number;
    onlineExperts: number;
    activeConsultations: number;
    pendingBookings: number;
    pendingReminders: number;
  };
  today: {
    newUsers: number;
    newBookings: number;
    completedConsultations: number;
    revenue: number;
  };
  lastHour: {
    signups: number;
    bookings: number;
  };
};

export type RealtimeDashboard = {
  timestamp: string;
  alerts: SystemAlert[];
  liveMetrics: LiveMetric[];
  activeSessions: ActiveSession[];
  ongoingConsultations: OngoingConsultation[];
  queueMetrics: QueueMetrics[];
  systemHealth: SystemHealth[];
  resources: ResourceUtilization;
  statistics: RealtimeStatistics;
  refreshInterval: number; // seconds
};

export type RealtimeDashboardResponse = {
  success: true;
  data: RealtimeDashboard;
};

export type DashboardFilter = {
  timeRange?: "realtime" | "last5min" | "last15min" | "last1hour";
  severity?: AlertSeverity[];
  components?: string[];
  includeResolved?: boolean;
};
