"use client";

import { useRef, useState, useMemo } from "react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
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
} from "lucide-react";
import {
  useGetFiles,
  useDeleteFilesFileId,
  usePostFilesUpload,
  getGetFilesQueryKey,
} from "@/api/generated";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetchBlob, apiFetchEnvelope } from "@/lib/api/client";

const SENSITIVITY_STYLE: Record<string, string> = {
  PUBLIC: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  PRIVATE: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CONFIDENTIAL: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

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

  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [sharingFileId, setSharingFileId] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError } = useGetFiles();
  const { mutate: deleteFile, isPending: isDeleting, variables: deletingVars } = useDeleteFilesFileId();
  const { mutate: uploadFile, isPending: isUploading } = usePostFilesUpload();

  const files = useMemo(() => {
    return data?.status === 200 ? (data.data.data ?? []) : [];
  }, [data]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter(
      (doc) =>
        doc.fileName.toLowerCase().includes(q) ||
        doc.mimeType.toLowerCase().includes(q)
    );
  }, [files, searchQuery]);

  const totalStorageBytes = useMemo(() => {
    return files.reduce((sum, f) => sum + (f.fileSize || 0), 0);
  }, [files]);

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
        },
        onError: () => {
          toast.error(t("uploadFailed"));
        },
      }
    );
  }

  async function handleDownload(fileId: string, fileName: string) {
    try {
      setDownloadingFileId(fileId);
      const blob = await apiFetchBlob(`/files/${fileId}/stream`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      if (blob.type.startsWith("image/") || blob.type === "application/pdf") {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      toast.error(t("downloadFailed"));
    } finally {
      setDownloadingFileId(null);
    }
  }

  function handleDelete(fileId: string) {
    if (!confirm(t("deleteConfirm"))) return;
    deleteFile(
      { fileId },
      {
        onSuccess: () => {
          toast.success(t("documentDeleted"));
          queryClient.invalidateQueries({ queryKey: getGetFilesQueryKey() });
        },
        onError: () => {
          toast.error(t("deleteFailed"));
        },
      }
    );
  }

  async function handleShare() {
    if (!sharingFileId || !shareEmail.trim()) return;
    setIsSharing(true);
    try {
      const res = (await apiFetchEnvelope(`/files/${sharingFileId}/share`, {
        method: "POST",
        body: JSON.stringify({ sharedWithId: shareEmail.trim() }),
        headers: { "Content-Type": "application/json" },
      })) as { status?: number };
      if (res.status === 200 || res.status === 201) {
        toast.success(t("shareSuccess"));
        setSharingFileId(null);
        setShareEmail("");
      } else {
        toast.error(t("shareFailed"));
      }
    } catch {
      toast.error(t("shareFailedCheckId"));
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1080px] space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      {/* Header & Vault Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-[22px] font-bold text-brand-dark dark:text-gray-100">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300 self-start sm:self-auto shrink-0">
          <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span>
            {t("storageTelemetry", {
              count: files.length,
              size: formatSize(totalStorageBytes),
            })}
          </span>
        </div>
      </div>

      {/* Drag & Drop File Upload Zone */}
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
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          isDraggingOver
            ? "border-brand-dark bg-brand-dark/[0.04] dark:border-white dark:bg-white/[0.04] scale-[1.01]"
            : "border-brand-border/40 bg-brand-dark/[0.01] hover:border-brand-dark/50 dark:border-white/20 dark:bg-white/[0.01] dark:hover:border-white/40"
        } ${isUploading ? "cursor-wait opacity-70" : "cursor-pointer"}`}
      >
        {isUploading ? (
          <Loader2 size={36} className="mb-3 animate-spin text-brand-dark dark:text-white" />
        ) : (
          <UploadCloud
            size={36}
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

      {/* Filter and Search Bar */}
      {files.length > 0 && (
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40 dark:text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-brand-border/20 bg-white dark:bg-black pl-10 pr-4 py-2.5 text-xs sm:text-sm text-brand-dark dark:text-white placeholder:text-brand-dark/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-brand-dark/30 dark:border-white/10 dark:focus:ring-white/30"
          />
        </div>
      )}

      {/* Documents List / Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl border border-brand-border/20 bg-gray-100 dark:border-white/10 dark:bg-black"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {t("failedToLoad")}
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border border-brand-border/20 bg-white p-10 text-center dark:border-white/10 dark:bg-black">
          <FolderOpen size={36} className="mx-auto mb-3 text-brand-dark/30 dark:text-white/30" />
          <p className="text-sm font-bold text-brand-dark dark:text-gray-100">
            {t("noDocuments")}
          </p>
          <p className="mt-1 text-xs text-brand-dark/50 dark:text-white/50 max-w-sm mx-auto">
            {t("suggestedDocs")}
          </p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="rounded-2xl border border-brand-border/20 bg-white p-8 text-center dark:border-white/10 dark:bg-black">
          <p className="text-sm text-brand-dark/50 dark:text-white/50">
            {t("noDocumentsMatch", { query: searchQuery })}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-brand-border/20 bg-white shadow-sm dark:border-white/10 dark:bg-black">
          {/* Mobile card view (< md) */}
          <div className="divide-y divide-brand-border/10 dark:divide-white/10 md:hidden">
            {filteredFiles.map((doc) => {
              const isDownloading = downloadingFileId === doc.id;
              const isRemoving = isDeleting && deletingVars?.fileId === doc.id;
              return (
                <div key={doc.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-dark/5 text-brand-dark dark:bg-white/10 dark:text-white">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-dark dark:text-gray-100 break-words">{doc.fileName}</p>
                        <p className="text-[11px] text-brand-dark/50 dark:text-white/50 font-mono truncate">{doc.mimeType}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${SENSITIVITY_STYLE[doc.sensitivity] ?? SENSITIVITY_STYLE.PRIVATE}`}>
                      {t.has(`sensitivity.${doc.sensitivity}`) ? t(`sensitivity.${doc.sensitivity}`) : doc.sensitivity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-brand-dark/50 dark:text-white/50 space-x-2">
                      <span>{formatSize(doc.fileSize)}</span>
                      <span>·</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleDownload(doc.id, doc.fileName)} disabled={isDownloading} title={t("download")} className="p-1.5 rounded-lg text-brand-dark/50 hover:bg-brand-dark/5 hover:text-brand-dark dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white disabled:opacity-50">
                        {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                      </button>
                      <button onClick={() => { setSharingFileId(doc.id); setShareEmail(""); }} title={t("share")} className="p-1.5 rounded-lg text-brand-dark/50 hover:bg-brand-dark/5 hover:text-brand-dark dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white">
                        <Share2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(doc.id)} disabled={isRemoving} title={t("cancel")} className="p-1.5 rounded-lg text-red-500/70 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 disabled:opacity-50">
                        {isRemoving ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
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
                  <th className="px-4 py-3.5">{t("colSize")}</th>
                  <th className="px-4 py-3.5">{t("colUploaded")}</th>
                  <th className="px-4 py-3.5">{t("colSensitivity")}</th>
                  <th className="px-4 py-3.5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/10 dark:divide-white/10">
                {filteredFiles.map((doc) => {
                  const isDownloading = downloadingFileId === doc.id;
                  const isRemoving = isDeleting && deletingVars?.fileId === doc.id;
                  return (
                    <tr key={doc.id} className="hover:bg-brand-dark/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-dark/5 text-brand-dark dark:bg-white/10 dark:text-white">
                            <FileText size={15} />
                          </div>
                          <span className="text-sm font-semibold text-brand-dark dark:text-gray-100 max-w-[200px] truncate" title={doc.fileName}>
                            {doc.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-brand-dark/60 dark:text-white/60 font-mono">{doc.mimeType}</td>
                      <td className="px-4 py-3.5 text-xs text-brand-dark/60 dark:text-white/60">{formatSize(doc.fileSize)}</td>
                      <td className="px-4 py-3.5 text-xs text-brand-dark/60 dark:text-white/60">
                        {new Date(doc.createdAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${SENSITIVITY_STYLE[doc.sensitivity] ?? SENSITIVITY_STYLE.PRIVATE}`}>
                          {t.has(`sensitivity.${doc.sensitivity}`) ? t(`sensitivity.${doc.sensitivity}`) : doc.sensitivity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleDownload(doc.id, doc.fileName)} disabled={isDownloading} title={t("download")} className="p-1.5 rounded-lg text-brand-dark/50 hover:bg-brand-dark/5 hover:text-brand-dark dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white disabled:opacity-50">
                            {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                          </button>
                          <button onClick={() => { setSharingFileId(doc.id); setShareEmail(""); }} title={t("share")} className="p-1.5 rounded-lg text-brand-dark/50 hover:bg-brand-dark/5 hover:text-brand-dark dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white">
                            <Share2 size={15} />
                          </button>
                          <button onClick={() => handleDelete(doc.id)} disabled={isRemoving} title={t("cancel")} className="p-1.5 rounded-lg text-red-500/70 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 disabled:opacity-50">
                            {isRemoving ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          </button>
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

      {/* Encrypted Vault Security Guarantee */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand-border/20 bg-white p-4 sm:p-5 shadow-sm dark:border-white/10 dark:bg-black">
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

      {/* Share Modal */}
      {sharingFileId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-brand-border/20 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-brand-dark dark:text-white">
                {t("shareDocument")}
              </h3>
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
            <p className="text-[13px] text-brand-dark/60 dark:text-white/60 mb-4">
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
