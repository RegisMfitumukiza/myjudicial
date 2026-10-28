"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText,
  UploadCloud,
  Download,
  Loader2,
  X,
  AlertCircle,
  CheckCircle,
  Lock,
  Plus,
} from "lucide-react";
import { apiFetch, apiFetchBlob } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { useTranslations, useLocale } from "next-intl";

interface InRoomDocumentsPanelProps {
  bookingId: string;
  onClose: () => void;
}

interface ConsultationFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  sensitivity?: string;
  bookingId?: string | null;
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

function formatSize(bytes: number): string {
  if (!bytes || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function InRoomDocumentsPanel({
  bookingId,
  onClose,
}: InRoomDocumentsPanelProps) {
  const t = useTranslations("expertDashboard_consultation-room");
  const locale = useLocale();

  const [files, setFiles] = useState<ConsultationFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch documents attached to this consultation
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<{ data: ConsultationFile[] }>(
        "/files/consultation-files?limit=100"
      );
      if (res?.data && Array.isArray(res.data)) {
        // Filter files associated with this booking, or display all consultation files available to the user
        const bookingFiles = res.data.filter(
          (f) => !f.bookingId || f.bookingId === bookingId
        );
        setFiles(bookingFiles.length > 0 ? bookingFiles : res.data);
      }
    } catch (err) {
      console.error("Failed to fetch consultation files:", err);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(
        t("fileTooLarge", {
          defaultValue: "File size exceeds 20MB limit.",
        })
      );
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bookingId", bookingId);
      formData.append("sensitivity", "CONFIDENTIAL");
      formData.append("category", "consultation-document");

      setUploadProgress(40);

      await apiFetch("/files/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(100);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
      await fetchDocuments();
    } catch (err: any) {
      console.error("File upload failed:", err);
      setUploadError(err?.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle download
  const handleDownload = async (fileId: string, fileName: string) => {
    setDownloadingId(fileId);
    try {
      const blob = await apiFetchBlob(`/files/${fileId}/stream`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-gray-950 text-white border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">
            {t("inRoomDocumentsTitle", { defaultValue: "Shared Documents" })}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          title={t("closePanel", { defaultValue: "Close panel" })}
        >
          <X size={18} />
        </button>
      </div>

      {/* Upload Zone */}
      <div className="p-4 border-b border-white/10 bg-gray-900/40 shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="hidden"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className="group flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-gray-900/80 p-4 text-center cursor-pointer hover:border-blue-500/60 hover:bg-blue-950/20 transition-all"
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              <span className="text-xs text-white/80">
                {t("uploadingDocument", { defaultValue: "Encrypting & uploading..." })}
              </span>
              {uploadProgress !== null && (
                <div className="w-32 h-1.5 rounded-full bg-gray-800 overflow-hidden mt-1">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 mb-2 group-hover:scale-110 transition-transform">
                <UploadCloud size={18} />
              </div>
              <p className="text-xs font-semibold text-white">
                {t("uploadDocumentCTA", { defaultValue: "Share a document in this call" })}
              </p>
              <p className="mt-0.5 text-[10px] text-white/40">
                {t("supportedFormatsHint", {
                  defaultValue: "PDF, DOCX, JPG, PNG (up to 20MB)",
                })}
              </p>
            </>
          )}
        </div>

        {uploadError && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle size={13} className="shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle size={13} className="shrink-0" />
            <span>
              {t("documentSharedSuccess", {
                defaultValue: "Document securely uploaded and shared.",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-0">
        <div className="flex items-center justify-between text-xs text-white/50 mb-1">
          <span className="font-medium uppercase tracking-wider text-[10px]">
            {t("consultationFilesHeader", { defaultValue: "Available Documents" })} ({files.length})
          </span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
            <Lock size={10} />
            {t("encryptedVault", { defaultValue: "Confidential" })}
          </span>
        </div>

        {isLoading ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-white/50">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs">{t("loadingDocuments", { defaultValue: "Loading documents..." })}</span>
          </div>
        ) : files.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-center text-white/40">
            <FileText size={28} className="opacity-40" />
            <p className="text-xs">
              {t("noDocumentsShared", {
                defaultValue: "No documents shared for this consultation yet.",
              })}
            </p>
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-gray-900/60 p-3 hover:bg-gray-900 transition-colors"
            >
              <div className="min-w-0 flex-1 mr-3">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-blue-400 shrink-0" />
                  <p className="truncate text-xs font-semibold text-white">
                    {file.fileName}
                  </p>
                </div>
                <p className="mt-1 text-[10px] text-white/40">
                  {formatSize(file.fileSize)} &bull;{" "}
                  {new Date(file.createdAt).toLocaleDateString(locale, {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(file.id, file.fileName)}
                disabled={downloadingId === file.id}
                className="h-8 w-8 rounded-lg p-0 border-white/20 text-white hover:bg-white/10 shrink-0"
                title={t("download", { defaultValue: "Download" })}
              >
                {downloadingId === file.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
