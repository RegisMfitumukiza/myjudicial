"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  RefreshCw,
  Trash2,
  X,
  Lock,
  Shield,
  Globe,
  Image as ImageIcon,
  ExternalLink,
  Filter,
  HardDrive,
  Users,
  FolderOpen,
  User as UserIcon,
  UserCheck,
} from "lucide-react";
import { apiFetch, apiFetchBlob } from "@/lib/api/client";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/dashboard/page-header";
import { TableSectionSkeleton, CardGridSkeleton } from "@/shared/components/dashboard/loading";
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
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";

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

interface AdminDocumentStats {
  totalDocuments: number;
  totalSizeBytes: number;
  confidentialCount: number;
  privateCount: number;
  publicCount: number;
  totalUploaders: number;
  expertUploaders: number;
  clientUploaders: number;
}

interface AdminDossier {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  expertProfileId?: string | null;
  documents: AdminDocument[];
  totalSize: number;
  documentCount: number;
  latestUpload: string;
}

interface DossiersResponse {
  data: AdminDossier[];
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
const DOSSIER_PAGE_SIZE = 10;

function formatBytes(bytes: number): string {
  if (!bytes || isNaN(bytes)) return "0 B";
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function uploaderName(uploadedBy: AdminDocument["uploadedBy"]): string {
  if (!uploadedBy) return "—";
  const fullName = `${uploadedBy.firstName || ""} ${uploadedBy.lastName || ""}`.trim();
  return fullName || uploadedBy.email;
}

function getFileIcon(mimeType: string, fileName: string) {
  const lowerName = fileName.toLowerCase();
  if (mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(lowerName)) {
    return <ImageIcon size={15} className="shrink-0 text-blue-500" />;
  }
  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    return <FileText size={15} className="shrink-0 text-red-500" />;
  }
  if (lowerName.endsWith(".doc") || lowerName.endsWith(".docx")) {
    return <FileText size={15} className="shrink-0 text-indigo-500" />;
  }
  return <FileText size={15} className="shrink-0 text-muted-foreground" />;
}

export default function DocumentsPage() {
  const t = useTranslations("admin.documents");
  const locale = useLocale();
  const queryClient = useQueryClient();

  const [role, setRole] = useState<"ALL" | "CLIENT" | "EXPERT">("ALL");
  const [sensitivity, setSensitivity] = useState<"ALL" | "PUBLIC" | "PRIVATE" | "CONFIDENTIAL">("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dossierPage, setDossierPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("createdAt");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  // Preview Modal state
  const [previewDoc, setPreviewDoc] = useState<AdminDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Delete Modal state
  const [deleteDoc, setDeleteDoc] = useState<AdminDocument | null>(null);

  // View mode: "stream" (flat table) vs "dossiers" (grouped by person)
  const [viewMode, setViewMode] = useState<"stream" | "dossiers">("stream");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setDossierPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setDossierPage(1);
  }, [role, sensitivity]);

  // ── Backend-driven statistics (platform-wide, not page-scoped) ─────────────
  const { data: statsResponse } = useQuery({
    queryKey: ["admin-document-stats"],
    queryFn: () =>
      apiFetch<{ success: boolean; data: AdminDocumentStats }>("/admin/documents/stats"),
    staleTime: 30_000, // refresh every 30s
    retry: false,
  });
  const stats = statsResponse?.data;

  // If public filter was active but platform has 0 public documents, auto-reset to ALL
  useEffect(() => {
    if (stats && stats.publicCount === 0 && sensitivity === "PUBLIC") {
      setSensitivity("ALL");
    }
  }, [stats?.publicCount, sensitivity]);

  // ── Flat documents list ────────────────────────────────────────────────────
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
    enabled: viewMode === "stream",
  });

  // ── Backend-paginated dossiers ─────────────────────────────────────────────
  const {
    data: dossiersResponse,
    isLoading: dossiersLoading,
    isError: dossiersError,
    refetch: refetchDossiers,
    isFetching: dossiersFetching,
  } = useQuery({
    queryKey: [
      "admin-dossiers",
      { dossierPage, role, sensitivity, search: debouncedSearch },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(dossierPage));
      params.set("limit", String(DOSSIER_PAGE_SIZE));
      if (role !== "ALL") params.set("role", role);
      if (sensitivity !== "ALL") params.set("sensitivity", sensitivity);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      return apiFetch<DossiersResponse>(`/admin/documents/dossiers?${params.toString()}`);
    },
    retry: false,
    enabled: viewMode === "dossiers",
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      return apiFetch(`/files/${fileId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dossiers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-document-stats"] });
      setDeleteDoc(null);
      toast.success(t("deleteSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.message || t("deleteFailed"));
    },
  });

  const documents = Array.isArray(response?.data) ? response.data : [];
  const meta = response?.meta;
  const total = meta?.total ?? 0;
  const totalPages = Math.max(meta?.totalPages ?? 1, 1);

  const dossiers = Array.isArray(dossiersResponse?.data) ? dossiersResponse.data : [];
  const dossierMeta = dossiersResponse?.meta;
  const dossierTotal = dossierMeta?.total ?? 0;
  const dossierTotalPages = Math.max(dossierMeta?.totalPages ?? 1, 1);

  const hasActiveFilters = Boolean(
    role !== "ALL" || sensitivity !== "ALL" || debouncedSearch.trim()
  );

  function handleClearFilters() {
    setRole("ALL");
    setSensitivity("ALL");
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
    setDossierPage(1);
  }

  function handleRefetchAll() {
    refetch();
    refetchDossiers();
    queryClient.invalidateQueries({ queryKey: ["admin-document-stats"] });
  }

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
    return order === "asc" ? (
      <ArrowUp size={12} className="ml-1" />
    ) : (
      <ArrowDown size={12} className="ml-1" />
    );
  }

  function sortableHeader(key: SortKey, label: string) {
    return (
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
      >
        {label}
        {sortIcon(key)}
      </button>
    );
  }

  async function openPreview(doc: AdminDocument) {
    setPreviewDoc(doc);
    setPreviewLoading(true);
    setPreviewUrl(null);
    try {
      const blob = await apiFetchBlob(`/files/${doc.id}/stream`);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Preview fetch failed:", err);
      toast.error(t("loadFailedDesc"));
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePreview() {
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {}
    }
    setPreviewDoc(null);
    setPreviewUrl(null);
  }

  async function handleDownload(doc: AdminDocument) {
    try {
      setActiveFileId(doc.id);
      const blob = await apiFetchBlob(`/files/${doc.id}/stream`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName || `document-${doc.id.substring(0, 6)}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error("Document download failed:", error);
      toast.error(t("loadFailedDesc"));
    } finally {
      setActiveFileId(null);
    }
  }

  const roleFilter = [
    { value: "ALL", label: t("all") },
    { value: "CLIENT", label: t("clients") },
    { value: "EXPERT", label: t("experts") },
  ] as const;

  const sensitivityFilter = useMemo(() => [
    { value: "ALL" as const, label: t("allSensitivities") },
    { value: "CONFIDENTIAL" as const, label: t("confidential") },
    { value: "PRIVATE" as const, label: t("private") },
    ...(stats && stats.publicCount > 0
      ? [{ value: "PUBLIC" as const, label: t("public") }]
      : []),
  ], [stats?.publicCount, t]);

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      {/* Page Header */}
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefetchAll}
            disabled={isFetching || dossiersFetching}
            className="cursor-pointer"
          >
            <RefreshCw size={13} className={(isFetching || dossiersFetching) ? "animate-spin" : ""} /> {t("retry")}
          </Button>
        }
      />

      {/* KPI Overview Cards - Fully Responsive Across All Scales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Documents */}
        <Card className="p-4 sm:p-5 shadow-sm border-border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("totalDocuments")}</span>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {stats ? stats.totalDocuments.toLocaleString() : total.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t("platformRepository")}</p>
          </div>
        </Card>

        {/* Card 2: Total Storage Used */}
        <Card className="p-4 sm:p-5 shadow-sm border-border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("storageUsed")}</span>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <HardDrive size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {formatBytes(stats?.totalSizeBytes ?? 0)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t("allPlatformDocs")}</p>
          </div>
        </Card>

        {/* Card 3: Confidential Files */}
        <Card className="p-4 sm:p-5 shadow-sm border-border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("confidentialFiles")}</span>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
              <Lock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {(stats?.confidentialCount ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t("aesEncrypted")}</p>
          </div>
        </Card>

        {/* Card 4: Active Uploaders */}
        <Card className="p-4 sm:p-5 shadow-sm border-border bg-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{t("uploaders")}</span>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {(stats?.totalUploaders ?? 0).toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {stats?.expertUploaders ?? 0} {t("experts")}
              </span>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                {stats?.clientUploaders ?? 0} {t("clients")}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Unified Filter & View Toolbar (ALWAYS Visible) */}
      <Card className="p-4 shadow-sm border-border bg-card space-y-3">
        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="inline-flex rounded-lg border border-border bg-muted/60 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("stream")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "stream"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText size={13} />
              {t("viewAllFiles")}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("dossiers")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "dossiers"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FolderOpen size={13} />
              {t("viewByPerson")}
              <span className="ml-1 rounded-full bg-primary/10 text-primary px-1.5 py-0.2 text-[10px] font-mono">
                {dossiers.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-muted-foreground">
            {viewMode === "stream" ? (
              <span>{t("totalCount", { count: total.toLocaleString() })}</span>
            ) : (
              <span>{t("dossiersFound", { count: dossiers.length })}</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchFiles")}
              className="pl-9 pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground mr-1 hidden sm:inline">{t("role")}:</span>
            {roleFilter.map((f) => (
              <Button
                key={f.value}
                variant={role === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setRole(f.value);
                  setPage(1);
                }}
                className="cursor-pointer text-xs h-8"
              >
                {f.label}
              </Button>
            ))}
          </div>

          {/* Sensitivity Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground mr-1 hidden sm:inline">{t("sensitivity")}:</span>
            {sensitivityFilter.map((f) => (
              <Button
                key={f.value}
                variant={sensitivity === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSensitivity(f.value);
                  setPage(1);
                }}
                className="cursor-pointer text-xs h-8"
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Active Filters Pill Bar & Clear Button */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-1.5">
              <Filter size={12} className="text-primary" />
              <span>{t("activeFilters")}</span>
              {debouncedSearch.trim() && (
                <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                  &ldquo;{debouncedSearch.trim()}&rdquo;
                </span>
              )}
              {role !== "ALL" && (
                <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-medium">
                  {t("role")}: {role}
                </span>
              )}
              {sensitivity !== "ALL" && (
                <span className="rounded-md bg-destructive/10 text-destructive px-2 py-0.5 text-[11px] font-medium">
                  {t("sensitivity")}: {sensitivity}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-medium text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              <X size={12} /> {t("clearFilters")}
            </button>
          </div>
        )}
      </Card>

      {/* Main Content Area */}
      {isLoading && <TableSectionSkeleton rows={6} columns={6} />}

      {isError && !isLoading && (
        <ErrorState
          title={t("loadFailedTitle")}
          message={t("loadFailedDesc")}
          onRetry={() => refetch()}
          retryLabel={t("retry")}
        />
      )}

      {!isLoading && !isError && documents.length === 0 && (
        hasActiveFilters ? (
          /* When filters are applied and return 0 results: show clear action, user is NEVER trapped */
          <Card className="p-8 text-center border-border shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <Filter size={22} />
            </div>
            <h3 className="text-base font-semibold text-foreground">{t("noSearchResults")}</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              {t("noMatchingFiltersDesc")}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button onClick={handleClearFilters} variant="default" size="sm" className="cursor-pointer">
                <X size={14} className="mr-1.5" /> {t("clearFilters")}
              </Button>
            </div>
          </Card>
        ) : (
          /* Pure platform empty state (0 documents exist) */
          <EmptyState icon={FileText} title={t("noDocuments")} description={t("noDocumentsDesc")} />
        )
      )}

      {/* Data Table (Stream Mode) */}
      {!isLoading && !isError && documents.length > 0 && viewMode === "stream" && (
        <Card className="overflow-hidden shadow-sm border-border">
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
                  <th className="px-4 py-3 font-semibold uppercase tracking-wide text-muted-foreground text-right">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const isBusy = activeFileId === doc.id;
                  const isImage = doc.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.fileName);
                  const isPdf = doc.mimeType === "application/pdf" || doc.fileName.toLowerCase().endsWith(".pdf");

                  return (
                    <tr
                      key={doc.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2.5">
                          {getFileIcon(doc.mimeType, doc.fileName)}
                          <span
                            className="max-w-[280px] sm:max-w-[340px] truncate font-medium hover:text-primary transition-colors cursor-pointer"
                            title={doc.fileName}
                            onClick={() => openPreview(doc)}
                          >
                            {doc.fileName}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-foreground font-medium text-xs leading-none">
                          {uploaderName(doc.uploadedBy)}
                        </p>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-1">
                          {doc.uploadedBy ? doc.uploadedBy.role : doc.ownerType}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                        {formatBytes(doc.fileSize)}
                      </td>

                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(doc.createdAt).toLocaleDateString(locale, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-4 py-3">
                        {doc.sensitivity === "CONFIDENTIAL" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-2.5 py-0.5 text-[11px] font-semibold">
                            <Lock size={10} /> {t("confidential")}
                          </span>
                        ) : doc.sensitivity === "PRIVATE" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 px-2.5 py-0.5 text-[11px] font-semibold">
                            <Shield size={10} /> {t("private")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground border border-border px-2.5 py-0.5 text-[11px] font-medium">
                            <Globe size={10} /> {t("public")}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={t("view")}
                            disabled={isBusy}
                            onClick={() => openPreview(doc)}
                            className="text-primary hover:bg-primary/10 cursor-pointer h-8 w-8"
                          >
                            <Eye size={15} />
                          </Button>

                          {/* Download */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={t("download")}
                            disabled={isBusy}
                            onClick={() => handleDownload(doc)}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer h-8 w-8"
                          >
                            {isBusy ? (
                              <Loader2 size={14} className="animate-spin text-primary" />
                            ) : (
                              <Download size={15} />
                            )}
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={t("delete")}
                            disabled={isBusy}
                            onClick={() => setDeleteDoc(doc)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer h-8 w-8"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Pagination */}
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
                className="cursor-pointer text-xs"
              >
                <ChevronLeft size={13} /> {t("previous")}
              </Button>
              <span className="text-xs text-muted-foreground px-1">
                {t("pageOf", { page: meta?.page ?? 1, total: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta?.hasNext || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="cursor-pointer text-xs"
              >
                {t("next")} <ChevronRight size={13} />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Dossiers Grouped by Person View */}
      {viewMode === "dossiers" && dossiersLoading && <CardGridSkeleton count={6} columns={2} />}

      {viewMode === "dossiers" && dossiersError && !dossiersLoading && (
        <ErrorState
          title={t("loadFailedTitle")}
          message={t("loadFailedDesc")}
          onRetry={() => refetchDossiers()}
          retryLabel={t("retry")}
        />
      )}

      {viewMode === "dossiers" && !dossiersLoading && !dossiersError && dossiers.length === 0 && (
        hasActiveFilters ? (
          <Card className="p-8 text-center border-border shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <Filter size={22} />
            </div>
            <h3 className="text-base font-semibold text-foreground">{t("noSearchResults")}</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              {t("noDossiersMatch")}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button onClick={handleClearFilters} variant="default" size="sm" className="cursor-pointer">
                <X size={14} className="mr-1.5" /> {t("clearFilters")}
              </Button>
            </div>
          </Card>
        ) : (
          <EmptyState icon={FolderOpen} title={t("noDocuments")} description={t("noDocumentsDesc")} />
        )
      )}

      {viewMode === "dossiers" && !dossiersLoading && !dossiersError && dossiers.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {dossiers.map((dossier) => {
              const isExpert = dossier.role === "EXPERT";
              const initials =
                dossier.userName
                  .split(" ")
                  .filter(Boolean)
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "U";

              return (
                <Card key={dossier.userId} className="overflow-hidden border-border shadow-sm">
                  {/* Dossier Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {dossier.userName}
                          </h4>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              isExpert
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {dossier.role}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{dossier.userEmail || t("noEmail")}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground hidden sm:inline mr-2">
                        {t("filesCount", { count: dossier.documentCount })} &bull; {formatBytes(dossier.totalSize)}
                      </span>
                      {isExpert ? (
                        <>
                          <Link
                            href={`/${locale}/admin/dashboard/experts/${dossier.expertProfileId || dossier.userId}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2.5 py-1.5 transition-colors"
                          >
                            <UserCheck size={13} /> {t("viewExpert")}
                          </Link>
                          <Link
                            href={`/${locale}/admin/dashboard/verifications?search=${encodeURIComponent(dossier.userEmail || dossier.userName)}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-md px-2.5 py-1.5 transition-colors"
                          >
                            <FileText size={13} /> {t("reviewVerification")}
                          </Link>
                        </>
                      ) : (
                        <Link
                          href={`/${locale}/admin/dashboard/clients?search=${encodeURIComponent(dossier.userEmail || dossier.userName)}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-md px-2.5 py-1.5 transition-colors"
                        >
                          <UserIcon size={13} /> {t("viewClient")}
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Dossier Documents List */}
                  <div className="divide-y divide-border">
                    {dossier.documents.map((doc) => {
                      const isBusy = activeFileId === doc.id;
                      return (
                        <div
                          key={doc.id}
                          className="flex flex-wrap items-center justify-between gap-3 p-3.5 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="shrink-0">{getFileIcon(doc.mimeType, doc.fileName)}</div>
                            <div className="min-w-0 flex-1">
                              <p
                                onClick={() => openPreview(doc)}
                                className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer truncate max-w-md"
                                title={doc.fileName}
                              >
                                {doc.fileName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                                <span className="font-mono">{formatBytes(doc.fileSize)}</span>
                                <span>&bull;</span>
                                <span>
                                  {new Date(doc.createdAt).toLocaleDateString(locale, {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3">
                            {doc.sensitivity === "CONFIDENTIAL" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-2 py-0.5 text-[10px] font-semibold">
                                <Lock size={9} /> {t("confidential")}
                              </span>
                            ) : doc.sensitivity === "PRIVATE" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 px-2 py-0.5 text-[10px] font-semibold">
                                <Shield size={9} /> {t("private")}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground border border-border px-2 py-0.5 text-[10px] font-medium">
                                <Globe size={9} /> {t("public")}
                              </span>
                            )}

                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title={t("view")}
                                disabled={isBusy}
                                onClick={() => openPreview(doc)}
                                className="text-primary hover:bg-primary/10 cursor-pointer h-7 w-7"
                              >
                                <Eye size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title={t("download")}
                                disabled={isBusy}
                                onClick={() => handleDownload(doc)}
                                className="text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer h-7 w-7"
                              >
                                {isBusy ? (
                                  <Loader2 size={13} className="animate-spin text-primary" />
                                ) : (
                                  <Download size={14} />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title={t("delete")}
                                disabled={isBusy}
                                onClick={() => setDeleteDoc(doc)}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer h-7 w-7"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Dossiers Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card p-4 rounded-lg shadow-sm">
            <p className="text-xs text-muted-foreground">
              {t("dossiersFound", { count: dossierTotal })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!dossierMeta?.hasPrev || dossiersFetching}
                onClick={() => setDossierPage((p) => Math.max(p - 1, 1))}
                className="cursor-pointer text-xs"
              >
                <ChevronLeft size={13} /> {t("previous")}
              </Button>
              <span className="text-xs text-muted-foreground px-1">
                {t("pageOf", { page: dossierMeta?.page ?? 1, total: dossierTotalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!dossierMeta?.hasNext || dossiersFetching}
                onClick={() => setDossierPage((p) => p + 1)}
                className="cursor-pointer text-xs"
              >
                {t("next")} <ChevronRight size={13} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Document Preview Modal */}
      <Dialog open={Boolean(previewDoc)} onOpenChange={(open) => { if (!open) closePreview(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {previewDoc && getFileIcon(previewDoc.mimeType, previewDoc.fileName)}
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-base font-semibold">
                  {previewDoc?.fileName}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {t("uploadedBy")}: {previewDoc ? uploaderName(previewDoc.uploadedBy) : ""} &bull;{" "}
                  {previewDoc ? formatBytes(previewDoc.fileSize) : ""} &bull;{" "}
                  {previewDoc?.createdAt
                    ? new Date(previewDoc.createdAt).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : ""}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Modal Preview Body */}
          <div className="flex-1 overflow-auto rounded-lg border border-border bg-muted/20 min-h-[300px] max-h-[550px] flex items-center justify-center p-3">
            {previewLoading ? (
              <div
                className="w-full h-[400px] animate-pulse motion-reduce:animate-none rounded-lg bg-card p-6 flex flex-col justify-between"
                role="status"
                aria-busy="true"
                aria-label={t("loading")}
              >
                <div className="space-y-4">
                  <div className="h-6 w-1/3 rounded bg-muted" />
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-5/6 rounded bg-muted" />
                  <div className="h-4 w-4/6 rounded bg-muted" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-2/3 rounded bg-muted" />
                </div>
              </div>
            ) : previewUrl ? (
              previewDoc?.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(previewDoc?.fileName || "") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={previewDoc?.fileName || "Preview"}
                  className="max-h-full max-w-full rounded-md object-contain shadow-sm"
                />
              ) : previewDoc?.mimeType === "application/pdf" || previewDoc?.fileName.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewUrl}
                  className="h-full w-full min-h-[480px] rounded-md border-0"
                  title={previewDoc?.fileName || "PDF Viewer"}
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <FileText size={48} className="mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">{previewDoc?.fileName}</p>
                  <p className="text-xs text-muted-foreground">{t("cannotPreview")}</p>
                  <Button
                    size="sm"
                    onClick={() => previewDoc && handleDownload(previewDoc)}
                    className="mt-2 cursor-pointer"
                  >
                    <Download size={14} className="mr-1.5" /> {t("download")}
                  </Button>
                </div>
              )
            ) : (
              <div className="text-center text-xs text-muted-foreground">
                {t("loadFailedDesc")}
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2">
            <div>
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                >
                  <ExternalLink size={13} /> {t("openInNewTab")}
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={closePreview} className="cursor-pointer">
                {t("cancel")}
              </Button>
              {previewDoc && (
                <Button
                  size="sm"
                  onClick={() => handleDownload(previewDoc)}
                  className="cursor-pointer"
                >
                  <Download size={14} className="mr-1.5" /> {t("download")}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteDoc)} onOpenChange={(open) => { if (!open) setDeleteDoc(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 size={18} /> {t("deleteConfirmTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-2">
              {t("deleteConfirmDesc")}
            </DialogDescription>
          </DialogHeader>

          {deleteDoc && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center gap-2.5">
              {getFileIcon(deleteDoc.mimeType, deleteDoc.fileName)}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{deleteDoc.fileName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatBytes(deleteDoc.fileSize)} &bull; Uploaded by {uploaderName(deleteDoc.uploadedBy)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDoc(null)}
              disabled={deleteMutation.isPending}
              className="cursor-pointer"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteDoc && deleteMutation.mutate(deleteDoc.id)}
              disabled={deleteMutation.isPending}
              className="cursor-pointer"
            >
              {deleteMutation.isPending && <Loader2 size={14} className="mr-1.5 animate-spin" />}
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}