"use client";

import { useState } from "react";
import {
  FileText,
  Activity,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  Database,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { format } from "date-fns";

// Types
type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "VERIFY"
  | "REJECT"
  | "BOOK"
  | "CANCEL"
  | "PAYMENT"
  | "ESCROW_LOCKED"
  | "ESCROW_RELEASED"
  | "UPLOAD"
  | "DOWNLOAD"
  | "SHARE";

type AuditResource =
  | "USER"
  | "EXPERT"
  | "BOOKING"
  | "SERVICE"
  | "REVIEW"
  | "VERIFICATION"
  | "PAYMENT"
  | "DOCUMENT"
  | "CONVERSATION"
  | "MESSAGE";

interface Actor {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface AuditLog {
  id: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string | null;
  description: string | null;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  actor: Actor | null;
}

interface AuditStats {
  totalLogs: number;
  byPeriod: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  byAction: Array<{ action: AuditAction; count: number }>;
  byResource: Array<{ resource: AuditResource; count: number }>;
  recentCritical: number;
  retentionDays: number;
  oldestLogDate: string | null;
}

interface AuditLogsResponse {
  data: {
    logs: AuditLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// API functions
const fetchStats = async (): Promise<{ data: AuditStats }> => {
  return apiFetch("/admin/audit-logs/stats");
};

const fetchLogs = async (params: {
  page?: number;
  limit?: number;
  action?: AuditAction;
  resource?: AuditResource;
  search?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<AuditLogsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.action) queryParams.append("action", params.action);
  if (params.resource) queryParams.append("resource", params.resource);
  if (params.search) queryParams.append("search", params.search);
  if (params.fromDate) queryParams.append("fromDate", params.fromDate);
  if (params.toDate) queryParams.append("toDate", params.toDate);

  return apiFetch(`/admin/audit-logs?${queryParams.toString()}`);
};

const exportLogs = async (format: "csv" | "json", filters: any) => {
  const queryParams = new URLSearchParams();
  queryParams.append("format", format);
  if (filters.action) queryParams.append("action", filters.action);
  if (filters.resource) queryParams.append("resource", filters.resource);
  if (filters.fromDate) queryParams.append("fromDate", filters.fromDate);
  if (filters.toDate) queryParams.append("toDate", filters.toDate);

  const token =
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");
  const prefix = (process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/v1").replace(/\/+$/, "");

  const response = await fetch(
    `${base}${prefix}/admin/audit-logs/export?${queryParams.toString()}`,
    { headers }
  );

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `audit-logs-${Date.now()}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// Helper functions
const getActionBadge = (action: AuditAction) => {
  const configs: Record<AuditAction, { color: string; label: string }> = {
    CREATE: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Create" },
    UPDATE: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Update" },
    DELETE: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Delete" },
    LOGIN: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", label: "Login" },
    LOGOUT: { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", label: "Logout" },
    VERIFY: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Verify" },
    REJECT: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Reject" },
    BOOK: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Book" },
    CANCEL: { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", label: "Cancel" },
    PAYMENT: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Payment" },
    ESCROW_LOCKED: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Escrow Locked" },
    ESCROW_RELEASED: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Escrow Released" },
    UPLOAD: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Upload" },
    DOWNLOAD: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", label: "Download" },
    SHARE: { color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", label: "Share" },
  };

  const config = configs[action];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const getResourceBadge = (resource: AuditResource) => {
  const configs: Record<AuditResource, { color: string; label: string }> = {
    USER: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "User" },
    EXPERT: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Expert" },
    BOOKING: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", label: "Booking" },
    SERVICE: { color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", label: "Service" },
    REVIEW: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Review" },
    VERIFICATION: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Verification" },
    PAYMENT: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Payment" },
    DOCUMENT: { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", label: "Document" },
    CONVERSATION: { color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400", label: "Conversation" },
    MESSAGE: { color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400", label: "Message" },
  };

  const config = configs[resource];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMM dd, yyyy HH:mm");
  } catch {
    return dateString;
  }
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<AuditAction | "ALL">("ALL");
  const [resourceFilter, setResourceFilter] = useState<AuditResource | "ALL">("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateFromDraft, setDateFromDraft] = useState("");
  const [dateToDraft, setDateToDraft] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch stats
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-audit-stats"],
    queryFn: fetchStats,
  });

  // Fetch logs
  const { data: logsData, isLoading: loadingLogs, error } = useQuery({
    queryKey: ["admin-audit-logs", page, searchQuery, actionFilter, resourceFilter, fromDate, toDate],
    queryFn: () =>
      fetchLogs({
        page,
        limit: 20,
        search: searchQuery || undefined,
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        resource: resourceFilter !== "ALL" ? resourceFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      }),
  });

  const logs = logsData?.data?.logs ?? [];
  const pagination = logsData?.data?.pagination;
  const stats = statsData?.data;

  const handleExport = async (format: "csv" | "json") => {
    setExporting(true);
    try {
      await exportLogs(format, {
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        resource: resourceFilter !== "ALL" ? resourceFilter : undefined,
        fromDate,
        toDate,
      });
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  if (loadingStats || loadingLogs) {
    return (
      <div className="flex items-center justify-center p-6 lg:p-8" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6 lg:p-8" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load audit logs</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Audit Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">System activity tracking and monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport("csv")}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={() => handleExport("json")}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
          >
            <Download size={16} />
            Export JSON
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <FileText size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalLogs.toLocaleString()}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Total Logs</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/10 text-green-600">
              <Activity size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.byPeriod.today}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Today</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
              <Calendar size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.byPeriod.thisWeek}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">This Week</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/10 text-purple-600">
              <Database size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.byPeriod.thisMonth}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">This Month</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/10 text-red-600">
              <AlertTriangle size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.recentCritical}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Critical (7d)</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-4 shadow-md">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              className="flex-1 border-0 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 dark:text-gray-100"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-gray-800 dark:text-gray-100"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value as typeof actionFilter);
              setPage(1);
            }}
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="VERIFY">Verify</option>
            <option value="REJECT">Reject</option>
          </select>

          <select
            className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-gray-800 dark:text-gray-100"
            value={resourceFilter}
            onChange={(e) => {
              setResourceFilter(e.target.value as typeof resourceFilter);
              setPage(1);
            }}
          >
            <option value="ALL">All Resources</option>
            <option value="USER">User</option>
            <option value="EXPERT">Expert</option>
            <option value="BOOKING">Booking</option>
            <option value="PAYMENT">Payment</option>
            <option value="DOCUMENT">Document</option>
          </select>

          <div className="flex items-center gap-1">
            <input
              type="date"
              className="flex-1 rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-gray-800 dark:text-gray-100"
              value={dateFromDraft}
              onChange={(e) => setDateFromDraft(e.target.value)}
              placeholder="From date"
            />
            <span className="text-gray-400">–</span>
            <input
              type="date"
              className="flex-1 rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-gray-800 dark:text-gray-100"
              value={dateToDraft}
              onChange={(e) => setDateToDraft(e.target.value)}
              placeholder="To date"
            />
            <button
              onClick={() => {
                setFromDate(dateFromDraft);
                setToDate(dateToDraft);
                setPage(1);
              }}
              className="rounded-lg bg-brand-blue px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-blue/90"
            >
              Apply
            </button>
            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setDateFromDraft("");
                  setDateToDraft("");
                  setPage(1);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-border/10 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/10">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={48} className="text-gray-300 dark:text-gray-600" />
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No audit logs found</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-brand-canvas dark:hover:bg-gray-800">
                    <td className="px-6 py-4">
                      <span className="text-gray-700 dark:text-gray-300">{formatDate(log.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {log.actor ? (
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{log.actor.fullName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{log.actor.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getActionBadge(log.action)}</td>
                    <td className="px-6 py-4">{getResourceBadge(log.resource)}</td>
                    <td className="px-6 py-4">
                      <p className="max-w-xs truncate text-gray-700 dark:text-gray-300">
                        {log.description || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700 dark:text-gray-300">{log.ipAddress || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(log)}
                        className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-brand-border/10 px-6 py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total.toLocaleString()} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                className="rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
        </div>
      )}

      {/* Retention Info */}
      {stats && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Database size={14} />
          <span>
            Logs retained for <strong>{stats.retentionDays} days</strong>
            {stats.oldestLogDate && (
              <>
                {" · "}Oldest log: {format(new Date(stats.oldestLogDate), "MMM d, yyyy")}
              </>
            )}
            {" · "}Auto-cleanup runs daily at 04:00
          </span>
        </div>
      )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Audit Log Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Log ID</label>
                  <p className="mt-1 text-sm font-mono text-gray-900 dark:text-gray-100">{selectedLog.id}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Timestamp</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formatDate(selectedLog.createdAt)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Action</label>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Resource</label>
                  <div className="mt-1">{getResourceBadge(selectedLog.resource)}</div>
                </div>
              </div>

              {selectedLog.actor && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Actor</label>
                  <div className="mt-1 rounded-lg border border-brand-border bg-gray-50 p-3 dark:bg-gray-800">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedLog.actor.fullName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedLog.actor.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Role: {selectedLog.actor.role}</p>
                  </div>
                </div>
              )}

              {selectedLog.resourceId && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Resource ID</label>
                  <p className="mt-1 text-sm font-mono text-gray-900 dark:text-gray-100">{selectedLog.resourceId}</p>
                </div>
              )}

              {selectedLog.description && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Description</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedLog.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedLog.ipAddress && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">IP Address</label>
                    <p className="mt-1 text-sm font-mono text-gray-900 dark:text-gray-100">{selectedLog.ipAddress}</p>
                  </div>
                )}
                {selectedLog.userAgent && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">User Agent</label>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{selectedLog.userAgent}</p>
                  </div>
                )}
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Metadata</label>
                  <pre className="mt-1 overflow-auto rounded-lg border border-brand-border bg-gray-50 p-3 text-xs text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-blue/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
