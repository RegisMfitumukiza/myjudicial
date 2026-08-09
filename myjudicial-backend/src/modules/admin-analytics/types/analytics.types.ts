/**
 * Admin Analytics Types
 * 
 * Centralized type definitions for analytics module
 */

export type TimePeriod = "today" | "7days" | "30days" | "90days" | "year" | "custom";

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

export type PlatformSummary = {
  totalUsers: number;
  totalClients: number;
  totalExperts: number;
  verifiedExperts: number;
  activeExperts: number;
  suspendedExperts: number;
  newUsersToday: number;
  newUsersThisMonth: number;
};

export type BookingSummary = {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  successRate: number;
};

export type RevenueSummary = {
  totalRevenue: number;
  platformFees: number;
  expertPayouts: number;
  escrowBalance: number;
};

export type ActivitySummary = {
  activeConversations: number;
  messagesToday: number;
  whatsappSentToday: number;
  emailsSentToday: number;
};

export type BookingAnalytics = {
  totals: {
    totalBookings: number;
    pending: number;
    confirmed: number;
    active: number;
    completed: number;
    cancelled: number;
    refunded: number;
  };
  metrics: {
    successRate: number;
    averageBookingsPerDay: number;
    averageDurationMin: number;
    totalDurationHours: number;
  };
  peakHours?: Array<{ hour: number; count: number }>;
  timeSeries?: Array<{ date: string; count: number }>;
};

export type RevenueAnalytics = {
  totals: {
    totalRevenue: number;
    platformFees: number;
    expertPayouts: number;
    escrowLocked: number;
    escrowReleased: number;
    refundsProcessed: number;
  };
  timeSeries?: Array<{
    date: string;
    revenue: number;
    fees: number;
    payouts: number;
  }>;
};

export type EscrowAnalytics = {
  balance: {
    totalEscrowBalance: number;
    lockedFunds: number;
    heldInEscrow: number;
  };
  flows: {
    totalDisbursed: number;
    totalRefunded: number;
    pendingDisbursements: number;
  };
  byStatus: {
    PENDING: { count: number; total: number };
    LOCKED: { count: number; total: number };
    HELD_IN_ESCROW: { count: number; total: number };
    DISBURSED_TO_EXPERT: { count: number; total: number };
    REFUNDED: { count: number; total: number };
  };
};

export type UserAnalytics = {
  totals: {
    totalUsers: number;
    totalClients: number;
    totalExperts: number;
    totalAdmins: number;
    newUsers: number;
  };
  byRole: {
    CITIZEN: number;
    EXPERT: number;
    ADMIN: number;
  };
  byStatus: {
    ACTIVE: number;
    PENDING: number;
    SUSPENDED: number;
  };
  timeSeries: Array<{ date: string; count: number }>;
};

export type ExpertAnalytics = {
  totals: {
    totalExperts: number;
    activeExperts: number;
    suspendedExperts: number;
    pendingVerification: number;
    verifiedExperts: number;
  };
  byStatus: {
    VERIFIED: number;
    SUSPENDED: number;
    PENDING_VERIFICATION: number;
  };
  verificationStatus: {
    APPROVED: number;
    PENDING: number;
    REJECTED: number;
  };
  topRated: Array<{
    expertId: string;
    displayName: string;
    averageRating: number;
    reviewCount: number;
  }>;
  mostBooked: Array<{
    expertId: string;
    displayName: string;
    bookingCount: number;
  }>;
};

export type ReviewAnalytics = {
  totals: {
    totalReviews: number;
    averageRating: number;
    publishedReviews: number;
  };
  distribution: {
    "5": number;
    "4": number;
    "3": number;
    "2": number;
    "1": number;
  };
  timeSeries: Array<{ date: string; count: number; avgRating: number }>;
};

export type CommunicationAnalytics = {
  chat: {
    activeConversations: number;
    totalMessages: number;
  };
  whatsapp: {
    totalSent: number;
    delivered: number;
    failed: number;
    pending: number;
    successRate: number;
  };
  email: {
    totalSent: number;
    delivered: number;
    failed: number;
    pending: number;
    successRate: number;
  };
};

export type ComplianceAnalytics = {
  verifications: {
    approved: number;
    pending: number;
    inReview: number;
    rejected: number;
    total: number;
  };
  certifications: {
    total: number;
    expiringSoon: number;
    expired: number;
  };
};

export type SystemHealthMetrics = {
  auditLogs: {
    totalActions: number;
    actionsToday: number;
  };
  storage: {
    totalDocuments: number;
    totalSizeBytes: number;
  };
  notifications: {
    successRate: number;
    failedToday: number;
  };
};

export type SystemHealthAnalytics = {
  storage: {
    totalDocuments: number;
    totalStorageBytes: number;
    totalStorageMB: number;
  };
  activity: {
    auditLogCount: number;
    notificationsSent: number;
  };
  services: {
    redis: { status: "healthy" | "unhealthy"; latencyMs?: number };
    database: { status: "healthy" | "unhealthy"; latencyMs?: number };
  };
};

export type ClientAnalytics = {
  totals: {
    totalClients: number;
    activeClients: number;
    newClients: number;
  };
  engagement: {
    clientsWithBookings: number;
    averageBookingsPerClient: number;
    totalBookings: number;
  };
  mostActiveClients: Array<{
    clientId: string;
    clientName: string;
    bookingCount: number;
  }>;
};

// Query types
export type DateRangeQuery = {
  period?: TimePeriod;
  startDate?: string;
  endDate?: string;
  timezone?: string;
};

// Response types
export type PlatformSummaryResponse = {
  success: true;
  data: {
    platform: PlatformSummary;
    bookings: BookingSummary;
    revenue: RevenueSummary;
    activity: ActivitySummary;
  };
};

export type BookingAnalyticsResponse = {
  success: true;
  data: BookingAnalytics;
};

export type RevenueAnalyticsResponse = {
  success: true;
  data: RevenueAnalytics;
};

export type UserAnalyticsResponse = {
  success: true;
  data: UserAnalytics;
};

export type ExpertAnalyticsResponse = {
  success: true;
  data: ExpertAnalytics;
};

export type ClientAnalyticsResponse = {
  success: true;
  data: ClientAnalytics;
};

export type EscrowAnalyticsResponse = {
  success: true;
  data: EscrowAnalytics;
};

export type ReviewAnalyticsResponse = {
  success: true;
  data: ReviewAnalytics;
};

export type CommunicationAnalyticsResponse = {
  success: true;
  data: CommunicationAnalytics;
};

export type ComplianceAnalyticsResponse = {
  success: true;
  data: ComplianceAnalytics;
};

export type SystemHealthResponse = {
  success: true;
  data: SystemHealthAnalytics;
};
