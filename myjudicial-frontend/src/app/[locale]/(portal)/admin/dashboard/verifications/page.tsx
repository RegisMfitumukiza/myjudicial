"use client";

import { useState } from "react";
import {
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Eye,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";
import {
  useGetAdminVerificationQueue,
  getGetAdminVerificationQueueQueryKey,
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
    user: {
      email: string;
      firstName: string;
      lastName: string;
    };
  };
}

function allRequiredDocsSubmitted(record: VerificationRecord): boolean {
  return !!(record.identityDocumentObjectKey && record.barCertificateObjectKey);
}

function missingRequiredDocs(record: VerificationRecord): string[] {
  const missing: string[] = [];
  if (!record.identityDocumentObjectKey) missing.push("Identity Document");
  if (!record.barCertificateObjectKey) missing.push("Bar Certificate");
  return missing;
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800",
  APPROVED: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800",
  REJECTED: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800",
  EXPIRED: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700",
};

export default function AdminVerificationsPage() {
  const t = useTranslations("admin.verifications");
  const { data, isLoading } = useGetAdminVerificationQueue();
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");

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
    return (
      <div className="flex items-center justify-center p-6 lg:p-8" style={{ minHeight: "60vh" }}>
        <Loader2 size={32} className="animate-spin text-brand-dark dark:text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/admin/dashboard/experts" className="inline-flex items-center gap-1 hover:text-brand-blue transition-colors">
          <ArrowLeft size={14} />
          {t("backToExperts")}
        </Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">{t("title")}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("subtitle")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: t("totalRequests"), value: counts.total, color: "text-gray-500 dark:text-gray-400" },
          { label: t("pendingReview"), value: counts.PENDING, color: "text-amber-600 dark:text-amber-400" },
          { label: t("approved"), value: counts.APPROVED, color: "text-green-600 dark:text-green-400" },
          { label: t("rejected"), value: counts.REJECTED, color: "text-red-600 dark:text-red-400" },
        ].map((stat) => (
          <Card key={stat.label} size="sm">
            <CardContent>
              <p className={`text-[11px] font-medium ${stat.color}`}>{stat.label}</p>
              <p className="mt-1 text-lg font-bold text-brand-dark dark:text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-brand-border/20 bg-white p-1 w-fit dark:bg-gray-900">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === s
                ? "bg-brand-dark text-white dark:bg-white dark:text-black"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {STATUS_LABEL[s]} {counts[s] > 0 && `(${counts[s]})`}
          </button>
        ))}
      </div>

      {/* Table */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FileCheck size={40} className="mb-3 opacity-30" />
          <p className="text-sm">{t("noRequests", { status: STATUS_LABEL[statusFilter]?.toLowerCase() })}</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border/10 bg-brand-canvas text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
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
                  const missing = missingRequiredDocs(record);
                  const submittedCount = [
                    record.identityDocumentObjectKey,
                    record.barCertificateObjectKey,
                    ...record.additionalDocumentKeys,
                  ].filter(Boolean).length;

                  return (
                    <tr
                      key={record.id}
                      className="border-b border-brand-border/10 text-[12px] text-slate-700 last:border-0 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-brand-dark dark:text-white">
                          {record.expert.displayName}
                        </p>
                        <p className="text-[11px] text-slate-400">{record.expert.user.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {record.expert.primarySpecialty.replace(/_/g, " ")}
                      </td>
                      <td className="px-5 py-3.5">
                        {allReady ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600">
                            <CheckCircle size={12} /> {submittedCount} {t("submitted").toLowerCase()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                            <AlertTriangle size={12} /> Missing: {missing.join(", ")}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {new Date(record.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[record.status] ?? "bg-slate-100 text-slate-600"}`}>
                          {record.status === "PENDING" && <Clock size={10} />}
                          {record.status === "APPROVED" && <CheckCircle size={10} />}
                          {record.status === "REJECTED" && <XCircle size={10} />}
                          {STATUS_LABEL[record.status] ?? record.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/admin/dashboard/experts/${record.expert.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          <Eye size={13} /> {t("review")} <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
