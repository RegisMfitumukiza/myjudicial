"use client";

import { useState } from "react";
import {
  FileText,
  Activity,
  AlertTriangle,
  Search,
  Download,
  Eye,
  Calendar,
  Database,
  X,
  RotateCcw,
  Clock,
  Globe,
  Copy,
  Check,
  Shield,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, apiFetchBlob } from "@/lib/api/client";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader } from "@/shared/components/dashboard/page-header";
import { StatCard } from "@/shared/components/dashboard/stat-card";
import { StatusBadge, type StatusTone } from "@/shared/components/dashboard/status-badge";
import { LoadingSpinner } from "@/shared/components/dashboard/loading";
import { ErrorState } from "@/shared/components/dashboard/error-state";
import { EmptyState } from "@/shared/components/dashboard/empty-state";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/components/ui/select";

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
  if (params.action && (params.action as string) !== "ALL") queryParams.append("action", params.action);
  if (params.resource && (params.resource as string) !== "ALL") queryParams.append("resource", params.resource);
  if (params.search && params.search.trim()) queryParams.append("search", params.search.trim());
  if (params.fromDate && params.fromDate.trim()) queryParams.append("fromDate", params.fromDate.trim());
  if (params.toDate && params.toDate.trim()) queryParams.append("toDate", params.toDate.trim());
  const q = queryParams.toString();
  return apiFetch(`/admin/audit-logs${q ? `?${q}` : ""}`);
};

const exportLogs = async (
  format: "csv" | "json",
  filters: {
    action?: string;
    resource?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
  }
) => {
  const queryParams = new URLSearchParams();
  queryParams.append("format", format);
  if (filters.action && filters.action !== "ALL") queryParams.append("action", filters.action);
  if (filters.resource && filters.resource !== "ALL") queryParams.append("resource", filters.resource);
  if (filters.search && filters.search.trim()) queryParams.append("search", filters.search.trim());
  if (filters.fromDate && filters.fromDate.trim()) queryParams.append("fromDate", filters.fromDate.trim());
  if (filters.toDate && filters.toDate.trim()) queryParams.append("toDate", filters.toDate.trim());

  const blob = await apiFetchBlob(
    `/admin/audit-logs/export?${queryParams.toString()}`
  );

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `audit-logs-${Date.now()}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const ACTION_TONE: Record<AuditAction, StatusTone> = {
  CREATE: "success",
  UPDATE: "info",
  DELETE: "destructive",
  LOGIN: "info",
  LOGOUT: "neutral",
  VERIFY: "success",
  REJECT: "destructive",
  BOOK: "info",
  CANCEL: "warning",
  PAYMENT: "success",
  ESCROW_LOCKED: "warning",
  ESCROW_RELEASED: "success",
  UPLOAD: "info",
  DOWNLOAD: "info",
  SHARE: "info",
};

const RESOURCE_TONE: Record<AuditResource, StatusTone> = {
  USER: "info",
  EXPERT: "success",
  BOOKING: "info",
  SERVICE: "info",
  REVIEW: "warning",
  VERIFICATION: "success",
  PAYMENT: "success",
  DOCUMENT: "warning",
  CONVERSATION: "info",
  MESSAGE: "info",
};

function getInitials(name?: string | null): string {
  if (!name) return "SY";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function AuditLogsPage() {
  const t = useTranslations("admin.auditLogs");
  const locale = useLocale();
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
  const [exportingFormat, setExportingFormat] = useState<"csv" | "json" | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const ACTION_LABELS: Record<AuditAction, string> = {
    CREATE: t("actionCreate"),
    UPDATE: t("actionUpdate"),
    DELETE: t("actionDelete"),
    LOGIN: t("actionLogin"),
    LOGOUT: t("actionLogout"),
    VERIFY: t("actionVerify"),
    REJECT: t("actionReject"),
    BOOK: t("actionBook"),
    CANCEL: t("actionCancel"),
    PAYMENT: t("actionPayment"),
    ESCROW_LOCKED: t("actionEscrowLocked"),
    ESCROW_RELEASED: t("actionEscrowReleased"),
    UPLOAD: t("actionUpload"),
    DOWNLOAD: t("actionDownload"),
    SHARE: t("actionShare"),
  };

  const RESOURCE_LABELS: Record<AuditResource, string> = {
    USER: t("resourceUser"),
    EXPERT: t("resourceExpert"),
    BOOKING: t("resourceBooking"),
    SERVICE: t("resourceService"),
    REVIEW: t("resourceReview"),
    VERIFICATION: t("resourceVerification"),
    PAYMENT: t("resourcePayment"),
    DOCUMENT: t("resourceDocument"),
    CONVERSATION: t("resourceConversation"),
    MESSAGE: t("resourceMessage"),
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-audit-stats"],
    queryFn: fetchStats,
  });

  const {
    data: logsData,
    isLoading: loadingLogs,
    error,
  } = useQuery({
    queryKey: [
      "admin-audit-logs",
      page,
      searchQuery,
      actionFilter,
      resourceFilter,
      fromDate,
      toDate,
    ],
    queryFn: () =>
      fetchLogs({
        page,
        limit: 20,
        search: searchQuery.trim() || undefined,
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        resource: resourceFilter !== "ALL" ? resourceFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      }),
  });

  const logs = logsData?.data?.logs ?? [];
  const pagination = logsData?.data?.pagination;
  const stats = statsData?.data;

  const handleExport = async (formatType: "csv" | "json") => {
    setExportingFormat(formatType);
    try {
      await exportLogs(formatType, {
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        resource: resourceFilter !== "ALL" ? resourceFilter : undefined,
        search: searchQuery.trim() || undefined,
        fromDate,
        toDate,
      });
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExportingFormat(null);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    actionFilter !== "ALL" ||
    resourceFilter !== "ALL" ||
    fromDate ||
    toDate
  );

  if (loadingStats && loadingLogs) {
    return (
      <div className="space-y-6 p-3 sm:p-6 lg:p-8 min-w-0">
        <LoadingSpinner label={t("loading")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-3 sm:p-6 lg:p-8 min-w-0">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <ErrorState
          title={t("failedToLoad")}
          message=""
          onRetry={() => {
            window.location.reload();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      {/* Page Header with Responsive Action Controls */}
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              disabled={Boolean(exportingFormat)}
              className="flex-1 sm:flex-none h-9 text-xs font-medium"
            >
              {exportingFormat === "csv" ? (
                <Loader2 size={14} className="animate-spin mr-1.5" />
              ) : (
                <Download size={14} className="mr-1.5" />
              )}
              {exportingFormat === "csv" ? t("exporting") : t("exportCsv")}
            </Button>
            <Button
              size="sm"
              onClick={() => handleExport("json")}
              disabled={Boolean(exportingFormat)}
              className="flex-1 sm:flex-none h-9 text-xs font-medium"
            >
              {exportingFormat === "json" ? (
                <Loader2 size={14} className="animate-spin mr-1.5" />
              ) : (
                <Download size={14} className="mr-1.5" />
              )}
              {exportingFormat === "json" ? t("exporting") : t("exportJson")}
            </Button>
          </div>
        }
      />

      {/* Metric Cards - 5 columns on desktop, 3 on tablet, 2 on mobile with 5th card spanning 2 */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5 lg:gap-4">
          <StatCard
            label={t("totalEvents")}
            value={stats.totalLogs.toLocaleString()}
            icon={FileText}
          />
          <StatCard
            label={t("today")}
            value={stats.byPeriod.today}
            icon={Activity}
          />
          <StatCard
            label={t("thisWeek")}
            value={stats.byPeriod.thisWeek}
            icon={Calendar}
          />
          <StatCard
            label={t("criticalActions")}
            value={stats.recentCritical}
            icon={AlertTriangle}
          />
          <div className="col-span-2 sm:col-span-1 lg:col-span-1">
            <StatCard
              label={t("retention")}
              value={`${stats.retentionDays} ${t("days")}`}
              icon={Database}
            />
          </div>
        </div>
      )}

      {/* Modern, Fully Responsive Filter Console */}
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        <CardContent className="p-3.5 sm:p-5 space-y-3.5">
          {/* Search Row */}
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="pl-9 pr-9 h-10 w-full text-xs sm:text-sm bg-background border-border/80 focus-visible:ring-1"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                className="absolute right-3 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Controls Row: Filters + Date Range with Balanced Wrap */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3">
            {/* Filter Dropdowns */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 min-w-0">
              <Select
                value={actionFilter}
                onValueChange={(v) => {
                  setActionFilter(v as AuditAction | "ALL");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-full sm:w-[150px] md:w-[160px] text-xs">
                  <SelectValue placeholder={t("allActions")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("allActions")}</SelectItem>
                  <SelectItem value="CREATE">{t("actionCreate")}</SelectItem>
                  <SelectItem value="UPDATE">{t("actionUpdate")}</SelectItem>
                  <SelectItem value="DELETE">{t("actionDelete")}</SelectItem>
                  <SelectItem value="LOGIN">{t("actionLogin")}</SelectItem>
                  <SelectItem value="LOGOUT">{t("actionLogout")}</SelectItem>
                  <SelectItem value="VERIFY">{t("actionVerify")}</SelectItem>
                  <SelectItem value="REJECT">{t("actionReject")}</SelectItem>
                  <SelectItem value="BOOK">{t("actionBook")}</SelectItem>
                  <SelectItem value="CANCEL">{t("actionCancel")}</SelectItem>
                  <SelectItem value="PAYMENT">{t("actionPayment")}</SelectItem>
                  <SelectItem value="ESCROW_LOCKED">{t("actionEscrowLocked")}</SelectItem>
                  <SelectItem value="ESCROW_RELEASED">{t("actionEscrowReleased")}</SelectItem>
                  <SelectItem value="UPLOAD">{t("actionUpload")}</SelectItem>
                  <SelectItem value="DOWNLOAD">{t("actionDownload")}</SelectItem>
                  <SelectItem value="SHARE">{t("actionShare")}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={resourceFilter}
                onValueChange={(v) => {
                  setResourceFilter(v as AuditResource | "ALL");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-full sm:w-[150px] md:w-[160px] text-xs">
                  <SelectValue placeholder={t("allResources")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("allResources")}</SelectItem>
                  <SelectItem value="USER">{t("resourceUser")}</SelectItem>
                  <SelectItem value="EXPERT">{t("resourceExpert")}</SelectItem>
                  <SelectItem value="BOOKING">{t("resourceBooking")}</SelectItem>
                  <SelectItem value="SERVICE">{t("resourceService")}</SelectItem>
                  <SelectItem value="REVIEW">{t("resourceReview")}</SelectItem>
                  <SelectItem value="VERIFICATION">{t("resourceVerification")}</SelectItem>
                  <SelectItem value="PAYMENT">{t("resourcePayment")}</SelectItem>
                  <SelectItem value="DOCUMENT">{t("resourceDocument")}</SelectItem>
                  <SelectItem value="CONVERSATION">{t("resourceConversation")}</SelectItem>
                  <SelectItem value="MESSAGE">{t("resourceMessage")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Unit (Never breaks onto 3 lines) */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-md border border-border/70 w-full sm:w-auto">
                <Calendar size={13} className="text-muted-foreground ml-1.5 shrink-0" />
                <Input
                  type="date"
                  className="h-7 w-[120px] sm:w-[130px] text-xs border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                  value={dateFromDraft}
                  onChange={(e) => setDateFromDraft(e.target.value)}
                  placeholder={t("startDate")}
                />
                <span className="text-muted-foreground text-xs font-medium px-0.5">–</span>
                <Input
                  type="date"
                  className="h-7 w-[120px] sm:w-[130px] text-xs border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                  value={dateToDraft}
                  onChange={(e) => setDateToDraft(e.target.value)}
                  placeholder={t("endDate")}
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Button
                  size="sm"
                  className="h-9 px-3 text-xs flex-1 sm:flex-none"
                  onClick={() => {
                    setFromDate(dateFromDraft);
                    setToDate(dateToDraft);
                    setPage(1);
                  }}
                >
                  {t("apply")}
                </Button>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => {
                      setSearchQuery("");
                      setActionFilter("ALL");
                      setResourceFilter("ALL");
                      setFromDate("");
                      setToDate("");
                      setDateFromDraft("");
                      setDateToDraft("");
                      setPage(1);
                    }}
                  >
                    <RotateCcw size={12} className="mr-1" />
                    {t("reset")}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50 text-xs text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                Filters:
              </span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                  Search: &quot;{searchQuery}&quot;
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setPage(1);
                    }}
                    className="hover:opacity-70 p-0.5"
                    aria-label="Remove search filter"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
              {actionFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                  {ACTION_LABELS[actionFilter]}
                  <button
                    onClick={() => {
                      setActionFilter("ALL");
                      setPage(1);
                    }}
                    className="hover:opacity-70 p-0.5"
                    aria-label="Remove action filter"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
              {resourceFilter !== "ALL" && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                  {RESOURCE_LABELS[resourceFilter]}
                  <button
                    onClick={() => {
                      setResourceFilter("ALL");
                      setPage(1);
                    }}
                    className="hover:opacity-70 p-0.5"
                    aria-label="Remove resource filter"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
              {(fromDate || toDate) && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                  {fromDate || "Start"} to {toDate || "Now"}
                  <button
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                      setDateFromDraft("");
                      setDateToDraft("");
                      setPage(1);
                    }}
                    className="hover:opacity-70 p-0.5"
                    aria-label="Remove date filter"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Area: Responsive Table (Desktop/Tablet) + Native Card List (Mobile) */}
      <Card className="border border-border/80 shadow-sm overflow-hidden">
        {/* Desktop & Tablet Table View (md: 768px and up) */}
        <div className="hidden md:block overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap w-[160px]">{t("timestamp")}</th>
                <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap min-w-[200px]">{t("actor")}</th>
                <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap w-[120px]">{t("action")}</th>
                <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap w-[110px]">{t("resource")}</th>
                <th className="px-4 lg:px-6 py-3.5 min-w-[180px] max-w-xs">{t("details")}</th>
                <th className="px-4 lg:px-6 py-3.5 whitespace-nowrap w-[130px]">{t("ipAddress")}</th>
                <th className="px-4 lg:px-6 py-3.5 text-right w-[60px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12">
                    <EmptyState
                      icon={FileText}
                      title={t("noLogs")}
                      description={hasActiveFilters ? t("tryAdjusting") : undefined}
                    />
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-4 lg:px-6 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 lg:px-6 py-3.5">
                      {log.actor ? (
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                            {getInitials(log.actor.fullName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-xs sm:text-sm truncate">
                              {log.actor.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{log.actor.email}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Shield size={14} className="text-muted-foreground/70" />
                          <span>{t("system")}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-3.5 whitespace-nowrap">
                      <StatusBadge tone={ACTION_TONE[log.action]} dot={false}>
                        {ACTION_LABELS[log.action]}
                      </StatusBadge>
                    </td>
                    <td className="px-4 lg:px-6 py-3.5 whitespace-nowrap">
                      <StatusBadge tone={RESOURCE_TONE[log.resource]} dot={false}>
                        {RESOURCE_LABELS[log.resource]}
                      </StatusBadge>
                    </td>
                    <td className="px-4 lg:px-6 py-3.5">
                      <p className="max-w-xs truncate text-xs text-muted-foreground" title={log.description || ""}>
                        {log.description || "—"}
                      </p>
                    </td>
                    <td className="px-4 lg:px-6 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                        {log.ipAddress || "—"}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3.5 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleViewDetails(log)}
                        aria-label={t("view")}
                      >
                        <Eye size={14} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile & Very Small Devices Native Card List View (< 768px) */}
        <div className="block md:hidden divide-y divide-border">
          {logs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileText}
                title={t("noLogs")}
                description={hasActiveFilters ? t("tryAdjusting") : undefined}
              />
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-3.5 space-y-2.5 transition-colors hover:bg-muted/30">
                {/* Header: Timestamp + View Button */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock size={12} className="text-muted-foreground/70" />
                    {formatDate(log.createdAt)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 rounded"
                    onClick={() => handleViewDetails(log)}
                    aria-label={t("view")}
                  >
                    <Eye size={13} />
                  </Button>
                </div>

                {/* Actor Info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                      {log.actor ? getInitials(log.actor.fullName) : "SY"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {log.actor ? log.actor.fullName : t("system")}
                      </p>
                      {log.actor?.email && (
                        <p className="text-[11px] text-muted-foreground truncate">{log.actor.email}</p>
                      )}
                    </div>
                  </div>
                  {log.actor?.role && (
                    <span className="text-[10px] font-mono uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
                      {log.actor.role}
                    </span>
                  )}
                </div>

                {/* Action + Resource Badges + IP */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge tone={ACTION_TONE[log.action]} dot={false}>
                    {ACTION_LABELS[log.action]}
                  </StatusBadge>
                  <StatusBadge tone={RESOURCE_TONE[log.resource]} dot={false}>
                    {RESOURCE_LABELS[log.resource]}
                  </StatusBadge>
                  {log.ipAddress && (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground ml-auto bg-muted/40 px-1.5 py-0.5 rounded">
                      <Globe size={11} className="text-muted-foreground/60" />
                      {log.ipAddress}
                    </span>
                  )}
                </div>

                {/* Description details */}
                {log.description && (
                  <p className="text-xs text-foreground/80 line-clamp-2 bg-muted/20 p-2 rounded border border-border/40">
                    {log.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Responsive Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-4 sm:px-6 py-3.5 bg-muted/10">
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              Page <span className="font-semibold text-foreground">{pagination.page}</span> of{" "}
              <span className="font-semibold text-foreground">{pagination.totalPages}</span>{" "}
              ({pagination.total.toLocaleString()} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-3"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                ← Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-3"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Retention Footer Banner */}
      {stats && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <Database size={13} className="shrink-0 text-muted-foreground/70" />
          <span>{t("retentionDesc", { days: stats.retentionDays })}</span>
        </div>
      )}

      {/* Modern, Industrial Detail Modal with Responsive Drawer Scroll */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="w-full max-w-lg sm:max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Shield size={18} className="text-primary" />
              {t("logDetails")}
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 py-2 text-sm">
              {/* Event ID with 1-click Copy */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{t("eventId")}</span>
                  <button
                    onClick={() => handleCopy(selectedLog.id, "id")}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {copiedField === "id" ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === "id" ? "Copied" : "Copy ID"}
                  </button>
                </div>
                <p className="mt-1 font-mono text-xs sm:text-sm text-foreground break-all select-all">
                  {selectedLog.id}
                </p>
              </div>

              {/* Timestamp & Action/Resource */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/70 p-3 bg-muted/20">
                  <span className="text-xs font-medium text-muted-foreground">{t("timestamp")}</span>
                  <p className="mt-1 text-xs sm:text-sm font-medium text-foreground">
                    {formatDate(selectedLog.createdAt)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 p-3 bg-muted/20">
                  <span className="text-xs font-medium text-muted-foreground">Action & Resource</span>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <StatusBadge tone={ACTION_TONE[selectedLog.action]} dot={false}>
                      {ACTION_LABELS[selectedLog.action]}
                    </StatusBadge>
                    <StatusBadge tone={RESOURCE_TONE[selectedLog.resource]} dot={false}>
                      {RESOURCE_LABELS[selectedLog.resource]}
                    </StatusBadge>
                  </div>
                </div>
              </div>

              {/* Actor Details */}
              <div className="rounded-lg border border-border/70 p-3 bg-muted/20 space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">{t("actor")}</span>
                {selectedLog.actor ? (
                  <div className="flex items-center gap-2.5 pt-0.5">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                      {getInitials(selectedLog.actor.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                        {selectedLog.actor.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{selectedLog.actor.email}</p>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-muted px-2 py-0.5 rounded border border-border text-foreground">
                      {selectedLog.actor.role}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <Shield size={14} />
                    <span>System Automated Process</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedLog.description && (
                <div className="rounded-lg border border-border/70 p-3 bg-muted/20">
                  <span className="text-xs font-medium text-muted-foreground">{t("details")}</span>
                  <p className="mt-1 text-xs sm:text-sm text-foreground leading-relaxed">
                    {selectedLog.description}
                  </p>
                </div>
              )}

              {/* Resource ID (if applicable) */}
              {selectedLog.resourceId && (
                <div className="rounded-lg border border-border/70 p-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Resource ID</span>
                    <button
                      onClick={() => handleCopy(selectedLog.resourceId || "", "resourceId")}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {copiedField === "resourceId" ? <Check size={12} /> : <Copy size={12} />}
                      {copiedField === "resourceId" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="mt-1 font-mono text-xs text-foreground break-all">
                    {selectedLog.resourceId}
                  </p>
                </div>
              )}

              {/* IP Address and User Agent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/70 p-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{t("ipAddress")}</span>
                    {selectedLog.ipAddress && (
                      <button
                        onClick={() => handleCopy(selectedLog.ipAddress || "", "ip")}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {copiedField === "ip" ? <Check size={12} /> : <Copy size={12} />}
                        {copiedField === "ip" ? "Copied" : "Copy"}
                      </button>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-xs text-foreground">
                    {selectedLog.ipAddress || "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 p-3 bg-muted/20">
                  <span className="text-xs font-medium text-muted-foreground">{t("userAgent")}</span>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 break-all" title={selectedLog.userAgent || ""}>
                    {selectedLog.userAgent || "—"}
                  </p>
                </div>
              </div>

              {/* Metadata JSON viewer */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="rounded-lg border border-border/70 p-3 bg-muted/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{t("metadata")}</span>
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedLog.metadata, null, 2), "meta")}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {copiedField === "meta" ? <Check size={12} /> : <Copy size={12} />}
                      {copiedField === "meta" ? "Copied" : "Copy JSON"}
                    </button>
                  </div>
                  <pre className="max-h-48 overflow-auto rounded bg-background/80 p-2.5 font-mono text-[11px] text-foreground border border-border/50">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button onClick={() => setShowDetailModal(false)} size="sm">
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
