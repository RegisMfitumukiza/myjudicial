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
import { useTranslations, useLocale } from "next-intl";

import { PageHeader } from "@/shared/components/dashboard/page-header";
import { StatCard } from "@/shared/components/dashboard/stat-card";
import { StatusBadge } from "@/shared/components/dashboard/status-badge";
import { EmptyState } from "@/shared/components/dashboard/empty-state";
import { ErrorState } from "@/shared/components/dashboard/error-state";
import { LoadingSpinner } from "@/shared/components/dashboard/loading";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card } from "@/shared/components/ui/card";
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

function formatSpecialty(s: LegalSpecialty) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

// ── Page Component ──

export default function ExpertsPage() {
  const t = useTranslations("admin.experts");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();

  const tabs: { id: TabId; label: string; description: string }[] = useMemo(() => [
    { id: "all",       label: t("allExperts"),    description: t("allExpertsDesc") },
    { id: "pending",   label: t("pendingReview"), description: t("pendingReviewDesc") },
    { id: "verified",  label: t("verified"),      description: t("verifiedDesc") },
    { id: "suspended", label: t("suspended"),     description: t("suspendedDesc") },
  ], [t]);

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window !== "undefined") {
      const tab = new URLSearchParams(window.location.search).get("tab") as TabId | null;
      if (tab && (tab === "all" || tab === "pending" || tab === "verified" || tab === "suspended")) return tab;
    }
    return "all";
  });
  const [page, setPage]               = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedExpert, setSelectedExpert]   = useState<Expert | null>(null);
  const [suspendReason, setSuspendReason]     = useState("");
  const [showSuspendModal, setShowSuspendModal] = useState(false);

  const expertStatusLabel = (
    expertStatus: "DRAFT" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "SUSPENDED" | null,
  ): string => {
    switch (expertStatus) {
      case "VERIFIED":             return t("verified");
      case "PENDING_VERIFICATION": return t("pendingReview");
      case "REJECTED":             return t("reject");
      case "SUSPENDED":            return t("suspended");
      default:                     return "Draft";
    }
  };

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
      toast.success(t("expertSuspended"));
    },
    onError: () => toast.error(t("actionFailed")),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateExpert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experts"] });
      toast.success(t("expertActivated"));
    },
    onError: () => toast.error(t("actionFailed")),
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
  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  // ── Render ──

  if (isLoading && !data) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <PageHeader title={t("title")} />
        <ErrorState
          title={t("failedToLoad")}
          message={(error as Error).message}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      {/* Header */}
      <PageHeader
        title={t("title")}
        description={currentTab.description}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label={t("totalExperts")}
          value={stats.total.toLocaleString()}
          icon={Users}
        />
        <StatCard
          label={t("pendingReview")}
          value={stats.pending.toLocaleString()}
          icon={Clock}
        />
        <StatCard
          label={t("verified")}
          value={stats.verified.toLocaleString()}
          icon={BadgeCheck}
        />
        <StatCard
          label={t("suspended")}
          value={stats.suspended.toLocaleString()}
          icon={Ban}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted p-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 shrink-0 whitespace-nowrap ${
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
          placeholder={t("search")}
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
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("expert")}</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("status")}</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("specialties")}</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("rating")}</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("joined")}</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("actions")}</th>
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
                      title={t("noExperts")}
                      description=""
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
                    {new Date(expert.createdAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
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
                          <CheckCheck size={13} /> {t("activate")}
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="xs"
                          onClick={() => { setSelectedExpert(expert); setShowSuspendModal(true); }}
                          disabled={suspendMutation.isPending}
                          id={`btn-suspend-${expert.id}`}
                        >
                          <Ban size={13} /> {t("suspend")}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="xs"
                        asChild
                        id={`btn-view-${expert.id}`}
                      >
                        <Link href={`/admin/dashboard/experts/${expert.id}`}>
                          <Eye size={13} /> {t("view")}
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
              {pagination.page} / {pagination.totalPages} ({pagination.total})
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
              >
                →
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
            <DialogTitle>{t("suspendExpert")}</DialogTitle>
            <DialogDescription>
              {t("suspendConfirm", { name: selectedExpert?.fullName ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t("reason")} <span className="text-destructive">*</span>
            </label>
            <textarea
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 outline-none"
              rows={4}
              placeholder={t("reasonPlaceholder")}
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
              {t("confirmSuspension")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
