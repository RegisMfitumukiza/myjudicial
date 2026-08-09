"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  Ban,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Calendar,
  Mail,
  Eye,
  TrendingUp,
  Users,
  Shield,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { format, formatDistanceToNow } from "date-fns";

// Types
interface ComplianceStats {
  totalExperts: number;
  verifiedExperts: number;
  expiringCount: number;
  expiredCount: number;
  suspendedCount: number;
  noExpirySetCount: number;
  complianceRate: number;
}

interface Expert {
  id: string;
  expertId: string;
  fullName: string;
  email: string;
  phone: string | null;
  barNumber: string | null;
  credentialsExpiry: string | null;
  daysUntilExpiry?: number | null;
  daysOverdue?: number | null;
  accountStatus?: string;
  specialties: string[];
  officeAddress: string | null;
  suspendedAt?: string;
}

interface ExpertsResponse {
  data: Expert[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API functions
const fetchStats = async (): Promise<{ data: ComplianceStats }> => {
  return apiFetch("/admin/compliance/overview");
};

const fetchExpiringExperts = async (page: number, limit: number, daysThreshold: number): Promise<ExpertsResponse> => {
  return apiFetch(`/admin/compliance/expiring?page=${page}&limit=${limit}&daysThreshold=${daysThreshold}`);
};

const fetchExpiredExperts = async (page: number, limit: number): Promise<ExpertsResponse> => {
  return apiFetch(`/admin/compliance/expired?page=${page}&limit=${limit}`);
};

const fetchSuspendedExperts = async (page: number, limit: number): Promise<ExpertsResponse> => {
  return apiFetch(`/admin/compliance/suspended?page=${page}&limit=${limit}`);
};

const sendWarningEmail = async (expertId: string) => {
  return apiFetch(`/admin/compliance/${expertId}/send-warning`, { method: "POST" });
};

// Helper functions
const formatDate = (dateString: string | null) => {
  if (!dateString) return "Not set";
  try {
    return format(new Date(dateString), "MMM dd, yyyy");
  } catch {
    return dateString;
  }
};

const getUrgencyColor = (days: number | null | undefined) => {
  if (days === null || days === undefined) return "text-gray-500";
  if (days <= 7) return "text-red-600 dark:text-red-400";
  if (days <= 15) return "text-amber-600 dark:text-amber-400";
  return "text-gray-600 dark:text-gray-400";
};

export default function CompliancePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"expiring" | "expired" | "suspended">("expiring");
  const [expiringPage, setExpiringPage] = useState(1);
  const [expiredPage, setExpiredPage] = useState(1);
  const [suspendedPage, setSuspendedPage] = useState(1);
  const [daysThreshold, setDaysThreshold] = useState(30);

  // Fetch stats
  const { data: statsData, isLoading: loadingStats, isError: statsError } = useQuery({
    queryKey: ["admin-compliance-stats"],
    queryFn: fetchStats,
  });

  // Fetch expiring experts
  const { data: expiringData, isLoading: loadingExpiring, isError: expiringError } = useQuery({
    queryKey: ["admin-compliance-expiring", expiringPage, daysThreshold],
    queryFn: () => fetchExpiringExperts(expiringPage, 20, daysThreshold),
    enabled: activeTab === "expiring",
  });

  // Fetch expired experts
  const { data: expiredData, isLoading: loadingExpired, isError: expiredError } = useQuery({
    queryKey: ["admin-compliance-expired", expiredPage],
    queryFn: () => fetchExpiredExperts(expiredPage, 20),
    enabled: activeTab === "expired",
  });

  // Fetch suspended experts
  const { data: suspendedData, isLoading: loadingSuspended, isError: suspendedError } = useQuery({
    queryKey: ["admin-compliance-suspended", suspendedPage],
    queryFn: () => fetchSuspendedExperts(suspendedPage, 20),
    enabled: activeTab === "suspended",
  });

  // Send warning mutation
  const sendWarningMutation = useMutation({
    mutationFn: (expertId: string) => sendWarningEmail(expertId),
    onSuccess: () => {
      alert("Warning email sent successfully");
    },
  });

  const stats = statsData?.data;

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center p-6 lg:p-8" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Failed to load compliance data</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Unable to fetch compliance overview. Please try again later.</p>
      </div>
    );
  }

  const activeData = activeTab === "expiring" ? expiringData : activeTab === "expired" ? expiredData : suspendedData;
  const isLoading = activeTab === "expiring" ? loadingExpiring : activeTab === "expired" ? loadingExpired : loadingSuspended;
  const experts = activeData?.data ?? [];
  const pagination = activeData?.pagination;

  const handlePageChange = (newPage: number) => {
    if (activeTab === "expiring") setExpiringPage(newPage);
    else if (activeTab === "expired") setExpiredPage(newPage);
    else setSuspendedPage(newPage);
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Compliance Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Monitor expert credentials and compliance status</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <Users size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalExperts}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Total Experts</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/10 text-green-600">
              <CheckCircle size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.verifiedExperts}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Verified</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600/10 text-amber-600">
              <AlertTriangle size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.expiringCount}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Expiring Soon</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/10 text-red-600">
              <XCircle size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.expiredCount}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Expired</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-600/10 text-gray-600">
              <Ban size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.suspendedCount}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Suspended</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
              <TrendingUp size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.complianceRate.toFixed(1)}%</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Compliance Rate</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-border/20">
        <button
          onClick={() => setActiveTab("expiring")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "expiring"
              ? "border-b-2 border-brand-blue text-brand-blue"
              : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            Expiring Soon ({stats?.expiringCount ?? 0})
          </div>
        </button>
        <button
          onClick={() => setActiveTab("expired")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "expired"
              ? "border-b-2 border-brand-blue text-brand-blue"
              : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <XCircle size={16} />
            Expired ({stats?.expiredCount ?? 0})
          </div>
        </button>
        <button
          onClick={() => setActiveTab("suspended")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "suspended"
              ? "border-b-2 border-brand-blue text-brand-blue"
              : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <Ban size={16} />
            Suspended ({stats?.suspendedCount ?? 0})
          </div>
        </button>
      </div>

      {/* Threshold Filter (only for expiring tab) */}
      {activeTab === "expiring" && (
        <div className="flex items-center gap-3 rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-4 shadow-md">
          <Clock size={16} className="text-gray-400" />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Show expiring within:</label>
          <select
            className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-gray-800 dark:text-gray-100"
            value={daysThreshold}
            onChange={(e) => {
              setDaysThreshold(Number(e.target.value));
              setExpiringPage(1);
            }}
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
          </select>
        </div>
      )}

      {/* Tab Error */}
      {(activeTab === "expiring" && expiringError) ||
       (activeTab === "expired" && expiredError) ||
       (activeTab === "suspended" && suspendedError) ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 py-12 shadow-md">
          <AlertCircle className="mb-3 h-8 w-8 text-gray-400" />
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Failed to load {activeTab} experts</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Please try adjusting your filters or try again later</p>
        </div>
      ) : (
      /* Experts Table */
      <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 shadow-md">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-border/10 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="px-6 py-4">Expert</th>
                    <th className="px-6 py-4">Bar Number</th>
                    <th className="px-6 py-4">
                      {activeTab === "suspended" ? "Suspended" : "Credentials Expiry"}
                    </th>
                    <th className="px-6 py-4">
                      {activeTab === "expiring" && "Days Until Expiry"}
                      {activeTab === "expired" && "Days Overdue"}
                      {activeTab === "suspended" && "Status"}
                    </th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/10">
                  {experts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activeTab === "expiring" && "No experts with expiring credentials"}
                          {activeTab === "expired" && "No experts with expired credentials"}
                          {activeTab === "suspended" && "No suspended experts"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    experts.map((expert) => (
                      <tr key={expert.id} className="transition-colors hover:bg-brand-canvas dark:hover:bg-gray-800">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                              {expert.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{expert.fullName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{expert.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{expert.barNumber || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4">
                          {activeTab === "suspended" ? (
                            <span className="text-gray-700 dark:text-gray-300">
                              {expert.suspendedAt ? formatDistanceToNow(new Date(expert.suspendedAt), { addSuffix: true }) : "N/A"}
                            </span>
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300">{formatDate(expert.credentialsExpiry)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {activeTab === "expiring" && (
                            <span className={`font-semibold ${getUrgencyColor(expert.daysUntilExpiry)}`}>
                              {expert.daysUntilExpiry !== null && expert.daysUntilExpiry !== undefined
                                ? `${expert.daysUntilExpiry} days`
                                : "N/A"}
                            </span>
                          )}
                          {activeTab === "expired" && (
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              {expert.daysOverdue !== null && expert.daysOverdue !== undefined
                                ? `${expert.daysOverdue} days`
                                : "N/A"}
                            </span>
                          )}
                          {activeTab === "suspended" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              <Ban size={12} />
                              Suspended
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {(activeTab === "expiring" || activeTab === "expired") && (
                              <button
                                onClick={() => sendWarningMutation.mutate(expert.id)}
                                disabled={sendWarningMutation.isPending}
                                className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
                              >
                                <Mail size={14} />
                                Send Warning
                              </button>
                            )}
                            <button className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                              <Eye size={14} />
                            </button>
                          </div>
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
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      )}
    </div>
  );
}
