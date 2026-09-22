"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Download,
  Eye,
  Search,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { apiFetch, apiFetchBlob } from "@/lib/api/client";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader } from "@/shared/components/dashboard/page-header";
import { LoadingSpinner } from "@/shared/components/dashboard/loading";
import { ErrorState } from "@/shared/components/dashboard/error-state";
import { EmptyState } from "@/shared/components/dashboard/empty-state";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";

type SortKey = "fileName" | "fileSize" | "createdAt";
type SortOrder = "asc" | "desc";

interface AdminDocument {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sensitivity: "PUBLIC" | "PRIVATE" | "CONFIDENTIAL";
  ownerType: string;
  bookingId: string | null;
  uploadedById: string | null;
  createdAt: string;
  updatedAt: string;
  uploadedBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "CITIZEN" | "EXPERT" | "ADMIN";
  } | null;
}

interface DocumentsResponse {
  data: AdminDocument[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const PAGE_SIZE = 20;

function formatBytes(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function uploaderName(uploadedBy: AdminDocument["uploadedBy"]): string {
  if (!uploadedBy) return "—";
  const fullName = `${uploadedBy.firstName} ${uploadedBy.lastName}`.trim();
  return fullName || uploadedBy.email;
}

const SENSITIVITY_BADGE: Record<string, string> = {
  PUBLIC: "bg-muted text-muted-foreground",
  PRIVATE: "bg-primary/10 text-primary",
  CONFIDENTIAL: "bg-destructive/10 text-destructive",
};

export default function DocumentsPage() {
  const t = useTranslations("admin.documents");
  const locale = useLocale();

  const [role, setRole] = useState<"ALL" | "CLIENT" | "EXPERT">("ALL");
  const [sensitivity, setSensitivity] = useState<"ALL" | "PUBLIC" | "PRIVATE" | "CONFIDENTIAL">("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("createdAt");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: response,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      "admin-documents",
      { page, role, sensitivity, search: debouncedSearch, sortBy, order },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      params.set("sortBy", sortBy);
      params.set("order", order);
      if (role !== "ALL") params.set("role", role);
      if (sensitivity !== "ALL") params.set("sensitivity", sensitivity);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      return apiFetch<DocumentsResponse>(`/admin/documents?${params.toString()}`);
    },
    retry: false,
  });

  const documents = Array.isArray(response?.data) ? response.data : [];
  const meta = response?.meta;
  const total = meta?.total ?? 0;
  const totalPages = Math.max(meta?.totalPages ?? 1, 1);

  function toggleSort(key: SortKey) {
    if (sortBy === key) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setOrder("asc");
    }
    setPage(1);
  }

  function sortIcon(key: SortKey) {
    if (sortBy !== key) return null;
    return order === "asc" ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />;
  }

  function sortableHeader(key: SortKey, label: string) {
    return (
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
      >
        {label}
        {sortIcon(key)}
      </button>
    );
  }

  async function handleDownload(fileId: string, viewing = false) {
    try {
      setActiveFileId(fileId);
      const blob = await apiFetchBlob(`/files/${fileId}/stream`);
      const url = URL.createObjectURL(blob);
      if (viewing || blob.type.startsWith("image/") || blob.type === "application/pdf") {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `document-${fileId.substring(0, 6)}`;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error("Document download failed:", error);
    } finally {
      setActiveFileId(null);
    }
  }

  const roleFilter = [
    { value: "ALL", label: t("all") },
    { value: "CLIENT", label: t("clients") },
    { value: "EXPERT", label: t("experts") },
  ] as const;

  const sensitivityFilter = [
    { value: "ALL", label: t("allSensitivities") },
    { value: "PRIVATE", label: t("private") },
    { value: "CONFIDENTIAL", label: t("confidential") },
    { value: "PUBLIC", label: t("public") },
  ] as const;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          !isLoading ? (
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <FileText size={13} className={isFetching ? "animate-spin" : ""} /> {t("retry")}
            </Button>
          ) : undefined
        }
      />

      {isLoading && <LoadingSpinner label={t("loading")} />}

      {isError && !isLoading && (
        <ErrorState title={t("loadFailedTitle")} message={t("loadFailedDesc")} onRetry={() => refetch()} retryLabel={t("retry")} />
      )}

      {!isLoading && !isError && documents.length === 0 && (
        <EmptyState icon={FileText} title={t("noDocuments")} description={t("noDocumentsDesc")} />
      )}

      {!isLoading && !isError && documents.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-xs flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchFiles")}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {roleFilter.map((f) => (
                <Button
                  key={f.value}
                  variant={role === f.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setRole(f.value);
                    setPage(1);
                  }}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3">{sortableHeader("fileName", t("fileName"))}</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("uploadedBy")}
                    </th>
                    <th className="px-4 py-3">{sortableHeader("fileSize", t("size"))}</th>
                    <th className="px-4 py-3">{sortableHeader("createdAt", t("date"))}</th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("sensitivity")}
                    </th>
                    <th className="px-4 py-3 font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const busy = activeFileId === doc.id;
                    return (
                      <tr key={doc.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="shrink-0 text-muted-foreground" />
                            <span className="max-w-[240px] truncate">{doc.fileName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-muted-foreground">{uploaderName(doc.uploadedBy)}</p>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground/60">
                            {doc.uploadedBy ? doc.uploadedBy.role : "system"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatBytes(doc.fileSize)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleDateString(locale, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                              SENSITIVITY_BADGE[doc.sensitivity] ?? "bg-muted text-muted-foreground"
                            }`}
                          >
                            {doc.sensitivity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title={t("view")}
                              disabled={busy}
                              onClick={() => handleDownload(doc.id, true)}
                            >
                              {busy ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title={t("download")}
                              disabled={busy}
                              onClick={() => handleDownload(doc.id, false)}
                            >
                              <Download size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {documents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        {t("noSearchResults")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {t("totalCount", { count: total.toLocaleString() })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta?.hasPrev || isFetching}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  <ChevronLeft size={13} /> {t("previous")}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {t("pageOf", { page: meta?.page ?? 1, total: totalPages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta?.hasNext || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("next")} <ChevronRight size={13} />
                </Button>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-1.5">
            {sensitivityFilter.map((f) => (
              <Button
                key={f.value}
                variant={sensitivity === f.value ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setSensitivity(f.value);
                  setPage(1);
                }}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}