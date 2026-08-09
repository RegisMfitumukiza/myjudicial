"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { FileText, Download, Trash2, Loader2, UploadCloud, Lock, Share2, X } from "lucide-react";
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
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsPanel() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("features.documents");
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [sharingFileId, setSharingFileId] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const { data, isLoading, isError } = useGetFiles();
  const { mutate: deleteFile, isPending: isDeleting, variables: deletingVars } = useDeleteFilesFileId();
  const { mutate: uploadFile, isPending: isUploading } = usePostFilesUpload();

  const files = data?.status === 200 ? data.data.data : [];

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
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : t("uploadFailed"));
        },
      }
    );
  }

  async function handleDownload(fileId: string) {
    try {
      setDownloadingFileId(fileId);
      const blob = await apiFetchBlob(`/files/${fileId}/stream`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document-${fileId.substring(0, 6)}`; // Or extract from blob if you want
      // For preview in new tab (optional): 
      if (blob.type.startsWith("image/") || blob.type === "application/pdf") {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("downloadFailed"));
    } finally {
      setDownloadingFileId(null);
    }
  }

  function handleDelete(fileId: string) {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    deleteFile(
      { fileId },
      {
        onSuccess: () => {
          toast.success(t("documentDeleted"));
          queryClient.invalidateQueries({ queryKey: getGetFilesQueryKey() });
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : t("deleteFailed"));
        },
      }
    );
  }

  async function handleShare() {
    if (!sharingFileId || !shareEmail.trim()) return;
    setIsSharing(true);
    try {
      const res: any = await apiFetchEnvelope(`/files/${sharingFileId}/share`, {
        method: "POST",
        body: JSON.stringify({ sharedWithId: shareEmail.trim() }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 200 || res.status === 201) {
        toast.success("Document shared successfully");
        setSharingFileId(null);
        setShareEmail("");
      } else {
        toast.error("Failed to share document");
      }
    } catch {
      toast.error("Failed to share document. Check the user ID is correct.");
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1080px] space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-[22px] font-bold text-brand-dark dark:text-gray-100">My Documents</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your uploaded documents and case files</p>
      </div>

      <div
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-border bg-gray-50/50 p-8 text-center transition-colors dark:border-gray-600 dark:bg-gray-800/50 ${
          isUploading ? "cursor-wait opacity-70" : "cursor-pointer hover:border-brand-blue/40 hover:bg-brand-canvas dark:hover:border-brand-blue/40"
        }`}
      >
        {isUploading ? (
          <Loader2 size={32} className="mb-3 animate-spin text-brand-blue" />
        ) : (
          <UploadCloud size={32} className="mb-3 text-gray-300 dark:text-gray-600" />
        )}
        <p className="text-sm font-medium text-brand-dark dark:text-gray-100">
          {isUploading ? "Uploading..." : "Click to upload a document"}
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Up to 20 MB. Encrypted at rest.</p>
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

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl border border-brand-border/20 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          Failed to load documents. Please try again.
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-xl border border-brand-border/20 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-400 dark:text-gray-500">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-brand-border/20 shadow-md dark:border-gray-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-b border-brand-border/10 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3">Sensitivity</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {files.map((doc) => {
                const isDownloading = downloadingFileId === doc.id;
                const isRemoving = isDeleting && deletingVars?.fileId === doc.id;
                return (
                  <tr key={doc.id} className="border-t border-brand-border/10 dark:border-gray-700">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-gray-400" />
                        <span className="text-sm font-medium text-brand-dark dark:text-gray-100">{doc.fileName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{doc.mimeType}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{formatSize(doc.fileSize)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(doc.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SENSITIVITY_STYLE[doc.sensitivity] ?? SENSITIVITY_STYLE.PRIVATE}`}>
                        {doc.sensitivity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleDownload(doc.id)} disabled={isDownloading} className="text-gray-400 hover:text-brand-blue disabled:opacity-50">
                          {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        </button>
                        <button onClick={() => { setSharingFileId(doc.id); setShareEmail(""); }} className="text-gray-400 hover:text-brand-blue">
                          <Share2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(doc.id)} disabled={isRemoving} className="text-gray-400 hover:text-red-500 disabled:opacity-50">
                          {isRemoving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-brand-border/20 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-900">
        <Lock size={16} className="mt-0.5 shrink-0 text-gray-400" />
        <div>
          <p className="text-sm font-semibold text-brand-dark dark:text-gray-100">Encrypted storage</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Documents are encrypted at rest. Only you can access your own files.
          </p>
        </div>
      </div>

      {/* Share Modal */}
      {sharingFileId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-brand-dark dark:text-white">Share Document</h3>
              <button onClick={() => { setSharingFileId(null); setShareEmail(""); }} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-4">
              Enter the user ID of the person you want to share this document with.
            </p>
            <input
              type="text"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="User ID (UUID)"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[13px] text-brand-dark outline-none placeholder:text-gray-400 focus:border-brand-dark dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleShare}
                disabled={!shareEmail.trim() || isSharing}
                className="flex items-center gap-1.5 rounded-xl bg-brand-dark px-5 py-2.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-brand-dark"
              >
                {isSharing ? <Loader2 size={12} className="animate-spin" /> : <Share2 size={12} />}
                {isSharing ? "Sharing..." : "Share"}
              </button>
              <button
                onClick={() => { setSharingFileId(null); setShareEmail(""); }}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
