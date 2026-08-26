"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Users,
  Clock,
  BadgeCheck,
  Search,
  Ban,
  CheckCheck,
  Eye,
  Star,
  Inbox,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/routing";

import { PageHeader } from "@/shared/components/dashboard/page-header";
import { StatCard } from "@/shared/components/dashboard/stat-card";
import { StatusBadge } from "@/shared/components/dashboard/status-badge";
import { EmptyState } from "@/shared/components/dashboard/empty-state";
import { ErrorState } from "@/shared/components/dashboard/error-state";
import { LoadingSpinner } from "@/shared/components/dashboard/loading";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";

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

function expertStatusTone(
  expertStatus: "DRAFT" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "SUSPENDED" | null,
): "neutral" | "pending" | "success" | "destructive" {
  switch (expertStatus) {
    case "VERIFIED":             return "success";
    case "PENDING_VERIFICATION": return "pending";
    case "REJECTED":
    case "SUSPENDED":            return "destructive";
    default:                     return "neutral";
  }
}

function expertStatusLabel(
  expertStatus: "DRAFT" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "SUSPENDED" | null,
): string {
  switch (expertStatus) {
    case "VERIFIED":             return "Verified";
    case "PENDING_VERIFICATION": return "Pending Review";
    case "REJECTED":             return "Rejected";
    case "SUSPENDED":            return "Suspended";
    default:                     return "Draft";
  }
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
      <div className="space-y-6 p-6 lg:p-8">
        <LoadingSpinner label="Loading experts..." />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <PageHeader title="Expert Management" />
        <ErrorState
          title="Failed to load experts"
          message={(error as Error).message}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <PageHeader
        title="Expert Management"
        description={currentTab.description}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Experts"
          value={stats.total.toLocaleString()}
          icon={Users}
        />
        <StatCard
          label="Pending Review"
          value={stats.pending.toLocaleString()}
          icon={Clock}
        />
        <StatCard
          label="Verified"
          value={stats.verified.toLocaleString()}
          icon={BadgeCheck}
        />
        <StatCard
          label="Suspended"
          value={stats.suspended.toLocaleString()}
          icon={Ban}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted p-0.5">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 ${
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expert</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Specialties</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rating</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Joined</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              )}
              {!isLoading && experts.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={Inbox}
                      title="No experts found"
                      description="No experts match your current filters."
                    />
                  </td>
                </tr>
              )}
              {experts.map((expert) => (
                <tr key={expert.id} className="hover:bg-muted/50 transition-colors">
                  {/* Expert */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {expert.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{expert.fullName}</p>
                        <p className="text-xs text-muted-foreground">{expert.email}</p>
                        {expert.barNumber && (
                          <p className="text-xs font-mono text-muted-foreground">Bar #{expert.barNumber}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge tone={expertStatusTone(expert.expertStatus)}>
                      {expertStatusLabel(expert.expertStatus)}
                    </StatusBadge>
                  </td>

                  {/* Specialties */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {expert.specialties.slice(0, 2).map((s) => (
                        <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          {formatSpecialty(s)}
                        </span>
                      ))}
                      {expert.specialties.length > 2 && (
                        <span className="text-[11px] text-muted-foreground">+{expert.specialties.length - 2}</span>
                      )}
                    </div>
                  </td>

                  {/* Rating */}
                  <td className="px-6 py-4">
                    {expert.avgRating != null ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Star size={12} className="text-yellow-500" />
                        <span className="font-medium text-foreground">{expert.avgRating.toFixed(1)}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">&mdash;</span>
                    )}
                  </td>

                  {/* Joined */}
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {new Date(expert.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {expert.accountStatus === "SUSPENDED" ? (
                        <Button
                          variant="default"
                          size="xs"
                          onClick={() => activateMutation.mutate(expert.id)}
                          disabled={activateMutation.isPending}
                          id={`btn-activate-${expert.id}`}
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          <CheckCheck size={13} /> Activate
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="xs"
                          onClick={() => { setSelectedExpert(expert); setShowSuspendModal(true); }}
                          disabled={suspendMutation.isPending}
                          id={`btn-suspend-${expert.id}`}
                        >
                          <Ban size={13} /> Suspend
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="xs"
                        asChild
                        id={`btn-view-${expert.id}`}
                      >
                        <Link href={`/admin/dashboard/experts/${expert.id}`}>
                          <Eye size={13} /> View
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Suspend Modal */}
      <Dialog open={showSuspendModal} onOpenChange={(open) => {
        if (!open) {
          setShowSuspendModal(false);
          setSuspendReason("");
          setSelectedExpert(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Expert</DialogTitle>
            <DialogDescription>
              You are about to suspend <span className="font-medium text-foreground">{selectedExpert?.fullName}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Reason <span className="text-destructive">*</span>
            </label>
            <textarea
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 outline-none"
              rows={4}
              placeholder="Provide a detailed reason (min 10 characters)..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowSuspendModal(false); setSuspendReason(""); setSelectedExpert(null); }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!selectedExpert || !suspendReason.trim()) return;
                suspendMutation.mutate({ id: selectedExpert.id, reason: suspendReason });
              }}
              disabled={suspendReason.trim().length < 10 || suspendMutation.isPending}
            >
              Confirm Suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
