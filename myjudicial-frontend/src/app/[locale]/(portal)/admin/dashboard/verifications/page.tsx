"use client";

import { useState } from "react";
import {
  FileCheck,
  CheckCircle,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";

import { Button } from "@/shared/components/ui/button";
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
  PageHeader,
  StatCard,
  StatusBadge,
  EmptyState,
  TableSkeleton,
} from "@/shared/components/dashboard";
import {
  useGetAdminVerificationQueue,
} from "@/api/generated";

interface VerificationRecord {
  id: string;
  status: string;
  identityDocumentObjectKey: string | null;
  barCertificateObjectKey: string | null;
  additionalDocumentKeys: string[];
  rejectionReason: string | null;
  createdAt: string;
  expert: {
    id: string;
    displayName: string;
    barNumber: string | null;
    primarySpecialty: string;
    city: string | null;
    status: string;
    profileImageObjectKey: string | null;
    profileImageUrl?: string | null;
    user: {
      id?: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
}

function allRequiredDocsSubmitted(record: VerificationRecord): boolean {
  return !!(record.identityDocumentObjectKey && record.barCertificateObjectKey);
}

const STATUS_TONE: Record<string, "pending" | "success" | "destructive" | "neutral"> = {
  PENDING: "pending",
  APPROVED: "success",
  REJECTED: "destructive",
  EXPIRED: "neutral",
};

export default function AdminVerificationsPage() {
  const t = useTranslations("admin.verifications");
  const tExp = useTranslations("admin.experts");
  const locale = useLocale();
  const { data, isLoading } = useGetAdminVerificationQueue();
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");

  function getMissingRequiredDocs(record: VerificationRecord): string[] {
    const missing: string[] = [];
    if (!record.identityDocumentObjectKey) missing.push(tExp("identityDocument"));
    if (!record.barCertificateObjectKey) missing.push(tExp("barCertificate"));
    return missing;
  }

  const allRecords: VerificationRecord[] = (data as any)?.status === 200
    ? (data as any).data.data
    : [];

  const records = allRecords.filter((r) => r.status === statusFilter);

  const counts = {
    PENDING: allRecords.filter((r) => r.status === "PENDING").length,
    APPROVED: allRecords.filter((r) => r.status === "APPROVED").length,
    REJECTED: allRecords.filter((r) => r.status === "REJECTED").length,
    total: allRecords.length,
  };

  const STATUS_LABEL: Record<string, string> = {
    PENDING: t("pendingReview"),
    APPROVED: t("approved"),
    REJECTED: t("rejected"),
    EXPIRED: t("expired"),
  };

  if (isLoading) {
    return <TableSkeleton statsCount={4} columns={5} rows={5} />;
  }

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        backHref="/admin/dashboard/experts"
        backLabel={t("backToExperts")}
      />

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label={t("totalRequests")}
          value={counts.total}
        />
        <StatCard
          label={t("pendingReview")}
          value={counts.PENDING}
        />
        <StatCard
          label={t("approved")}
          value={counts.APPROVED}
        />
        <StatCard
          label={t("rejected")}
          value={counts.REJECTED}
        />
      </div>

      <div className="w-full sm:w-fit">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t("pendingReview")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">
              {STATUS_LABEL["PENDING"]} {counts.PENDING > 0 && `(${counts.PENDING})`}
            </SelectItem>
            <SelectItem value="APPROVED">
              {STATUS_LABEL["APPROVED"]} {counts.APPROVED > 0 && `(${counts.APPROVED})`}
            </SelectItem>
            <SelectItem value="REJECTED">
              {STATUS_LABEL["REJECTED"]} {counts.REJECTED > 0 && `(${counts.REJECTED})`}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title={t("noRequests", { status: STATUS_LABEL[statusFilter]?.toLowerCase() })}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Desktop & Tablet Table (>= md: 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">{t("expert")}</th>
                  <th className="px-5 py-3">{t("specialty")}</th>
                  <th className="px-5 py-3">{t("documents")}</th>
                  <th className="px-5 py-3">{t("submitted")}</th>
                  <th className="px-5 py-3">{t("status")}</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const allReady = allRequiredDocsSubmitted(record);
                  const missing = getMissingRequiredDocs(record);
                  const submittedCount = [
                    record.identityDocumentObjectKey,
                    record.barCertificateObjectKey,
                    ...record.additionalDocumentKeys,
                  ].filter(Boolean).length;

                  return (
                    <tr
                      key={record.id}
                      className="border-b border-border text-[12px] text-foreground last:border-0 transition-colors hover:bg-muted/50"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <ExpertAvatar
                            src={record.expert.profileImageUrl}
                            name={record.expert.displayName}
                            size="xs"
                            className="h-8 w-8 text-xs"
                          />
                          <div>
                            <p className="font-semibold text-foreground">
                              {record.expert.displayName}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{record.expert.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {record.expert.primarySpecialty.replace(/_/g, " ")}
                      </td>
                      <td className="px-5 py-3.5">
                        {allReady ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                            <CheckCircle size={12} /> {submittedCount} {t("submitted").toLowerCase()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warning">
                            <AlertTriangle size={12} /> {tExp("missing")}: {missing.join(", ")}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {new Date(record.createdAt).toLocaleDateString(locale, {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge tone={STATUS_TONE[record.status] ?? "neutral"}>
                          {STATUS_LABEL[record.status] ?? record.status}
                        </StatusBadge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/dashboard/experts/${record.expert.user?.id || record.expert.id}`}>
                            <Eye size={13} /> {t("review")}
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

            {/* Mobile Card Stack (< md: 768px) */}
            <div className="block md:hidden divide-y divide-border">
              {records.map((record) => {
                const allReady = allRequiredDocsSubmitted(record);
                const missing = getMissingRequiredDocs(record);
                const submittedCount = [
                  record.identityDocumentObjectKey,
                  record.barCertificateObjectKey,
                  ...record.additionalDocumentKeys,
                ].filter(Boolean).length;

                return (
                  <div key={record.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <ExpertAvatar
                          src={record.expert.profileImageUrl}
                          name={record.expert.displayName}
                          size="sm"
                          className="h-10 w-10 shrink-0 text-xs"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">
                            {record.expert.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {record.expert.user.email}
                          </p>
                          <p className="text-[11px] text-muted-foreground/80 truncate">
                            {record.expert.primarySpecialty.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                      <StatusBadge tone={STATUS_TONE[record.status] ?? "neutral"}>
                        {STATUS_LABEL[record.status] ?? record.status}
                      </StatusBadge>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                      <div>
                        {allReady ? (
                          <span className="inline-flex items-center gap-1 font-medium text-primary text-[11px]">
                            <CheckCircle size={12} /> {submittedCount} {t("submitted").toLowerCase()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-warning text-[11px]">
                            <AlertTriangle size={12} /> {tExp("missing")}: {missing.join(", ")}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(record.createdAt).toLocaleDateString(locale, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="pt-1">
                      <Button variant="outline" size="sm" className="w-full h-9 text-xs gap-1.5" asChild>
                        <Link href={`/admin/dashboard/experts/${record.expert.user?.id || record.expert.id}`}>
                          <Eye size={13} /> {t("review")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
