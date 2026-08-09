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
  percentChange: number;
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
  participants: number;
  quality: "excellent" | "good" | "fair" | "poor";
};

export type QueueMetrics = {
  queueName: string;
  totalJobs: number;
  activeJobs: number;
  waitingJobs: number;
  completedJobs: number;
  failedJobs: number;
  avgProcessingTime: number;
  oldestWaitingJob?: {
    id: string;
    age: number;
    priority: number;
  };
};

export type SystemHealth = {
  component: string;
  status: "operational" | "degraded" | "down";
  latency?: number;
  uptime?: number;
  lastCheck: string;
  errorRate?: number;
  throughput?: number;
};

export type ResourceUtilization = {
  cpu: {
    usage: number;
    trend: "increasing" | "decreasing" | "stable";
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    connections: number;
    maxConnections: number;
    activeQueries: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    evictions: number;
    size: number;
  };
};

export type RealtimeStatistics = {
  current: {
    activeUsers: number;
    onlineExperts: number;
    activeConsultations: number;
    pendingBookings: number;
    queuedMessages: number;
  };
  today: {
    newUsers: number;
    newBookings: number;
    completedConsultations: number;
    revenue: number;
    averageResponseTime: number;
  };
  lastHour: {
    pageViews: number;
    apiRequests: number;
    errors: number;
    signups: number;
    bookings: number;
  };
};

export type PerformanceMetric = {
  endpoint: string;
  method: string;
  avgResponseTime: number;
  requestCount: number;
  errorRate: number;
  p50: number;
  p95: number;
  p99: number;
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
  performance: PerformanceMetric[];
  refreshInterval: number; // seconds
};

export type RealtimeDashboardResponse = {
  success: true;
  data: RealtimeDashboard;
};

export type AlertAction = {
  alertId: string;
  action: "acknowledge" | "resolve" | "escalate";
  performedBy: string;
  note?: string;
};

export type AlertConfiguration = {
  metric: string;
  severity: AlertSeverity;
  threshold: number;
  comparisonOperator: "gt" | "lt" | "eq" | "gte" | "lte";
  enabled: boolean;
  notificationChannels: ("email" | "sms" | "webhook")[];
};

export type DashboardFilter = {
  timeRange?: "realtime" | "last5min" | "last15min" | "last1hour";
  severity?: AlertSeverity[];
  components?: string[];
  includeResolved?: boolean;
};