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

  const blob = await apiFetchBlob(
    `/admin/audit-logs/export?${queryParams.toString()}`,
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
  const [exporting, setExporting] = useState(false);

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

  const handleExport = async (formatType: "csv" | "json") => {
    setExporting(true);
    try {
      await exportLogs(formatType, {
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        resource: resourceFilter !== "ALL" ? resourceFilter : undefined,
        fromDate,
        toDate,
      });
    } catch (err) {
      console.error("Export failed:", err);
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
      <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
        <LoadingSpinner label={t("loading")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
        <PageHeader
          title={t("title")}
          description={t("subtitle")}
        />
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
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              disabled={exporting}
            >
              <Download size={16} />
              {exporting ? t("exporting") : t("exportCsv")}
            </Button>
            <Button
              size="sm"
              onClick={() => handleExport("json")}
              disabled={exporting}
            >
              <Download size={16} />
              {exporting ? t("exporting") : t("exportJson")}
            </Button>
          </>
        }
      />

      {stats && (
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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
          <StatCard
            label={t("retention")}
            value={`${stats.retentionDays} ${t("days")}`}
            icon={Database}
          />
        </div>
      )}

      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <Select
              value={actionFilter}
              onValueChange={(v) => {
                setActionFilter(v as AuditAction | "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger>
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
              </SelectContent>
            </Select>

            <Select
              value={resourceFilter}
              onValueChange={(v) => {
                setResourceFilter(v as AuditResource | "ALL");
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("allResources")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("allResources")}</SelectItem>
                <SelectItem value="USER">{t("resourceUser")}</SelectItem>
                <SelectItem value="EXPERT">{t("resourceExpert")}</SelectItem>
                <SelectItem value="BOOKING">{t("resourceBooking")}</SelectItem>
                <SelectItem value="PAYMENT">{t("resourcePayment")}</SelectItem>
                <SelectItem value="DOCUMENT">{t("resourceDocument")}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Input
                type="date"
                className="min-w-[120px] flex-1"
                value={dateFromDraft}
                onChange={(e) => setDateFromDraft(e.target.value)}
                placeholder={t("startDate")}
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="date"
                className="min-w-[120px] flex-1"
                value={dateToDraft}
                onChange={(e) => setDateToDraft(e.target.value)}
                placeholder={t("endDate")}
              />
              <Button
                size="sm"
                className="shrink-0"
                onClick={() => {
                  setFromDate(dateFromDraft);
                  setToDate(dateToDraft);
                  setPage(1);
                }}
              >
                {t("apply")}
              </Button>
              {(fromDate || toDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                    setDateFromDraft("");
                    setDateToDraft("");
                    setPage(1);
                  }}
                >
                  {t("reset")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4">{t("timestamp")}</th>
                <th className="px-6 py-4">{t("actor")}</th>
                <th className="px-6 py-4">{t("action")}</th>
                <th className="px-6 py-4">{t("resource")}</th>
                <th className="px-6 py-4">{t("details")}</th>
                <th className="px-6 py-4">{t("ipAddress")}</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={FileText}
                      title={t("noLogs")}
                    />
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground">{formatDate(log.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {log.actor ? (
                        <div>
                          <p className="font-medium text-foreground">{log.actor.fullName}</p>
                          <p className="text-xs text-muted-foreground">{log.actor.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge tone={ACTION_TONE[log.action]} dot={false}>
                        {ACTION_LABELS[log.action]}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge tone={RESOURCE_TONE[log.resource]} dot={false}>
                        {RESOURCE_LABELS[log.resource]}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="max-w-xs truncate text-muted-foreground">
                        {log.description || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground">{log.ipAddress || "—"}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
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

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {pagination.page} / {pagination.totalPages} ({pagination.total.toLocaleString()})
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

      {stats && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Database size={14} />
          <span>
            {t("retentionDesc", { days: stats.retentionDays })}
          </span>
        </div>
      )}

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("logDetails")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground">{t("eventId")}</label>
                <p className="mt-1 font-mono text-sm text-foreground">{selectedLog?.id}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">{t("timestamp")}</label>
                <p className="mt-1 text-sm text-foreground">
                  {selectedLog && formatDate(selectedLog.createdAt)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground">{t("action")}</label>
                <div className="mt-1">
                  {selectedLog && (
                    <StatusBadge tone={ACTION_TONE[selectedLog.action]} dot={false}>
                      {ACTION_LABELS[selectedLog.action]}
                    </StatusBadge>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">{t("resource")}</label>
                <div className="mt-1">
                  {selectedLog && (
                    <StatusBadge tone={RESOURCE_TONE[selectedLog.resource]} dot={false}>
                      {RESOURCE_LABELS[selectedLog.resource]}
                    </StatusBadge>
                  )}
                </div>
              </div>
            </div>

            {selectedLog?.actor && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground">{t("actor")}</label>
                <div className="mt-1 rounded-lg border border-border bg-muted/50 p-3">
                  <p className="font-medium text-foreground">{selectedLog.actor.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.actor.email}</p>
                  <p className="text-xs text-muted-foreground">Role: {selectedLog.actor.role}</p>
                </div>
              </div>
            )}

            {selectedLog?.resourceId && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground">Resource ID</label>
                <p className="mt-1 font-mono text-sm text-foreground">{selectedLog.resourceId}</p>
              </div>
            )}

            {selectedLog?.description && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground">{t("details")}</label>
                <p className="mt-1 text-sm text-foreground">{selectedLog.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {selectedLog?.ipAddress && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">{t("ipAddress")}</label>
                  <p className="mt-1 font-mono text-sm text-foreground">{selectedLog.ipAddress}</p>
                </div>
              )}
              {selectedLog?.userAgent && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground">{t("userAgent")}</label>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{selectedLog.userAgent}</p>
                </div>
              )}
            </div>

            {selectedLog?.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground">{t("metadata")}</label>
                <pre className="mt-1 overflow-auto rounded-lg border border-border bg-muted/50 p-3 text-xs text-foreground">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowDetailModal(false)}>{t("close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
