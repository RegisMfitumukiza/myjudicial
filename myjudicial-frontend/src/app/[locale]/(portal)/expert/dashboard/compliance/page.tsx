"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldAlert,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  PageHeader,
  StatusBadge,
  ErrorState,
  type StatusTone,
} from "@/shared/components/dashboard";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useCompliance, type ComplianceStatus } from "@/features/experts/hooks/useCompliance";
import { ExpertStatus } from "@/api/generated";
import { format, parseISO } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "dd MMM yyyy");
  } catch {
    return iso;
  }
}

interface StatusConfig {
  tone: StatusTone;
  icon: React.ReactNode;
  label: string;
  chipClass: string;
}

function getStatusConfig(status: ExpertStatus, isExpired: boolean): StatusConfig {
  if (isExpired || status === ExpertStatus.SUSPENDED) {
    return {
      tone: "destructive",
      icon: <AlertTriangle size={20} />,
      label: isExpired ? "Expired" : "Suspended",
      chipClass: "bg-destructive/10 text-destructive",
    };
  }
  if (status === ExpertStatus.PENDING_VERIFICATION || status === ExpertStatus.DRAFT) {
    return {
      tone: "warning",
      icon: <Clock size={20} />,
      label: status === ExpertStatus.DRAFT ? "Draft" : "Pending Review",
      chipClass: "bg-warning/10 text-warning",
    };
  }
  if (status === ExpertStatus.VERIFIED) {
    return {
      tone: "active",
      icon: <CheckCircle size={20} />,
      label: "Compliant",
      chipClass: "bg-primary/10 text-primary",
    };
  }
  // REJECTED or unknown
  return {
    tone: "destructive",
    icon: <ShieldAlert size={20} />,
    label: status === ExpertStatus.REJECTED ? "Rejected" : status,
    chipClass: "bg-destructive/10 text-destructive",
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ComplianceSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <Skeleton className="mb-3 h-5 w-24" />
            <Skeleton className="mb-2 h-7 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <Skeleton className="mb-4 h-5 w-48" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

// ─── Detail Card ──────────────────────────────────────────────────────────────

function ComplianceCard({ data }: { data: ComplianceStatus }) {
  const config = getStatusConfig(data.status, data.isExpired);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.chipClass}`}
        >
          {config.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-base font-semibold text-foreground">Expert Credentials</h3>
            <StatusBadge tone={config.tone}>{config.label}</StatusBadge>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">{data.statusMessage}</p>

          <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Credentials Expiry
              </span>
              <span
                className={`font-medium ${
                  data.isExpired ? "text-destructive" : "text-foreground"
                }`}
              >
                {formatDate(data.credentialsExpiry)}
              </span>
            </div>

            {data.daysUntilExpiry !== null && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Days Until Expiry
                </span>
                <span
                  className={`font-medium ${
                    data.isExpired
                      ? "text-destructive"
                      : data.daysUntilExpiry <= 30
                      ? "text-warning"
                      : "text-foreground"
                  }`}
                >
                  {data.isExpired ? "Expired" : `${data.daysUntilExpiry} days`}
                </span>
              </div>
            )}

            {data.lastVerification && (
              <>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Last Verification
                  </span>
                  <span className="font-medium text-foreground">
                    {formatDate(
                      data.lastVerification.reviewedAt ?? data.lastVerification.createdAt
                    )}
                  </span>
                </div>
                {data.lastVerification.rejectionReason && (
                  <div className="col-span-full flex flex-col gap-0.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Rejection Reason
                    </span>
                    <span className="text-sm text-destructive">
                      {data.lastVerification.rejectionReason}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const t = useTranslations("expertDashboard_compliance");
  const { data, isLoading, isError, refetch } = useCompliance();

  const isExpiredFlag = data?.isExpired ?? false;
  const isActive = data?.status === ExpertStatus.VERIFIED && !isExpiredFlag;
  const isPending =
    data?.status === ExpertStatus.PENDING_VERIFICATION ||
    data?.status === ExpertStatus.DRAFT;
  const isSuspended = data?.status === ExpertStatus.SUSPENDED || isExpiredFlag;
  const hasExpiryWarning =
    !isExpiredFlag &&
    data?.daysUntilExpiry !== null &&
    data?.daysUntilExpiry !== undefined &&
    data.daysUntilExpiry <= 30;

  return (
    <div className="mx-auto max-w-[1080px] space-y-6 p-6 lg:p-8">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button size="sm" asChild>
            <Link href="/expert/dashboard/verification">
              <FileText size={14} /> {t("uploadDocuments")}
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <ComplianceSkeleton />
      ) : isError || !data ? (
        <ErrorState message={t("loadError")} onRetry={() => refetch()} />
      ) : (
        <>
          {/* Summary chips */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <StatusBadge tone="destructive">Critical</StatusBadge>
              <p className="mt-2 text-2xl font-bold text-foreground">{isSuspended ? 1 : 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">Requires immediate action</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <StatusBadge tone="warning">Warnings</StatusBadge>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {isPending || hasExpiryWarning ? 1 : 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Due within the next 30 days</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <StatusBadge tone="active">Compliant</StatusBadge>
              <p className="mt-2 text-2xl font-bold text-foreground">{isActive ? 1 : 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">All obligations up to date</p>
            </div>
          </div>

          {/* Live detail card */}
          <ComplianceCard data={data} />

          {/* Action notice for suspended / expired */}
          {isSuspended && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Action Required</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {isExpiredFlag
                    ? "Your credentials have expired. Upload renewed documents to restore your account."
                    : "Your account has been suspended. Contact support or upload updated verification documents."}
                </p>
                <Button size="sm" variant="destructive" className="mt-3" asChild>
                  <Link href="/expert/dashboard/verification">
                    <RefreshCw size={14} /> Upload New Documents
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

