"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  Ban,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  Eye,
  TrendingUp,
  Users,
  Search,
  X,
  ShieldCheck,
  Sparkles,
  CalendarDays,
  FileCheck2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { ExpertAvatar } from "@/shared/components/expert-avatar";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/shared/components/ui/sheet";
import {
  PageHeader,
  StatCard,
  EmptyState,
  LoadingSpinner,
  ErrorState,
  StatusBadge,
} from "@/shared/components/dashboard";

interface ComplianceStats {
  totalExperts: number;
  verifiedExperts: number;
  expiringCount: number;
  expiredCount: number;
  suspendedCount: number;
  noExpirySetCount: number;
  compliantCount: number;
  complianceRate: number;
}

interface Expert {
  id: string;
  expertId: string;
  fullName: string;
  email: string;
  phone: string | null;
  profileImageUrl?: string | null;
  barNumber: string | null;
  credentialsExpiry: string | null;
  daysUntilExpiry?: number | null;
  daysOverdue?: number | null;
  accountStatus?: string;
  specialties: string[];
  officeAddress: string | null;
  suspendedAt?: string;
  isCompliant?: boolean;
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

// ── API Fetchers ─────────────────────────────────────────────────────────────

const fetchStats = async (): Promise<{ data: ComplianceStats }> => {
  return apiFetch("/admin/compliance/overview");
};

const fetchVerifiedExperts = async (page: number, limit: number, search?: string): Promise<ExpertsResponse> => {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search?.trim()) query.set("search", search.trim());
  return apiFetch(`/admin/compliance/verified?${query.toString()}`);
};

const fetchExpiringExperts = async (page: number, limit: number, daysThreshold: number, search?: string): Promise<ExpertsResponse> => {
  const query = new URLSearchParams({ page: String(page), limit: String(limit), daysThreshold: String(daysThreshold) });
  if (search?.trim()) query.set("search", search.trim());
  return apiFetch(`/admin/compliance/expiring?${query.toString()}`);
};

const fetchExpiredExperts = async (page: number, limit: number, search?: string): Promise<ExpertsResponse> => {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search?.trim()) query.set("search", search.trim());
  return apiFetch(`/admin/compliance/expired?${query.toString()}`);
};

const fetchSuspendedExperts = async (page: number, limit: number, search?: string): Promise<ExpertsResponse> => {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search?.trim()) query.set("search", search.trim());
  return apiFetch(`/admin/compliance/suspended?${query.toString()}`);
};

const sendWarningEmail = async (expertId: string) => {
  return apiFetch(`/admin/compliance/${expertId}/send-warning`, { method: "POST" });
};

const extendCredentials = async (expertUserId: string, newExpiryDate: string, reason: string) => {
  return apiFetch(`/admin/compliance/${expertUserId}/extend`, {
    method: "POST",
    body: { newExpiryDate, reason },
  });
};

const getUrgencyTone = (days: number | null | undefined): "destructive" | "warning" | "neutral" => {
  if (days === null || days === undefined) return "neutral";
  if (days <= 7) return "destructive";
  if (days <= 15) return "warning";
  return "neutral";
};

// ── Advocate Table Component ──────────────────────────────────────────────────

function ExpertTable({
  experts,
  pagination,
  isLoading,
  activeTab,
  sendWarningMutation,
  onOpenExtend,
  onSelectExpert,
  onPageChange,
  t,
  locale,
}: {
  experts: Expert[];
  pagination: ExpertsResponse["pagination"] | undefined;
  isLoading: boolean;
  activeTab: "compliant" | "expiring" | "expired" | "suspended";
  sendWarningMutation: { mutate: (id: string) => void; isPending: boolean };
  onOpenExtend: (expert: Expert) => void;
  onSelectExpert: (expert: Expert) => void;
  onPageChange: (page: number) => void;
  t: (key: string, values?: any) => string;
  locale: string;
}) {
  if (isLoading) {
    return <LoadingSpinner label={t("loading")} />;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t("notSet");
    try {
      return new Date(dateString).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getDaysLabel = (days: number | null | undefined): string => {
    if (days === null || days === undefined) return t("na");
    return `${days} ${locale === "fr" ? "jours" : locale === "rw" ? "iminsi" : "days"}`;
  };

  return (
    <>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3.5">{t("expert")}</th>
                <th className="px-5 py-3.5">{t("barNumber")}</th>
                <th className="px-5 py-3.5">
                  {activeTab === "suspended" ? t("suspended") : t("credentialsExpiry")}
                </th>
                <th className="px-5 py-3.5">
                  {activeTab === "compliant" && t("statusActive")}
                  {activeTab === "expiring" && t("daysUntilExpiry")}
                  {activeTab === "expired" && t("daysOverdue")}
                  {activeTab === "suspended" && "Status"}
                </th>
                <th className="px-5 py-3.5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {experts.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={activeTab === "suspended" ? Ban : Calendar}
                      title={
                        activeTab === "compliant"
                          ? t("noCompliant")
                          : activeTab === "expiring"
                          ? t("noExpiring")
                          : activeTab === "expired"
                          ? t("noExpired")
                          : t("noSuspended")
                      }
                    />
                  </td>
                </tr>
              ) : (
                experts.map((expert) => (
                  <tr
                    key={expert.id}
                    className="transition-colors hover:bg-muted/40 cursor-pointer"
                    onClick={() => onSelectExpert(expert)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <ExpertAvatar
                          src={expert.profileImageUrl}
                          name={expert.fullName}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{expert.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">{expert.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border">
                        {expert.barNumber || t("na")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {activeTab === "suspended" ? (
                        <span className="text-foreground">
                          {expert.suspendedAt ? formatDistanceToNow(new Date(expert.suspendedAt), { addSuffix: true }) : t("na")}
                        </span>
                      ) : (
                        <span className="text-foreground font-medium">{formatDate(expert.credentialsExpiry)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {activeTab === "compliant" && (
                        <StatusBadge tone={expert.credentialsExpiry ? "success" : "neutral"}>
                          <ShieldCheck size={12} />
                          {expert.daysUntilExpiry != null
                            ? `${expert.daysUntilExpiry} ${locale === "fr" ? "j restants" : locale === "rw" ? "iminsi isigaye" : "days left"}`
                            : t("compliant")}
                        </StatusBadge>
                      )}
                      {activeTab === "expiring" && (
                        <StatusBadge tone={getUrgencyTone(expert.daysUntilExpiry)}>
                          <Clock size={12} />
                          {getDaysLabel(expert.daysUntilExpiry)}
                        </StatusBadge>
                      )}
                      {activeTab === "expired" && (
                        <StatusBadge tone="destructive">
                          <XCircle size={12} />
                          {getDaysLabel(expert.daysOverdue)}
                        </StatusBadge>
                      )}
                      {activeTab === "suspended" && (
                        <StatusBadge tone="destructive">
                          <Ban size={12} />
                          {t("suspended")}
                        </StatusBadge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => onOpenExtend(expert)}
                        >
                          <CalendarDays size={13} className="text-primary" />
                          <span className="hidden sm:inline">{t("extendExpiry")}</span>
                        </Button>

                        {(activeTab === "expiring" || activeTab === "expired") && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-8 w-8"
                            onClick={() => sendWarningMutation.mutate(expert.expertId || expert.id)}
                            disabled={sendWarningMutation.isPending}
                            title={t("sendWarning")}
                          >
                            <Mail size={14} className="text-muted-foreground hover:text-foreground" />
                          </Button>
                        )}

                        <Button variant="ghost" size="icon-sm" className="h-8 w-8" asChild>
                          <Link href={`/admin/dashboard/experts/${expert.expertId || expert.id}`}>
                            <Eye size={14} />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <p className="text-xs text-muted-foreground">
            {pagination.page} / {pagination.totalPages} ({pagination.total})
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              ←
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              →
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Extend Expiry Modal Component ─────────────────────────────────────────────

function ExtendExpiryModal({
  isOpen,
  onClose,
  expert,
  onSuccess,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert | null;
  onSuccess: () => void;
  t: (key: string, values?: any) => string;
}) {
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expert || !newExpiryDate) return;

    setIsSubmitting(true);
    try {
      await extendCredentials(expert.id, newExpiryDate, reason);
      toast.success(t("extendSuccess"));
      onSuccess();
      onClose();
      setNewExpiryDate("");
      setReason("");
    } catch (err: any) {
      toast.error(err?.message || t("failedToLoad"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays size={18} className="text-primary" />
            {t("extendModalTitle")}
          </DialogTitle>
          <DialogDescription>{t("extendModalDesc")}</DialogDescription>
        </DialogHeader>

        {expert && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs space-y-1">
              <p className="font-semibold text-foreground">{expert.fullName}</p>
              <p className="text-muted-foreground">{expert.email}</p>
              {expert.barNumber && (
                <p className="font-mono text-muted-foreground">Bar No: {expert.barNumber}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currentExpiry" className="text-xs">
                {t("currentExpiry")}
              </Label>
              <Input
                id="currentExpiry"
                value={
                  expert.credentialsExpiry
                    ? new Date(expert.credentialsExpiry).toLocaleDateString()
                    : t("notSet")
                }
                disabled
                className="bg-muted text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newExpiryDate" className="text-xs font-semibold">
                {t("newExpiryDate")} *
              </Label>
              <Input
                id="newExpiryDate"
                type="date"
                min={todayStr}
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="extendReason" className="text-xs font-semibold">
                {t("reason")}
              </Label>
              <Textarea
                id="extendReason"
                rows={3}
                placeholder={t("reasonPlaceholder")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                {t("cancel")}
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting || !newExpiryDate}>
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                {isSubmitting ? t("extending") : t("extendExpiry")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Advocate Compliance Detail Drawer Component ───────────────────────────────

function AdvocateDetailDrawer({
  isOpen,
  onClose,
  expert,
  onOpenExtend,
  sendWarningMutation,
  t,
  locale,
}: {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert | null;
  onOpenExtend: (expert: Expert) => void;
  sendWarningMutation: { mutate: (id: string) => void; isPending: boolean };
  t: (key: string, values?: any) => string;
  locale: string;
}) {
  if (!expert) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-5 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShieldCheck size={18} className="text-primary" />
            {t("drawerTitle")}
          </SheetTitle>
          <SheetDescription className="text-xs">{t("drawerDesc")}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
          {/* Header Profile */}
          <div className="flex items-center gap-4 pb-4 border-b border-border">
            <ExpertAvatar
              src={expert.profileImageUrl}
              name={expert.fullName}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-foreground truncate">{expert.fullName}</h3>
              <p className="text-xs text-muted-foreground truncate">{expert.email}</p>
              {expert.phone && <p className="text-xs text-muted-foreground">{expert.phone}</p>}
            </div>
          </div>

          {/* RBA Accreditation Notice */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs space-y-1">
            <p className="flex items-center gap-1.5 font-semibold text-primary">
              <FileCheck2 size={14} />
              {t("statusActive")}
            </p>
            <p className="text-muted-foreground">{t("rbaVerifiedNotice")}</p>
          </div>

          {/* Credentials Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("credentialsExpiry")}
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-border bg-card p-3">
                <span className="text-muted-foreground">{t("barNumber")}</span>
                <p className="mt-1 font-mono font-semibold text-foreground">
                  {expert.barNumber || t("na")}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <span className="text-muted-foreground">{t("credentialsExpiry")}</span>
                <p className="mt-1 font-semibold text-foreground">
                  {expert.credentialsExpiry
                    ? new Date(expert.credentialsExpiry).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : t("notSet")}
                </p>
              </div>
            </div>

            {expert.daysUntilExpiry != null && (
              <div className="rounded-lg border border-border bg-card p-3 text-xs flex items-center justify-between">
                <span className="text-muted-foreground">{t("daysUntilExpiry")}</span>
                <StatusBadge tone={getUrgencyTone(expert.daysUntilExpiry)}>
                  {expert.daysUntilExpiry} {locale === "fr" ? "jours" : locale === "rw" ? "iminsi" : "days"}
                </StatusBadge>
              </div>
            )}

            {expert.daysOverdue != null && (
              <div className="rounded-lg border border-border bg-card p-3 text-xs flex items-center justify-between">
                <span className="text-muted-foreground">{t("daysOverdue")}</span>
                <StatusBadge tone="destructive">
                  {expert.daysOverdue} {locale === "fr" ? "jours" : locale === "rw" ? "iminsi" : "days"}
                </StatusBadge>
              </div>
            )}
          </div>

          {/* Location & Specialties */}
          {expert.officeAddress && (
            <div className="space-y-1.5 text-xs">
              <span className="text-muted-foreground font-semibold">Location</span>
              <p className="text-foreground">{expert.officeAddress}</p>
            </div>
          )}

          {expert.specialties?.length > 0 && (
            <div className="space-y-2 text-xs">
              <span className="text-muted-foreground font-semibold">Specialties</span>
              <div className="flex flex-wrap gap-1.5">
                {expert.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-foreground"
                  >
                    {spec.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-muted/20 space-y-2">
          <Button
            className="w-full gap-2"
            onClick={() => {
              onClose();
              onOpenExtend(expert);
            }}
          >
            <CalendarDays size={14} />
            {t("extendExpiry")}
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2"
            asChild
          >
            <Link href={`/admin/dashboard/experts/${expert.expertId || expert.id}`}>
              <ExternalLink size={14} />
              {t("viewProfile")}
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main Compliance Dashboard Page ────────────────────────────────────────────

export default function CompliancePage() {
  const t = useTranslations("admin.compliance");
  const locale = useLocale();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"compliant" | "expiring" | "expired" | "suspended">("compliant");
  const [compliantPage, setCompliantPage] = useState(1);
  const [expiringPage, setExpiringPage] = useState(1);
  const [expiredPage, setExpiredPage] = useState(1);
  const [suspendedPage, setSuspendedPage] = useState(1);
  const [daysThreshold, setDaysThreshold] = useState(30);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedExpertForExtend, setSelectedExpertForExtend] = useState<Expert | null>(null);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [drawerExpert, setDrawerExpert] = useState<Expert | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Stats Query
  const { data: statsData, isLoading: loadingStats, isError: statsError } = useQuery({
    queryKey: ["admin-compliance-stats"],
    queryFn: fetchStats,
  });

  // Queries per Tab
  const { data: compliantData, isLoading: loadingCompliant, isError: compliantError } = useQuery({
    queryKey: ["admin-compliance-verified", compliantPage, searchTerm],
    queryFn: () => fetchVerifiedExperts(compliantPage, 20, searchTerm),
    enabled: activeTab === "compliant",
  });

  const { data: expiringData, isLoading: loadingExpiring, isError: expiringError } = useQuery({
    queryKey: ["admin-compliance-expiring", expiringPage, daysThreshold, searchTerm],
    queryFn: () => fetchExpiringExperts(expiringPage, 20, daysThreshold, searchTerm),
    enabled: activeTab === "expiring",
  });

  const { data: expiredData, isLoading: loadingExpired, isError: expiredError } = useQuery({
    queryKey: ["admin-compliance-expired", expiredPage, searchTerm],
    queryFn: () => fetchExpiredExperts(expiredPage, 20, searchTerm),
    enabled: activeTab === "expired",
  });

  const { data: suspendedData, isLoading: loadingSuspended, isError: suspendedError } = useQuery({
    queryKey: ["admin-compliance-suspended", suspendedPage, searchTerm],
    queryFn: () => fetchSuspendedExperts(suspendedPage, 20, searchTerm),
    enabled: activeTab === "suspended",
  });

  const sendWarningMutation = useMutation({
    mutationFn: (expertId: string) => sendWarningEmail(expertId),
    onSuccess: () => {
      toast.success(t("warningSent"));
    },
    onError: () => {
      toast.error(t("failedToLoad"));
    },
  });

  const handleRefreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-compliance-stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin-compliance-verified"] });
    queryClient.invalidateQueries({ queryKey: ["admin-compliance-expiring"] });
    queryClient.invalidateQueries({ queryKey: ["admin-compliance-expired"] });
    queryClient.invalidateQueries({ queryKey: ["admin-compliance-suspended"] });
  };

  const stats = statsData?.data;

  if (loadingStats) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <LoadingSpinner label={t("loading")} />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <ErrorState title={t("failedToLoad")} message={t("unableToFetch")} />
      </div>
    );
  }

  const compliantExperts = compliantData?.data ?? [];
  const expiringExperts = expiringData?.data ?? [];
  const expiredExperts = expiredData?.data ?? [];
  const suspendedExperts = suspendedData?.data ?? [];

  const handlePageChange = (newPage: number) => {
    if (activeTab === "compliant") setCompliantPage(newPage);
    else if (activeTab === "expiring") setExpiringPage(newPage);
    else if (activeTab === "expired") setExpiredPage(newPage);
    else setSuspendedPage(newPage);
  };

  const handleOpenExtend = (expert: Expert) => {
    setSelectedExpertForExtend(expert);
    setIsExtendModalOpen(true);
  };

  const handleSelectExpert = (expert: Expert) => {
    setDrawerExpert(expert);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader title={t("title")} description={t("subtitle")} />

      {/* ── 6 KPI Cards Responsive Grid (Balanced down to mobile, 2 rows of 3 on 1024-1279px, 6 across on >=1280px) ── */}
      {stats && (
        <div className="grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            label={t("totalExperts")}
            value={stats.totalExperts}
            icon={Users}
          />
          <StatCard
            label={t("verified")}
            value={stats.verifiedExperts}
            icon={CheckCircle}
          />
          <StatCard
            label={t("expiringSoon")}
            value={stats.expiringCount}
            icon={AlertTriangle}
          />
          <StatCard
            label={t("expired")}
            value={stats.expiredCount}
            icon={XCircle}
          />
          <StatCard
            label={t("suspended")}
            value={stats.suspendedCount}
            icon={Ban}
          />
          <StatCard
            label={t("complianceRate")}
            value={`${stats.complianceRate.toFixed(1)}%`}
            icon={TrendingUp}
          />
        </div>
      )}

      {/* ── Automation Engine Banner ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="font-semibold text-foreground">{t("automationEngineTitle")}</p>
            <p className="text-muted-foreground">{t("automationEngineDesc")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t("nightlyScanActive")}
          </span>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCompliantPage(1);
              setExpiringPage(1);
              setExpiredPage(1);
              setSuspendedPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="pl-9 pr-8 text-xs h-9"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── 4 Tabs for Full Operational Visibility ── */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "compliant" | "expiring" | "expired" | "suspended")}
      >
        <TabsList variant="line" className="overflow-x-auto max-w-full">
          <TabsTrigger value="compliant" className="gap-2 text-xs">
            <ShieldCheck size={14} className="text-emerald-500" />
            {t("compliantN", { n: stats?.compliantCount ?? stats?.verifiedExperts ?? 0 })}
          </TabsTrigger>
          <TabsTrigger value="expiring" className="gap-2 text-xs">
            <AlertTriangle size={14} className="text-amber-500" />
            {t("expiringSoonN", { n: stats?.expiringCount ?? 0 })}
          </TabsTrigger>
          <TabsTrigger value="expired" className="gap-2 text-xs">
            <XCircle size={14} className="text-destructive" />
            {t("expiredN", { n: stats?.expiredCount ?? 0 })}
          </TabsTrigger>
          <TabsTrigger value="suspended" className="gap-2 text-xs">
            <Ban size={14} />
            {t("suspendedN", { n: stats?.suspendedCount ?? 0 })}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Compliant (Verified) */}
        <TabsContent value="compliant">
          {activeTab === "compliant" && (
            compliantError ? (
              <ErrorState title={t("failedToLoad")} message={t("unableToFetch")} />
            ) : (
              <Card>
                <ExpertTable
                  experts={compliantExperts}
                  pagination={compliantData?.pagination}
                  isLoading={loadingCompliant}
                  activeTab="compliant"
                  sendWarningMutation={sendWarningMutation}
                  onOpenExtend={handleOpenExtend}
                  onSelectExpert={handleSelectExpert}
                  onPageChange={handlePageChange}
                  t={t}
                  locale={locale}
                />
              </Card>
            )
          )}
        </TabsContent>

        {/* Tab 2: Expiring Soon */}
        <TabsContent value="expiring">
          {activeTab === "expiring" && (
            <>
              <Card className="mb-4">
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-muted-foreground" />
                    <label className="text-xs font-medium text-foreground">{t("showExpiringWithin")}</label>
                    <Select
                      value={String(daysThreshold)}
                      onValueChange={(v) => {
                        setDaysThreshold(Number(v));
                        setExpiringPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">{t("days7")}</SelectItem>
                        <SelectItem value="14">{t("days14")}</SelectItem>
                        <SelectItem value="30">{t("days30")}</SelectItem>
                        <SelectItem value="60">{t("days60")}</SelectItem>
                        <SelectItem value="90">{t("days90")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {expiringError ? (
                <ErrorState title={t("failedToLoad")} message={t("unableToFetch")} />
              ) : (
                <Card>
                  <ExpertTable
                    experts={expiringExperts}
                    pagination={expiringData?.pagination}
                    isLoading={loadingExpiring}
                    activeTab="expiring"
                    sendWarningMutation={sendWarningMutation}
                    onOpenExtend={handleOpenExtend}
                    onSelectExpert={handleSelectExpert}
                    onPageChange={handlePageChange}
                    t={t}
                    locale={locale}
                  />
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Tab 3: Expired */}
        <TabsContent value="expired">
          {activeTab === "expired" && (
            expiredError ? (
              <ErrorState title={t("failedToLoad")} message={t("unableToFetch")} />
            ) : (
              <Card>
                <ExpertTable
                  experts={expiredExperts}
                  pagination={expiredData?.pagination}
                  isLoading={loadingExpired}
                  activeTab="expired"
                  sendWarningMutation={sendWarningMutation}
                  onOpenExtend={handleOpenExtend}
                  onSelectExpert={handleSelectExpert}
                  onPageChange={handlePageChange}
                  t={t}
                  locale={locale}
                />
              </Card>
            )
          )}
        </TabsContent>

        {/* Tab 4: Suspended */}
        <TabsContent value="suspended">
          {activeTab === "suspended" && (
            suspendedError ? (
              <ErrorState title={t("failedToLoad")} message={t("unableToFetch")} />
            ) : (
              <Card>
                <ExpertTable
                  experts={suspendedExperts}
                  pagination={suspendedData?.pagination}
                  isLoading={loadingSuspended}
                  activeTab="suspended"
                  sendWarningMutation={sendWarningMutation}
                  onOpenExtend={handleOpenExtend}
                  onSelectExpert={handleSelectExpert}
                  onPageChange={handlePageChange}
                  t={t}
                  locale={locale}
                />
              </Card>
            )
          )}
        </TabsContent>
      </Tabs>

      {/* ── Extend Expiry Modal ── */}
      <ExtendExpiryModal
        isOpen={isExtendModalOpen}
        onClose={() => {
          setIsExtendModalOpen(false);
          setSelectedExpertForExtend(null);
        }}
        expert={selectedExpertForExtend}
        onSuccess={handleRefreshAll}
        t={t}
      />

      {/* ── Advocate Compliance Detail Slide-Over Sheet ── */}
      <AdvocateDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setDrawerExpert(null);
        }}
        expert={drawerExpert}
        onOpenExtend={handleOpenExtend}
        sendWarningMutation={sendWarningMutation}
        t={t}
        locale={locale}
      />
    </div>
  );
}
