"use client";

import { useState, useMemo, useCallback } from "react";
import {
  CheckCircle,
  Clock,
  XCircle,
  Star,
  Loader2,
  Search,
  AlertCircle,
  Ban,
  CheckCheck,
  Eye,
  BadgeCheck,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/routing";

// ── Types ──

type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
type LegalSpecialty =
  | "FAMILY_LAW" | "COMMERCIAL_LAW" | "EMPLOYMENT_LAW" | "LAND_LAW"
  | "CRIMINAL_LAW" | "TAX_LAW" | "IMMIGRATION_LAW" | "CORPORATE_LAW"
  | "CONTRACT_LAW" | "INTELLECTUAL_PROPERTY" | "OTHER";
type TabId = "all" | "pending" | "verified" | "suspended";

interface Expert {
  id: string;
  fullName: string;
  email: string;
  accountStatus: AccountStatus;
  createdAt: string;
  verified: boolean;
  expertStatus: "DRAFT" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "SUSPENDED" | null;
  barNumber: string | null;
  specialties: LegalSpecialty[];
  avgRating: number | null;
  totalBookings: number;
  credentialsExpiry: string | null;
  yearsOfExperience: number | null;
  profileImage: string | null;
  officeAddress: string | null;
  verificationId: string | null;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | null;
  rejectionReason: string | null;
}

interface BackendResponse {
  success: boolean;
  message: string;
  data: Expert[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ── Constants ──

const TABS: { id: TabId; label: string; description: string }[] = [
  { id: "all",       label: "All Experts",    description: "All registered legal experts" },
  { id: "pending",   label: "Pending Review", description: "Awaiting credential verification" },
  { id: "verified",  label: "Verified",       description: "Approved and active experts" },
  { id: "suspended", label: "Suspended",      description: "Temporarily suspended accounts" },
];

// ── API functions ──

async function fetchExperts(params: {
  page?: number;
  limit?: number;
  status?: AccountStatus;
  search?: string;
  verified?: boolean;
  verificationStatus?: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
}): Promise<{ experts: Expert[]; pagination: BackendResponse["meta"] }> {
  const q = new URLSearchParams();
  if (params.page) q.append("page", params.page.toString());
  if (params.limit) q.append("limit", params.limit.toString());
  if (params.status) q.append("status", params.status);
  if (params.search) q.append("search", params.search);
  if (params.verified !== undefined) q.append("verified", params.verified.toString());
  if (params.verificationStatus) q.append("verificationStatus", params.verificationStatus);
  q.append("sortBy", "createdAt");
  q.append("sortOrder", "desc");

  const res: BackendResponse = await apiFetch(`/admin/experts?${q.toString()}`);
  return { experts: res.data, pagination: res.meta };
}

async function fetchStats(): Promise<{ total: number; pending: number; verified: number; suspended: number }> {
  const [base, pendingRes, verifiedRes, suspendedRes] = await Promise.all([
    apiFetch<BackendResponse>(`/admin/experts?limit=1`),
    apiFetch<BackendResponse>(`/admin/experts?verificationStatus=PENDING&limit=1`),
    apiFetch<BackendResponse>(`/admin/experts?verified=true&limit=1`),
    apiFetch<BackendResponse>(`/admin/experts?status=SUSPENDED&limit=1`),
  ]);
  return {
    total:     (base as any).meta?.total ?? 0,
    pending:   (pendingRes as any).meta?.total ?? 0,
    verified:  (verifiedRes as any).meta?.total ?? 0,
    suspended: (suspendedRes as any).meta?.total ?? 0,
  };
}

async function suspendExpert(id: string, reason: string) {
  return apiFetch(`/admin/experts/${id}/suspend`, {
    method: "PATCH",
    body: { reason, notifyExpert: true },
  });
}

async function activateExpert(id: string) {
  return apiFetch(`/admin/experts/${id}/activate`, { method: "PATCH" });
}

// ── Helpers ──

function StatusBadge({ expertStatus }: {
  expertStatus: "DRAFT" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "SUSPENDED" | null;
}) {
  if (expertStatus === "SUSPENDED") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <Ban size={11} /> Suspended
    </span>
  );
  if (expertStatus === "VERIFIED") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
      <BadgeCheck size={11} /> Verified
    </span>
  );
  if (expertStatus === "PENDING_VERIFICATION") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      <Clock size={11} /> Pending Review
    </span>
  );
  if (expertStatus === "REJECTED") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <XCircle size={11} /> Rejected
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-400">
      <Clock size={11} /> Draft
    </span>
  );
}

function formatSpecialty(s: LegalSpecialty) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

// ── Page Component ──

export default function ExpertsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window !== "undefined") {
      const tab = new URLSearchParams(window.location.search).get("tab") as TabId | null;
      if (tab && TABS.some((t) => t.id === tab)) return tab;
    }
    return "all";
  });
  const [page, setPage]               = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedExpert, setSelectedExpert]   = useState<Expert | null>(null);
  const [suspendReason, setSuspendReason]     = useState("");
  const [showSuspendModal, setShowSuspendModal] = useState(false);

  const apiParams = useMemo(() => {
    const p: {
      page: number;
      limit: number;
      search?: string;
      status?: AccountStatus;
      verified?: boolean;
      verificationStatus?: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
    } = { page, limit: 20 };
    if (searchQuery) p.search = searchQuery;
    switch (activeTab) {
      case "pending":   p.verificationStatus = "PENDING"; break;
      case "verified":  p.verified = true; break;
      case "suspended": p.status = "SUSPENDED"; break;
    }
    return p;
  }, [activeTab, page, searchQuery]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-experts", apiParams],
    queryFn: () => fetchExperts(apiParams),
    placeholderData: (prev) => prev,
  });

  const { data: statsData } = useQuery({
    queryKey: ["admin-experts-stats"],
    queryFn: fetchStats,
    staleTime: 30_000,
  });

  // ── Mutations ──

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => suspendExpert(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experts"] });
      setShowSuspendModal(false);
      setSuspendReason("");
      setSelectedExpert(null);
      toast.success("Expert suspended");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateExpert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experts"] });
      toast.success("Expert activated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Event handlers ──

  const handleTabChange = useCallback(
    (tab: TabId) => {
      setActiveTab(tab);
      setPage(1);
      router.replace(`/admin/dashboard/experts${tab !== "all" ? `?tab=${tab}` : ""}`, { scroll: false });
    },
    [router],
  );

  const experts    = data?.experts ?? [];
  const pagination = data?.pagination;
  const stats      = statsData ?? { total: 0, pending: 0, verified: 0, suspended: 0 };
  const currentTab = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  // ── Render ──

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center p-6 lg:p-8" style={{ minHeight: "60vh" }}>
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center p-6 lg:p-8" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load experts</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Expert Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{currentTab.description}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Experts",       value: stats.total,     color: "text-slate-700 dark:text-white"  },
          { label: "Pending Review",      value: stats.pending,   color: "text-amber-600 dark:text-amber-400" },
          { label: "Verified",            value: stats.verified,  color: "text-green-600 dark:text-green-400" },
          { label: "Suspended",           value: stats.suspended, color: "text-red-600 dark:text-red-400"   },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-brand-border bg-white p-4 dark:bg-gray-900">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className={`mt-1 text-lg font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-brand-border/20 bg-white p-1 dark:bg-gray-900">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => handleTabChange(tab.id)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-brand-dark text-white shadow-sm dark:bg-white dark:text-black"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          className="w-full rounded-lg border border-brand-border bg-white py-2 pl-9 pr-4 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-sm dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-border/20 bg-gray-50 dark:bg-gray-800">
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Expert</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Specialties</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Rating</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Joined</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/10">
            {isLoading && (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-blue" />
                </td>
              </tr>
            )}
            {!isLoading && experts.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <p className="text-sm text-gray-400">No experts found</p>
                </td>
              </tr>
            )}
            {experts.map((expert) => (
              <tr key={expert.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                {/* Expert */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-sm font-bold text-brand-blue">
                      {expert.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{expert.fullName}</p>
                      <p className="text-xs text-gray-500">{expert.email}</p>
                      {expert.barNumber && (
                        <p className="text-xs font-mono text-slate-400">Bar #{expert.barNumber}</p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <StatusBadge expertStatus={expert.expertStatus} />
                </td>

                {/* Specialties */}
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {expert.specialties.slice(0, 2).map((s) => (
                      <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {formatSpecialty(s)}
                      </span>
                    ))}
                    {expert.specialties.length > 2 && (
                      <span className="text-[11px] text-gray-400">+{expert.specialties.length - 2}</span>
                    )}
                  </div>
                </td>

                {/* Rating */}
                <td className="px-6 py-4">
                  {expert.avgRating != null ? (
                    <span className="flex items-center gap-1 text-sm">
                      <Star size={12} className="text-amber-500" />
                      <span className="font-medium text-gray-900 dark:text-white">{expert.avgRating.toFixed(1)}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>

                {/* Joined */}
                <td className="px-6 py-4 text-xs text-gray-500">
                  {new Date(expert.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>

                {/* Actions — ONLY View + Suspend/Activate */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {expert.accountStatus === "SUSPENDED" ? (
                      <button
                        onClick={() => activateMutation.mutate(expert.id)}
                        disabled={activateMutation.isPending}
                        id={`btn-activate-${expert.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCheck size={13} /> Activate
                      </button>
                    ) : (
                      <button
                        onClick={() => { setSelectedExpert(expert); setShowSuspendModal(true); }}
                        disabled={suspendMutation.isPending}
                        id={`btn-suspend-${expert.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        <Ban size={13} /> Suspend
                      </button>
                    )}
                    <Link
                      href={`/admin/dashboard/experts/${expert.id}`}
                      id={`btn-view-${expert.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <Eye size={13} /> View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-brand-border/10 px-6 py-4">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page === 1}
                className="rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Previous
              </button>
              <button onClick={() => setPage(page + 1)} disabled={page === pagination.totalPages}
                className="rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Suspend Modal ── */}
      {showSuspendModal && selectedExpert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Suspend Expert</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              You are about to suspend <span className="font-medium text-gray-900 dark:text-white">{selectedExpert.fullName}</span>.
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-gray-800 dark:text-gray-100"
                rows={4}
                placeholder="Provide a detailed reason (min 10 characters)…"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => { setShowSuspendModal(false); setSuspendReason(""); setSelectedExpert(null); }}
                className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!selectedExpert || !suspendReason.trim()) return;
                  suspendMutation.mutate({ id: selectedExpert.id, reason: suspendReason });
                }}
                disabled={suspendReason.trim().length < 10 || suspendMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {suspendMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
