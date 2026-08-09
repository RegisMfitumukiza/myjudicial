/**
 * Analytics OpenAPI Documentation
 * 
 * Admin analytics endpoints documentation
 */

import { z, registry } from "./registry.js";

// Common schemas
const DateRangeQuerySchema = z.object({
  period: z.enum(["today", "7days", "30days", "90days", "year", "custom"]).optional(),
  startDate: z.string().optional().describe("ISO 8601 date (for custom period)"),
  endDate: z.string().optional().describe("ISO 8601 date (for custom period)"),
  timezone: z.string().optional().describe("Timezone (e.g., Africa/Kigali)"),
});

const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
});

// Register Bearer Auth Security Scheme
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

/**
 * GET /admin/analytics/summary
 * Platform overview
 */
registry.registerPath({
  method: "get",
  path: "/admin/analytics/summary",
  tags: ["Admin Analytics"],
  security: [{ bearerAuth: [] }],
  summary: "Get platform overview summary",
  description: "High-level platform statistics including users, bookings, revenue, and activity. Requires admin role.",
  responses: {
    200: {
      description: "Platform summary retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              platform: z.object({
                totalUsers: z.number(),
                totalClients: z.number(),
                totalExperts: z.number(),
                verifiedExperts: z.number(),
                activeExperts: z.number(),
                suspendedExperts: z.number(),
                newUsersToday: z.number(),
                newUsersThisMonth: z.number(),
              }),
              bookings: z.object({
                totalBookings: z.number(),
                pendingBookings: z.number(),
                confirmedBookings: z.number(),
                completedBookings: z.number(),
                cancelledBookings: z.number(),
                successRate: z.number(),
              }),
              revenue: z.object({
                totalRevenue: z.number(),
                platformFees: z.number(),
                expertPayouts: z.number(),
                escrowBalance: z.number(),
              }),
              activity: z.object({
                activeConversations: z.number(),
                messagesToday: z.number(),
                whatsappSentToday: z.number(),
                emailsSentToday: z.number(),
              }),
            }),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - Admin role required",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

/**
 * GET /admin/analytics/bookings
 * Booking analytics
 */
registry.registerPath({
  method: "get",
  path: "/admin/analytics/bookings",
  tags: ["Admin Analytics"],
  security: [{ bearerAuth: [] }],
  summary: "Get booking analytics",
  description: "Booking statistics with optional date filtering. Requires admin role.",
  request: {
    query: DateRangeQuerySchema,
  },
  responses: {
    200: {
      description: "Booking analytics retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              totals: z.object({
                totalBookings: z.number(),
                pending: z.number(),
                confirmed: z.number(),
                active: z.number(),
                completed: z.number(),
                cancelled: z.number(),
                refunded: z.number(),
              }),
              metrics: z.object({
                successRate: z.number(),
                averageBookingsPerDay: z.number(),
                averageDurationMin: z.number(),
                totalDurationHours: z.number(),
              }),
              peakHours: z.array(z.object({
                hour: z.number(),
                count: z.number(),
              })).optional(),
              timeSeries: z.array(z.object({
                date: z.string(),
                count: z.number(),
              })).optional(),
            }),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - Admin role required",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

/**
 * GET /admin/analytics/revenue
 * Revenue analytics
 */
registry.registerPath({
  method: "get",
  path: "/admin/analytics/revenue",
  tags: ["Admin Analytics"],
  security: [{ bearerAuth: [] }],
  summary: "Get revenue analytics",
  description: "Financial metrics with optional date filtering. Requires admin role.",
  request: {
    query: DateRangeQuerySchema,
  },
  responses: {
    200: {
      description: "Revenue analytics retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              totals: z.object({
                totalRevenue: z.number(),
                platformFees: z.number(),
                expertPayouts: z.number(),
                escrowLocked: z.number(),
                escrowReleased: z.number(),
                refundsProcessed: z.number(),
              }),
              timeSeries: z.array(z.object({
                date: z.string(),
                revenue: z.number(),
                fees: z.number(),
                payouts: z.number(),
              })).optional(),
            }),
          }),
        },
      },
    },
  },
});

/**
 * GET /admin/analytics/users
 * User analytics
 */
registry.registerPath({
  method: "get",
  path: "/admin/analytics/users",
  tags: ["Admin Analytics"],
  security: [{ bearerAuth: [] }],
  summary: "Get user analytics",
  description: "User statistics by role and status. Requires admin role.",
  request: {
    query: DateRangeQuerySchema,
  },
  responses: {
    200: {
      description: "User analytics retrieved successfully",
    },
  },
});

/**
 * GET /admin/analytics/experts
 * Expert analytics
 */
registry.registerPath({
  method: "get",
  path: "/admin/analytics/experts",
  tags: ["Admin Analytics"],
  security: [{ bearerAuth: [] }],
  summary: "Get expert analytics",
  description: "Expert metrics including top-rated and most-booked experts. Requires admin role.",
  responses: {
    200: {
      description: "Expert analytics retrieved successfully",
    },
  },
});

/**
 * GET /admin/analytics/clients
 * Client analytics
 */
registry.registerPath({
  method: "get",
  path: "/admin/analytics/clients",
  tags: ["Admin Analytics"],
  security: [{ bearerAuth: [] }],
  summary: "Get client analytics",
  description: "Client engagement metrics. Requires admin role.",
  request: {
    query: DateRangeQuerySchema,
  },
  responses: {
    200: {
      description: "Client analytics retrieved successfully",
    },
  },
});

/**
 * GET /admin/analytics/reviews
 * Review analytics
 */
registry.registerPath({
  method: "get",
  path: "/admin/analytics/reviews",
  tags: ["Admin Analytics"],
  security: [{ bearerAuth: [] }],
  summary: "Get review analytics",
  description: "Review and rating statistics. Requires admin role.",
  request: {
    query: DateRangeQuerySchema,
  },
  responses: {
    200: {
      description: "Review analytics retrieved successfully",
    },
  },
});

/**
 * GET /admin/analytics/communications
 * Communication analytics
 */
registry.registerPath({
  method: "get",
  path: "/admin/analytics/communications",
  tags: ["Admin Analytics"],
  security: [{ bearerAuth: [] }],
  summary: "Get communication analytics",
  description: "Chat, WhatsApp, and email statistics. Requires admin role.",
  request: {
    query: DateRangeQuerySchema,
  },
  responses: {
    200: {
      description: "Communication analytics retrieved successfully",
    },
  },
});

/**
 * GET /admin/analytics/compliance
 * Compliance analytics
 */
registry.registerPath({
  method: "get",
  path: "/admin/analytics/compliance",
  tags: ["Admin Analytics"],
  security: [{ bearerAuth: [] }],
  summary: "Get compliance analytics",
  description: "Verification and compliance statistics. Requires admin role.",
  responses: {
    200: {
      description: "Compliance analytics retrieved successfully",
    },
  },
});

/**
 * GET /admin/analytics/realtime
 * Real-time operational dashboard
 */
registry.registerPath({
  method: "get",
  path: "/admin/analytics/realtime",
  tags: ["Admin Analytics"],
  security: [{ bearerAuth: [] }],
  summary: "Get real-time operational dashboard",
  description: "Live monitoring dashboard with system alerts, active sessions, ongoing consultations, queue metrics, and performance data. Auto-refreshes every 30 seconds. Requires admin role.",
  request: {
    query: z.object({
      timeRange: z.enum(["realtime", "last5min", "last15min", "last1hour"]).optional(),
      severity: z.string().optional().describe("Comma-separated alert severities (critical,warning,info)"),
      components: z.string().optional().describe("Comma-separated component names"),
      includeResolved: z.string().optional().describe("Include resolved alerts (true/false)"),
    }),
  },
  responses: {
    200: {
      description: "Real-time dashboard retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              timestamp: z.string().describe("Current server timestamp"),
              refreshInterval: z.number().describe("Recommended refresh interval in seconds"),
              alerts: z.array(z.object({
                id: z.string(),
                severity: z.enum(["critical", "warning", "info"]),
                status: z.enum(["active", "acknowledged", "resolved"]),
                title: z.string(),
                description: z.string(),
                metric: z.string(),
                currentValue: z.number(),
                threshold: z.number(),
                timestamp: z.string(),
                actionRequired: z.boolean(),
                suggestedActions: z.array(z.string()).optional(),
              })),
              liveMetrics: z.array(z.object({
                name: z.string(),
                value: z.number(),
                unit: z.string(),
                trend: z.enum(["up", "down", "stable"]),
                percentChange: z.number(),
                status: z.enum(["healthy", "warning", "critical"]),
                lastUpdated: z.string(),
              })),
              activeSessions: z.array(z.object({
                sessionId: z.string(),
                userId: z.string(),
                userRole: z.enum(["CITIZEN", "EXPERT", "ADMIN"]),
                userName: z.string(),
                activity: z.string(),
                startedAt: z.string(),
                lastActivity: z.string(),
                durationMinutes: z.number(),
              })),
              ongoingConsultations: z.array(z.object({
                bookingId: z.string(),
                roomId: z.string(),
                expertName: z.string(),
                clientName: z.string(),
                specialty: z.string(),
                startedAt: z.string(),
                scheduledDuration: z.number(),
                actualDuration: z.number(),
                status: z.enum(["starting", "active", "ending"]),
                quality: z.enum(["excellent", "good", "fair", "poor"]),
              })),
              queueMetrics: z.array(z.object({
                queueName: z.string(),
                totalJobs: z.number(),
                activeJobs: z.number(),
                waitingJobs: z.number(),
                completedJobs: z.number(),
                failedJobs: z.number(),
                avgProcessingTime: z.number(),
              })),
              systemHealth: z.array(z.object({
                component: z.string(),
                status: z.enum(["operational", "degraded", "down"]),
                latency: z.number().optional(),
                uptime: z.number().optional(),
                lastCheck: z.string(),
                errorRate: z.number().optional(),
              })),
              resources: z.object({
                cpu: z.object({
                  usage: z.number(),
                  trend: z.enum(["increasing", "decreasing", "stable"]),
                }),
                memory: z.object({
                  used: z.number(),
                  total: z.number(),
                  percentage: z.number(),
                }),
                database: z.object({
                  connections: z.number(),
                  maxConnections: z.number(),
                  activeQueries: z.number(),
                  slowQueries: z.number(),
                }),
                cache: z.object({
                  hitRate: z.number(),
                  missRate: z.number(),
                  evictions: z.number(),
                  size: z.number(),
                }),
              }),
              statistics: z.object({
                current: z.object({
                  activeUsers: z.number(),
                  onlineExperts: z.number(),
                  activeConsultations: z.number(),
                  pendingBookings: z.number(),
                  queuedMessages: z.number(),
                }),
                today: z.object({
                  newUsers: z.number(),
                  newBookings: z.number(),
                  completedConsultations: z.number(),
                  revenue: z.number(),
                  averageResponseTime: z.number(),
                }),
                lastHour: z.object({
                  pageViews: z.number(),
                  apiRequests: z.number(),
                  errors: z.number(),
                  signups: z.number(),
                  bookings: z.number(),
                }),
              }),
              performance: z.array(z.object({
                endpoint: z.string(),
                method: z.string(),
                avgResponseTime: z.number(),
                requestCount: z.number(),
                errorRate: z.number(),
                p50: z.number(),
                p95: z.number(),
                p99: z.number(),
              })),
            }),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - Admin role required",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

/**
 * GET /admin/analytics/predictive
 * Advanced predictive analytics
 */
registry.registerPath({
  method: "get",
  path: "/admin/analytics/predictive",
  tags: ["Admin Analytics"],
  security: [{ bearerAuth: [] }],
  summary: "Get advanced predictive analytics and forecasting",
  description: "Comprehensive forecasting including booking volume, revenue projections, user growth, capacity analysis, and market insights. Requires admin role.",
  request: {
    query: z.object({
      horizonDays: z.string().optional().describe("Forecast horizon in days (default: 90)"),
      confidenceLevel: z.string().optional().describe("Confidence level (0.90, 0.95, 0.99) (default: 0.95)"),
      includeSeasonality: z.string().optional().describe("Include seasonal analysis (true/false)"),
      includeHolidays: z.string().optional().describe("Include holiday impact (true/false)"),
    }),
  },
  responses: {
    200: {
      description: "Predictive analytics retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              bookingForecast: z.object({
                timeSeries: z.array(z.object({
                  date: z.string(),
                  value: z.number(),
                  actual: z.boolean().optional(),
                  predicted: z.boolean().optional(),
                })),
                trend: z.object({
                  direction: z.enum(["increasing", "decreasing", "stable"]),
                  strength: z.enum(["strong", "moderate", "weak"]),
                  changePercent: z.number(),
                  confidence: z.number(),
                }),
                expectedVolume: z.object({
                  nextWeek: z.number(),
                  nextMonth: z.number(),
                  nextQuarter: z.number(),
                }),
                peakPeriods: z.array(z.object({
                  startDate: z.string(),
                  endDate: z.string(),
                  expectedVolume: z.number(),
                  confidenceLevel: z.number(),
                })),
              }),
              revenueForecast: z.object({
                projectedRevenue: z.object({
                  nextWeek: z.number(),
                  nextMonth: z.number(),
                  nextQuarter: z.number(),
                }),
                growthRate: z.object({
                  weekly: z.number(),
                  monthly: z.number(),
                  quarterly: z.number(),
                }),
              }),
              userGrowthForecast: z.object({
                projectedUsers: z.object({
                  nextWeek: z.number(),
                  nextMonth: z.number(),
                  nextQuarter: z.number(),
                }),
                segmentGrowth: z.object({
                  experts: z.number(),
                  clients: z.number(),
                }),
              }),
              capacityAnalysis: z.object({
                currentUtilization: z.object({
                  experts: z.number().describe("Expert utilization percentage"),
                  bookingSlots: z.number().describe("Booking slot utilization percentage"),
                  platform: z.number().describe("Overall platform utilization percentage"),
                }),
                projectedNeeds: z.object({
                  expertsNeeded: z.object({
                    nextMonth: z.number(),
                    nextQuarter: z.number(),
                  }),
                }),
                recommendations: z.array(z.object({
                  action: z.string(),
                  priority: z.enum(["high", "medium", "low"]),
                  impact: z.string(),
                  timeline: z.string(),
                })),
              }),
              insights: z.array(z.object({
                type: z.enum(["opportunity", "risk", "trend", "anomaly"]),
                title: z.string(),
                description: z.string(),
                confidence: z.number(),
                impact: z.enum(["high", "medium", "low"]),
                timeframe: z.string(),
                actionRequired: z.boolean(),
                suggestedActions: z.array(z.string()).optional(),
              })),
              lastUpdated: z.string().describe("ISO 8601 datetime"),
              forecastHorizon: z.object({
                startDate: z.string().describe("Forecast start date"),
                endDate: z.string().describe("Forecast end date"),
              }),
            }),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - Admin role required",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

/**
 * GET /admin/analytics/escrow
 * Escrow fund analytics
 */
registry.registerPath({
  method: "get",
  path: "/admin/analytics/escrow",
  tags: ["Admin Analytics"],
  security: [{ bearerAuth: [] }],
  summary: "Get escrow fund analytics",
  description: "Detailed escrow fund tracking, balances, and flow analytics. Requires admin role.",
  responses: {
    200: {
      description: "Escrow analytics retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              balance: z.object({
                totalEscrowBalance: z.number().describe("Total funds currently held in escrow"),
                lockedFunds: z.number().describe("Funds in LOCKED status"),
                heldInEscrow: z.number().describe("Funds in HELD_IN_ESCROW status"),
              }),
              flows: z.object({
                totalDisbursed: z.number().describe("Total amount disbursed to experts"),
                totalRefunded: z.number().describe("Total amount refunded to clients"),
                pendingDisbursements: z.number().describe("Amount pending disbursement"),
              }),
              byStatus: z.object({
                PENDING: z.object({
                  count: z.number(),
                  total: z.number(),
                }),
                LOCKED: z.object({
                  count: z.number(),
                  total: z.number(),
                }),
                HELD_IN_ESCROW: z.object({
                  count: z.number(),
                  total: z.number(),
                }),
                DISBURSED_TO_EXPERT: z.object({
                  count: z.number(),
                  total: z.number(),
                }),
                REFUNDED: z.object({
                  count: z.number(),
                  total: z.number(),
                }),
              }),
            }),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - Admin role required",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

/**
 * GET /admin/analytics/system
 * System health
 */
registry.registerPath({
  method: "get",
  path: "/admin/analytics/system",
  tags: ["Admin Analytics"],
  security: [{ bearerAuth: [] }],
  summary: "Get system health metrics",
  description: "System performance and health statistics. Requires admin role.",
  responses: {
    200: {
      description: "System health retrieved successfully",
    },
  },
});
