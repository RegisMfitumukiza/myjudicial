"use client";

import { useRef, useState, useMemo } from "react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  FileText,
  Download,
  Trash2,
  Loader2,
  UploadCloud,
  Lock,
  Share2,
  X,
  Search,
  ShieldCheck,
  FolderOpen,
  Briefcase,
  Users,
  Eye,
  FileSpreadsheet,
  Image as ImageIcon,
  File as FileGenericIcon,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  useGetFiles,
  useDeleteFilesFileId,
  usePostFilesUpload,
  getGetFilesQueryKey,
} from "@/api/generated";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiFetchBlob, apiFetchEnvelope } from "@/lib/api/client";

const SENSITIVITY_STYLE: Record<string, string> = {
  PUBLIC: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  PRIVATE: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/50",
  CONFIDENTIAL: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

type DocumentSourceType = "vault" | "consultation" | "shared";

interface DisplayDocument {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sensitivity: string;
  createdAt: string;
  sourceType: DocumentSourceType;
  category?: string | null;
  caseTitle?: string | null;
  expertName?: string | null;
  uploaderName?: string | null;
  sharedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
  } | null;
  sharedAt?: string | null;
  shareExpiresAt?: string | null;
  canDelete: boolean;
  canShare: boolean;
}

function formatSize(bytes: number): string {
  if (!bytes || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsPanel() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("features.documents");
  const locale = useLocale();

  // State
  const [activeTab, setActiveTab] = useState<"all" | "vault" | "consultations" | "shared">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "pdf" | "image" | "docs">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [previewingFileId, setPreviewingFileId] = useState<string | null>(null);
  const [sharingFileId, setSharingFileId] = useState<string | null>(null);
  const [sharingFileName, setSharingFileName] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Queries
  const { data: vaultData, isLoading: isLoadingVault, isError: isVaultError } = useGetFiles();
  const { mutate: deleteFile, isPending: isDeleting, variables: deletingVars } = useDeleteFilesFileId();
  const { mutate: uploadFile, isPending: isUploading } = usePostFilesUpload();

  const { data: consultationResp, isLoading: isLoadingConsultations } = useQuery({
    queryKey: ["files", "consultation-files"],
    queryFn: () => apiFetch<{ data: any[] }>("/files/consultation-files?limit=100"),
    staleTime: 30000,
  });

  const { data: sharedResp, isLoading: isLoadingShared } = useQuery({
    queryKey: ["files", "shared-with-me"],
    queryFn: () => apiFetch<{ data: any[] }>("/files/shared-with-me?limit=100"),
    staleTime: 30000,
  });

  // Extract documents
  const vaultDocuments: DisplayDocument[] = useMemo(() => {
    const rawFiles = vaultData?.status === 200 ? (vaultData.data.data ?? []) : [];
    return rawFiles.map((doc: any) => ({
      id: doc.id,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      sensitivity: doc.sensitivity || "PRIVATE",
      createdAt: doc.createdAt,
      sourceType: "vault" as const,
      category: doc.category,
      canDelete: true,
      canShare: true,
    }));
  }, [vaultData]);

  const consultationDocuments: DisplayDocument[] = useMemo(() => {
    const rawFiles = consultationResp?.data ?? [];
    return rawFiles.map((doc: any) => ({
      id: doc.id,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      sensitivity: doc.sensitivity || "CONFIDENTIAL",
      createdAt: doc.createdAt,
      sourceType: "consultation" as const,
      category: doc.category,
      caseTitle: doc.caseTitle,
      expertName: doc.expertName,
      uploaderName: doc.uploaderName,
      canDelete: false,
      canShare: false,
    }));
  }, [consultationResp]);

  const sharedDocuments: DisplayDocument[] = useMemo(() => {
    const rawFiles = sharedResp?.data ?? [];
    return rawFiles.map((doc: any) => ({
      id: doc.id,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      sensitivity: doc.sensitivity || "PRIVATE",
      createdAt: doc.createdAt,
      sourceType: "shared" as const,
      category: doc.category,
      sharedBy: doc.sharedBy,
      sharedAt: doc.sharedAt,
      shareExpiresAt: doc.shareExpiresAt,
      canDelete: false,
      canShare: false,
    }));
  }, [sharedResp]);

  // Combined documents deduplicated by ID
  const allDocuments = useMemo(() => {
    const map = new Map<string, DisplayDocument>();
    // Priority: vault first, then consultation, then shared
    vaultDocuments.forEach((d) => map.set(d.id, d));
    consultationDocuments.forEach((d) => {
      if (!map.has(d.id)) map.set(d.id, d);
    });
    sharedDocuments.forEach((d) => {
      if (!map.has(d.id)) map.set(d.id, d);
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [vaultDocuments, consultationDocuments, sharedDocuments]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    all: allDocuments.length,
    vault: vaultDocuments.length,
    consultations: consultationDocuments.length,
    shared: sharedDocuments.length,
  }), [allDocuments, vaultDocuments, consultationDocuments, sharedDocuments]);

  // Storage telemetry across personal vault
  const totalStorageBytes = useMemo(() => {
    return vaultDocuments.reduce((sum, f) => sum + (f.fileSize || 0), 0);
  }, [vaultDocuments]);

  // Tab-filtered documents
  const tabFilteredDocuments = useMemo(() => {
    switch (activeTab) {
      case "vault":
        return vaultDocuments;
      case "consultations":
        return consultationDocuments;
      case "shared":
        return sharedDocuments;
      case "all":
      default:
        return allDocuments;
    }
  }, [activeTab, vaultDocuments, consultationDocuments, sharedDocuments, allDocuments]);

  // Search & Type-filtered documents
  const filteredDocuments = useMemo(() => {
    return tabFilteredDocuments.filter((doc) => {
      // Type filter
      if (typeFilter === "pdf" && !doc.mimeType.toLowerCase().includes("pdf") && !doc.fileName.toLowerCase().endsWith(".pdf")) {
        return false;
      }
      if (
        typeFilter === "image" &&
        !doc.mimeType.toLowerCase().startsWith("image/") &&
        !/\.(png|jpe?g|webp|gif)$/i.test(doc.fileName)
      ) {
        return false;
      }
      if (
        typeFilter === "docs" &&
        !doc.mimeType.toLowerCase().includes("word") &&
        !doc.mimeType.toLowerCase().includes("document") &&
        !doc.mimeType.toLowerCase().includes("excel") &&
        !doc.mimeType.toLowerCase().includes("spreadsheet") &&
        !/\.(docx?|xlsx?|pptx?)$/i.test(doc.fileName)
      ) {
        return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        doc.fileName.toLowerCase().includes(q) ||
        (doc.caseTitle && doc.caseTitle.toLowerCase().includes(q)) ||
        (doc.expertName && doc.expertName.toLowerCase().includes(q)) ||
        (doc.uploaderName && doc.uploaderName.toLowerCase().includes(q)) ||
        (doc.sharedBy?.firstName && doc.sharedBy.firstName.toLowerCase().includes(q)) ||
        (doc.sharedBy?.lastName && doc.sharedBy.lastName.toLowerCase().includes(q)) ||
        (doc.sharedBy?.email && doc.sharedBy.email.toLowerCase().includes(q))
      );
    });
  }, [tabFilteredDocuments, typeFilter, searchQuery]);

  // Helper: File type formatting & color-coded icons
  function getFileTypeInfo(mime: string, fileName: string) {
    const lowerName = fileName.toLowerCase();
    const lowerMime = mime.toLowerCase();

    if (lowerMime.includes("pdf") || lowerName.endsWith(".pdf")) {
      return {
        label: t("typePdf"),
        icon: <FileText size={16} className="text-rose-600 dark:text-rose-400" />,
        badgeStyle: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/40",
      };
    }
    if (
      lowerMime.includes("word") ||
      lowerMime.includes("officedocument.wordprocessingml") ||
      lowerName.endsWith(".doc") ||
      lowerName.endsWith(".docx")
    ) {
      return {
        label: t("typeWord"),
        icon: <FileText size={16} className="text-blue-600 dark:text-blue-400" />,
        badgeStyle: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/40",
      };
    }
    if (
      lowerMime.startsWith("image/") ||
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".webp")
    ) {
      return {
        label: t("typeImage"),
        icon: <ImageIcon size={16} className="text-purple-600 dark:text-purple-400" />,
        badgeStyle: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900/40",
      };
    }
    if (
      lowerMime.includes("excel") ||
      lowerMime.includes("spreadsheet") ||
      lowerName.endsWith(".xlsx") ||
      lowerName.endsWith(".xls") ||
      lowerName.endsWith(".csv")
    ) {
      return {
        label: t("typeSpreadsheet"),
        icon: <FileSpreadsheet size={16} className="text-emerald-600 dark:text-emerald-400" />,
        badgeStyle: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40",
      };
    }
    return {
      label: t("typeOther"),
      icon: <FileGenericIcon size={16} className="text-gray-500 dark:text-gray-400" />,
      badgeStyle: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    };
  }

  // Upload handler
  function handleUpload(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("fileTooLarge"));
      return;
    }
    const metadata = JSON.stringify({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      category: "client-document",
      sensitivity: "PRIVATE",
    });
    uploadFile(
      { data: { file, metadata } },
      {
        onSuccess: () => {
          toast.success(t("documentUploaded"));
          queryClient.invalidateQueries({ queryKey: getGetFilesQueryKey() });
          queryClient.invalidateQueries({ queryKey: ["files", "consultation-files"] });
          queryClient.invalidateQueries({ queryKey: ["files", "shared-with-me"] });
        },
        onError: () => {
          toast.error(t("uploadFailed"));
        },
      }
    );
  }

  // Download / Preview handler
  async function handleDownloadOrPreview(fileId: string, fileName: string, isPreviewOnly: boolean = false) {
    try {
      if (isPreviewOnly) {
        setPreviewingFileId(fileId);
      } else {
        setDownloadingFileId(fileId);
      }
      const blob = await apiFetchBlob(`/files/${fileId}/stream`);
      const url = URL.createObjectURL(blob);

      if (isPreviewOnly || blob.type.startsWith("image/") || blob.type === "application/pdf") {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch {
      toast.error(t("downloadFailed"));
    } finally {
      setDownloadingFileId(null);
      setPreviewingFileId(null);
    }
  }

  // Delete handler
  function handleDelete(fileId: string) {
    if (!confirm(t("deleteConfirm"))) return;
    deleteFile(
      { fileId },
      {
        onSuccess: () => {
          toast.success(t("documentDeleted"));
          queryClient.invalidateQueries({ queryKey: getGetFilesQueryKey() });
          queryClient.invalidateQueries({ queryKey: ["files", "consultation-files"] });
          queryClient.invalidateQueries({ queryKey: ["files", "shared-with-me"] });
        },
        onError: () => {
          toast.error(t("deleteFailed"));
        },
      }
    );
  }

  // Share handler
  async function handleShare() {
    if (!sharingFileId || !shareEmail.trim()) return;
    setIsSharing(true);
    try {
      const res = (await apiFetchEnvelope(`/files/${sharingFileId}/share`, {
        method: "POST",
        body: JSON.stringify({ sharedWith: shareEmail.trim() }),
        headers: { "Content-Type": "application/json" },
      })) as { status?: number };

      if (res.status === 200 || res.status === 201) {
        toast.success(t("shareSuccess"));
        setSharingFileId(null);
        setShareEmail("");
      } else {
        toast.error(t("shareFailedCheckId"));
      }
    } catch {
      toast.error(t("shareFailedCheckId"));
    } finally {
      setIsSharing(false);
    }
  }

  const isLoadingTotal = isLoadingVault || isLoadingConsultations || isLoadingShared;

  return (
    <div className="mx-auto max-w-[1120px] space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      {/* Header & Vault Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-brand-dark dark:text-gray-100">
              {t("title")}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-brand-dark/15 dark:border-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-dark/70 dark:text-white/70">
              {allDocuments.length} total
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>

        {/* Vault Security Pill with Pluralization */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300 self-start sm:self-auto shrink-0 shadow-xs">
          <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
          <span>
            {vaultDocuments.length === 1
              ? t("storageTelemetrySingular", { size: formatSize(totalStorageBytes) })
              : t("storageTelemetryPlural", {
                  count: vaultDocuments.length,
                  size: formatSize(totalStorageBytes),
                })}
          </span>
        </div>
      </div>

      {/* Tabs Navigation (Industrial Clio/MyCase Multi-Vault Model) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-brand-border/15 dark:border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "all"
              ? "bg-brand-dark text-white dark:bg-white dark:text-black shadow-xs"
              : "text-brand-dark/60 hover:bg-brand-dark/[0.04] dark:text-white/60 dark:hover:bg-white/[0.04]"
          }`}
        >
          <FolderOpen size={15} />
          <span>{t("tabAll")}</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              activeTab === "all"
                ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                : "bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white"
            }`}
          >
            {tabCounts.all}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("vault")}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "vault"
              ? "bg-brand-dark text-white dark:bg-white dark:text-black shadow-xs"
              : "text-brand-dark/60 hover:bg-brand-dark/[0.04] dark:text-white/60 dark:hover:bg-white/[0.04]"
          }`}
        >
          <Lock size={14} />
          <span>{t("tabVault")}</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              activeTab === "vault"
                ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                : "bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white"
            }`}
          >
            {tabCounts.vault}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("consultations")}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "consultations"
              ? "bg-brand-dark text-white dark:bg-white dark:text-black shadow-xs"
              : "text-brand-dark/60 hover:bg-brand-dark/[0.04] dark:text-white/60 dark:hover:bg-white/[0.04]"
          }`}
        >
          <Briefcase size={14} />
          <span>{t("tabConsultation")}</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              activeTab === "consultations"
                ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                : "bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white"
            }`}
          >
            {tabCounts.consultations}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("shared")}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === "shared"
              ? "bg-brand-dark text-white dark:bg-white dark:text-black shadow-xs"
              : "text-brand-dark/60 hover:bg-brand-dark/[0.04] dark:text-white/60 dark:hover:bg-white/[0.04]"
          }`}
        >
          <Users size={14} />
          <span>{t("tabShared")}</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              activeTab === "shared"
                ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                : "bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white"
            }`}
          >
            {tabCounts.shared}
          </span>
        </button>
      </div>

      {/* Drag & Drop File Upload Zone (Shown primarily on All & My Vault) */}
      {(activeTab === "all" || activeTab === "vault") && (
        <div
          onClick={() => !isUploading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!isUploading) setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
            if (isUploading) return;
            const file = e.dataTransfer.files?.[0];
            if (file) handleUpload(file);
          }}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
            isDraggingOver
              ? "border-brand-dark bg-brand-dark/[0.04] dark:border-white dark:bg-white/[0.04] scale-[1.01]"
              : "border-brand-border/40 bg-brand-dark/[0.01] hover:border-brand-dark/50 dark:border-white/20 dark:bg-white/[0.01] dark:hover:border-white/40"
          } ${isUploading ? "cursor-wait opacity-70" : "cursor-pointer"}`}
        >
          {isUploading ? (
            <Loader2 size={34} className="mb-3 animate-spin text-brand-dark dark:text-white" />
          ) : (
            <UploadCloud
              size={34}
              className={`mb-3 transition-transform ${
                isDraggingOver ? "-translate-y-1 text-brand-dark dark:text-white" : "text-brand-dark/40 dark:text-white/40"
              }`}
            />
          )}
          <p className="text-sm font-bold text-brand-dark dark:text-gray-100">
            {isUploading
              ? t("uploading")
              : isDraggingOver
              ? t("dropFilesHere")
              : t("dragAndDropHint")}
          </p>
          <p className="mt-1 text-xs text-brand-dark/50 dark:text-white/50">
            {t("uploadLimit")} • {t("suggestedDocs")}
          </p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* Filter and Search Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40 dark:text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-brand-border/20 bg-white dark:bg-neutral-900 pl-10 pr-4 py-2 text-xs sm:text-sm text-brand-dark dark:text-white placeholder:text-brand-dark/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-brand-dark/30 dark:border-white/10 dark:focus:ring-white/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* File Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setTypeFilter("all")}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              typeFilter === "all"
                ? "bg-brand-dark text-white dark:bg-white dark:text-black"
                : "border border-brand-border/20 bg-white text-brand-dark/70 hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-900 dark:text-white/70"
            }`}
          >
            {t("filterAllTypes")}
          </button>
          <button
            onClick={() => setTypeFilter("pdf")}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              typeFilter === "pdf"
                ? "bg-brand-dark text-white dark:bg-white dark:text-black"
                : "border border-brand-border/20 bg-white text-brand-dark/70 hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-900 dark:text-white/70"
            }`}
          >
            {t("filterPdf")}
          </button>
          <button
            onClick={() => setTypeFilter("image")}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              typeFilter === "image"
                ? "bg-brand-dark text-white dark:bg-white dark:text-black"
                : "border border-brand-border/20 bg-white text-brand-dark/70 hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-900 dark:text-white/70"
            }`}
          >
            {t("filterImages")}
          </button>
          <button
            onClick={() => setTypeFilter("docs")}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              typeFilter === "docs"
                ? "bg-brand-dark text-white dark:bg-white dark:text-black"
                : "border border-brand-border/20 bg-white text-brand-dark/70 hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-900 dark:text-white/70"
            }`}
          >
            {t("filterDocs")}
          </button>
        </div>
      </div>

      {/* Documents List / Table */}
      {isLoadingTotal ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl border border-brand-border/20 bg-gray-100 dark:border-white/10 dark:bg-neutral-900"
            />
          ))}
        </div>
      ) : isVaultError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {t("failedToLoad")}
        </div>
      ) : tabFilteredDocuments.length === 0 ? (
        /* Empty State Tailored Per Tab */
        <div className="rounded-2xl border border-brand-border/20 bg-white p-10 text-center dark:border-white/10 dark:bg-neutral-900">
          {activeTab === "consultations" ? (
            <div className="space-y-3 max-w-md mx-auto">
              <Briefcase size={36} className="mx-auto text-brand-dark/30 dark:text-white/30" />
              <p className="text-sm font-bold text-brand-dark dark:text-gray-100">
                {t("noConsultationDocs")}
              </p>
              <p className="text-xs text-brand-dark/60 dark:text-white/60">
                {t("noConsultationDocsDesc")}
              </p>
              <div className="pt-2">
                <Link
                  href="/consultations"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-dark px-4 py-2 text-xs font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black"
                >
                  <Sparkles size={13} />
                  <span>{t("bookConsultationCta")}</span>
                </Link>
              </div>
            </div>
          ) : activeTab === "shared" ? (
            <div className="space-y-2 max-w-md mx-auto">
              <Users size={36} className="mx-auto text-brand-dark/30 dark:text-white/30" />
              <p className="text-sm font-bold text-brand-dark dark:text-gray-100">
                {t("noSharedDocs")}
              </p>
              <p className="text-xs text-brand-dark/60 dark:text-white/60">
                {t("noSharedDocsDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-w-sm mx-auto">
              <FolderOpen size={36} className="mx-auto text-brand-dark/30 dark:text-white/30" />
              <p className="text-sm font-bold text-brand-dark dark:text-gray-100">
                {t("noDocuments")}
              </p>
              <p className="text-xs text-brand-dark/50 dark:text-white/50">
                {t("suggestedDocs")}
              </p>
            </div>
          )}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="rounded-2xl border border-brand-border/20 bg-white p-8 text-center dark:border-white/10 dark:bg-neutral-900">
          <p className="text-sm text-brand-dark/50 dark:text-white/50">
            {t("noDocumentsMatch", { query: searchQuery })}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-brand-border/20 bg-white shadow-xs overflow-hidden dark:border-white/10 dark:bg-neutral-900">
          {/* Mobile card view (< md) */}
          <div className="divide-y divide-brand-border/10 dark:divide-white/10 md:hidden">
            {filteredDocuments.map((doc) => {
              const isDownloading = downloadingFileId === doc.id;
              const isPreviewing = previewingFileId === doc.id;
              const isRemoving = isDeleting && deletingVars?.fileId === doc.id;
              const typeInfo = getFileTypeInfo(doc.mimeType, doc.fileName);

              return (
                <div key={`${doc.sourceType}-${doc.id}`} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-dark/5 dark:bg-white/10">
                        {typeInfo.icon}
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => handleDownloadOrPreview(doc.id, doc.fileName, true)}
                          className="text-left text-sm font-semibold text-brand-dark hover:underline dark:text-gray-100 break-words leading-tight"
                        >
                          {doc.fileName}
                        </button>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className={`inline-block rounded-md border px-1.5 py-0.2 text-[10px] font-semibold ${typeInfo.badgeStyle}`}>
                            {typeInfo.label}
                          </span>
                          {doc.sourceType === "consultation" && (
                            <span className="rounded-md border border-blue-200 bg-blue-50/80 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300">
                              {doc.caseTitle || "Consultation"}
                            </span>
                          )}
                          {doc.sourceType === "shared" && doc.sharedBy && (
                            <span className="rounded-md border border-purple-200 bg-purple-50/80 px-1.5 py-0.2 text-[10px] font-semibold text-purple-700 dark:border-purple-900/40 dark:bg-purple-950/40 dark:text-purple-300">
                              {t("sharedByLabel")} {doc.sharedBy.firstName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold shrink-0 ${SENSITIVITY_STYLE[doc.sensitivity] ?? SENSITIVITY_STYLE.PRIVATE}`}>
                      {t.has(`sensitivity.${doc.sensitivity}`) ? t(`sensitivity.${doc.sensitivity}`) : doc.sensitivity}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-brand-dark/50 dark:text-white/50 space-x-2">
                      <span>{formatSize(doc.fileSize)}</span>
                      <span>•</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownloadOrPreview(doc.id, doc.fileName, true)}
                        disabled={isPreviewOnlyBusy(isPreviewing)}
                        title={t("preview")}
                        className="p-1.5 rounded-lg text-brand-dark/60 hover:bg-brand-dark/5 hover:text-brand-dark dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white disabled:opacity-50"
                      >
                        {isPreviewing ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                      </button>

                      <button
                        onClick={() => handleDownloadOrPreview(doc.id, doc.fileName, false)}
                        disabled={isDownloading}
                        title={t("download")}
                        className="p-1.5 rounded-lg text-brand-dark/60 hover:bg-brand-dark/5 hover:text-brand-dark dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white disabled:opacity-50"
                      >
                        {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                      </button>

                      {doc.canShare && (
                        <button
                          onClick={() => {
                            setSharingFileId(doc.id);
                            setSharingFileName(doc.fileName);
                            setShareEmail("");
                          }}
                          title={t("share")}
                          className="p-1.5 rounded-lg text-brand-dark/60 hover:bg-brand-dark/5 hover:text-brand-dark dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <Share2 size={15} />
                        </button>
                      )}

                      {doc.canDelete && (
                        <button
                          onClick={() => handleDelete(doc.id)}
                          disabled={isRemoving}
                          title={t("cancel")}
                          className="p-1.5 rounded-lg text-red-500/70 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 disabled:opacity-50"
                        >
                          {isRemoving ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table view (md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-dark/[0.02] text-xs font-semibold text-brand-dark/60 dark:bg-white/[0.02] dark:text-white/60 border-b border-brand-border/10 dark:border-white/10">
                <tr>
                  <th className="px-5 py-3.5">{t("colName")}</th>
                  <th className="px-4 py-3.5">{t("colType")}</th>
                  <th className="px-4 py-3.5">{t("colMatter")}</th>
                  <th className="px-4 py-3.5">{t("colSize")}</th>
                  <th className="px-4 py-3.5">{t("colUploaded")}</th>
                  <th className="px-4 py-3.5">{t("colSensitivity")}</th>
                  <th className="px-5 py-3.5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/10 dark:divide-white/10">
                {filteredDocuments.map((doc) => {
                  const isDownloading = downloadingFileId === doc.id;
                  const isPreviewing = previewingFileId === doc.id;
                  const isRemoving = isDeleting && deletingVars?.fileId === doc.id;
                  const typeInfo = getFileTypeInfo(doc.mimeType, doc.fileName);

                  return (
                    <tr key={`${doc.sourceType}-${doc.id}`} className="hover:bg-brand-dark/[0.015] dark:hover:bg-white/[0.015] transition-colors">
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-dark/5 dark:bg-white/10">
                            {typeInfo.icon}
                          </div>
                          <div className="min-w-0 max-w-[240px]">
                            <button
                              onClick={() => handleDownloadOrPreview(doc.id, doc.fileName, true)}
                              className="text-left text-sm font-semibold text-brand-dark hover:underline dark:text-gray-100 truncate block w-full"
                              title={doc.fileName}
                            >
                              {doc.fileName}
                            </button>
                            <span className="text-[11px] text-brand-dark/45 dark:text-white/45">
                              {doc.sourceType === "vault"
                                ? t("tabVault")
                                : doc.sourceType === "consultation"
                                ? t("tabConsultation")
                                : t("tabShared")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${typeInfo.badgeStyle}`}>
                          {typeInfo.label}
                        </span>
                      </td>

                      {/* Context / Matter */}
                      <td className="px-4 py-3.5 text-xs text-brand-dark/70 dark:text-white/70">
                        {doc.sourceType === "consultation" ? (
                          <div>
                            <p className="font-semibold text-brand-dark dark:text-white truncate max-w-[150px]">
                              {doc.caseTitle || "Matter"}
                            </p>
                            {doc.expertName && (
                              <p className="text-[10px] text-brand-dark/50 dark:text-white/50">
                                {doc.expertName}
                              </p>
                            )}
                          </div>
                        ) : doc.sourceType === "shared" && doc.sharedBy ? (
                          <div>
                            <p className="font-semibold text-purple-700 dark:text-purple-300 truncate max-w-[150px]">
                              {doc.sharedBy.firstName} {doc.sharedBy.lastName}
                            </p>
                            <p className="text-[10px] text-brand-dark/50 dark:text-white/50 truncate max-w-[150px]">
                              {doc.sharedBy.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-brand-dark/40 dark:text-white/40">—</span>
                        )}
                      </td>

                      {/* Size */}
                      <td className="px-4 py-3.5 text-xs text-brand-dark/70 dark:text-white/70 font-mono">
                        {formatSize(doc.fileSize)}
                      </td>

                      {/* Uploaded date */}
                      <td className="px-4 py-3.5 text-xs text-brand-dark/70 dark:text-white/70">
                        {new Date(doc.createdAt).toLocaleDateString(locale, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Sensitivity */}
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${SENSITIVITY_STYLE[doc.sensitivity] ?? SENSITIVITY_STYLE.PRIVATE}`}>
                          {t.has(`sensitivity.${doc.sensitivity}`) ? t(`sensitivity.${doc.sensitivity}`) : doc.sensitivity}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDownloadOrPreview(doc.id, doc.fileName, true)}
                            disabled={isPreviewOnlyBusy(isPreviewing)}
                            title={t("preview")}
                            className="p-1.5 rounded-lg text-brand-dark/60 hover:bg-brand-dark/5 hover:text-brand-dark dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white disabled:opacity-50"
                          >
                            {isPreviewing ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                          </button>

                          <button
                            onClick={() => handleDownloadOrPreview(doc.id, doc.fileName, false)}
                            disabled={isDownloading}
                            title={t("download")}
                            className="p-1.5 rounded-lg text-brand-dark/60 hover:bg-brand-dark/5 hover:text-brand-dark dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white disabled:opacity-50"
                          >
                            {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                          </button>

                          {doc.canShare && (
                            <button
                              onClick={() => {
                                setSharingFileId(doc.id);
                                setSharingFileName(doc.fileName);
                                setShareEmail("");
                              }}
                              title={t("share")}
                              className="p-1.5 rounded-lg text-brand-dark/60 hover:bg-brand-dark/5 hover:text-brand-dark dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                            >
                              <Share2 size={15} />
                            </button>
                          )}

                          {doc.canDelete && (
                            <button
                              onClick={() => handleDelete(doc.id)}
                              disabled={isRemoving}
                              title={t("cancel")}
                              className="p-1.5 rounded-lg text-red-500/70 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 disabled:opacity-50"
                            >
                              {isRemoving ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Encrypted Vault Security Guarantee Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-border/20 bg-white p-4 sm:p-5 shadow-xs dark:border-white/10 dark:bg-neutral-900">
        <Lock size={18} className="mt-0.5 shrink-0 text-brand-dark dark:text-white" />
        <div>
          <p className="text-sm font-bold text-brand-dark dark:text-gray-100">
            {t("encryptedStorage")}
          </p>
          <p className="mt-0.5 text-xs text-brand-dark/60 dark:text-white/60 leading-relaxed">
            {t("encryptedStorageDesc")}
          </p>
        </div>
      </div>

      {/* Share Modal with Email / User ID Resolution */}
      {sharingFileId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900 border border-brand-border/20 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[16px] font-bold text-brand-dark dark:text-white">
                  {t("shareDocument")}
                </h3>
                {sharingFileName && (
                  <p className="text-xs text-brand-dark/50 dark:text-white/50 truncate max-w-[280px]">
                    {sharingFileName}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setSharingFileId(null);
                  setShareEmail("");
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-[13px] text-brand-dark/70 dark:text-white/70 mb-4 leading-relaxed">
              {t("shareDocumentDesc")}
            </p>

            <input
              type="text"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder={t("sharePlaceholder")}
              className="w-full rounded-xl border border-brand-border/20 bg-brand-dark/[0.02] px-4 py-3 text-[13px] text-brand-dark outline-none placeholder:text-brand-dark/40 focus:border-brand-dark dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
            />

            <div className="mt-5 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setSharingFileId(null);
                  setShareEmail("");
                }}
                className="rounded-xl border border-brand-border/20 px-5 py-2.5 text-[12px] font-semibold text-brand-dark/70 hover:bg-brand-dark/[0.04] dark:border-white/10 dark:text-white/70"
              >
                {t("cancel")}
              </button>

              <button
                onClick={handleShare}
                disabled={!shareEmail.trim() || isSharing}
                className="flex items-center gap-1.5 rounded-xl bg-brand-dark px-5 py-2.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-black"
              >
                {isSharing ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Share2 size={13} />
                )}
                {isSharing ? t("sharing") : t("share")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isPreviewOnlyBusy(busy: boolean) {
  return busy;
}
