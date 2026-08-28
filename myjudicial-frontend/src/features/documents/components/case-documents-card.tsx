"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { FileText, Download, UploadCloud, Loader2, FolderOpen } from "lucide-react";
import { usePostFilesUpload } from "@/api/generated";
import { apiFetch, apiFetchBlob } from "@/lib/api/client";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { LoadingSpinner } from "@/shared/components/dashboard/loading";
import { ErrorState } from "@/shared/components/dashboard/error-state";
import { getErrorMessage } from "@/lib/utils";

const MAX_CASE_FILE_SIZE = 20 * 1024 * 1024; // 20 MB (case-attachment limit)

interface CaseDocument {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sensitivity: string;
  createdAt: string;
}

interface CaseDocumentsResult {
  data: CaseDocument[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const SENSITIVITY_STYLE: Record<string, string> = {
  PUBLIC: "bg-muted text-muted-foreground",
  PRIVATE: "bg-primary/10 text-primary",
  CONFIDENTIAL: "bg-destructive/10 text-destructive",
};

/**
 * Booking-scoped "Case Documents" panel.
 *
 * Lists every document attached to a booking (both the client's and the
 * assigned expert's uploads). Participants can also upload case documents here.
 * Access is enforced server-side: only the booking's citizen, its assigned
 * expert, or an ADMIN can list/read these files.
 */
export function CaseDocumentsCard({
  bookingId,
  canUpload = true,
}: {
  bookingId: string;
  canUpload?: boolean;
}) {
  const t = useTranslations("features.documents");
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { mutate: uploadFile, isPending: isUploading } = usePostFilesUpload();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["booking-documents", bookingId],
    queryFn: async () => {
      const res = await apiFetch<CaseDocumentsResult>(`/files/by-booking/${bookingId}?page=1&limit=50`);
      return res;
    },
    retry: false,
  });

  const documents = Array.isArray(data?.data) ? data!.data : [];

  function handleUpload(file: File) {
    if (file.size > MAX_CASE_FILE_SIZE) {
      toast.error(t("fileTooLarge"));
      return;
    }
    const metadata = JSON.stringify({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      category: "case-attachment",
      sensitivity: "PRIVATE",
      bookingId,
    });
    uploadFile(
      { data: { file, metadata } },
      {
        onSuccess: () => {
          toast.success(t("documentUploaded"));
          queryClient.invalidateQueries({ queryKey: ["booking-documents", bookingId] });
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, t("uploadFailed")));
        },
      }
    );
  }

  async function handleDownload(fileId: string) {
    try {
      setDownloadingId(fileId);
      const blob = await apiFetchBlob(`/files/${fileId}/stream`);
      const url = URL.createObjectURL(blob);
      if (blob.type.startsWith("image/") || blob.type === "application/pdf") {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = `case-document-${fileId.substring(0, 6)}`;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      toast.error(getErrorMessage(error, t("downloadFailed")));
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FolderOpen size={14} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Case Documents</h3>
            <p className="text-xs text-muted-foreground">
              Files shared between you and the client for this case.
            </p>
          </div>
        </div>
        {canUpload && (
          <Button size="sm" variant="outline" disabled={isUploading} onClick={() => inputRef.current?.click()}>
            {isUploading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
            {isUploading ? "Uploading..." : "Add document"}
          </Button>
        )}
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

      <div className="px-5 py-4">
        {isLoading ? (
          <LoadingSpinner label="Loading case documents..." />
        ) : isError ? (
          <ErrorState
            title="Failed to load case documents"
            message="Could not load the documents for this booking."
            onRetry={() => refetch()}
            retryLabel="Retry"
          />
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <FileText size={22} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No case documents yet.</p>
            <p className="text-xs text-muted-foreground/70">
              Upload a file to share it with the other party in this case.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2.5 pr-4 font-medium">Name</th>
                  <th className="py-2.5 pr-4 font-medium">Type</th>
                  <th className="py-2.5 pr-4 font-medium">Size</th>
                  <th className="py-2.5 pr-4 font-medium">Uploaded</th>
                  <th className="py-2.5 pr-4 font-medium">Sensitivity</th>
                  <th className="py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="shrink-0 text-muted-foreground" />
                        <span className="font-medium text-foreground">{doc.fileName}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">{doc.mimeType}</td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">{formatSize(doc.fileSize)}</td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          SENSITIVITY_STYLE[doc.sensitivity] ?? SENSITIVITY_STYLE.PRIVATE
                        }`}
                      >
                        {doc.sensitivity}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Download"
                        disabled={downloadingId === doc.id}
                        onClick={() => handleDownload(doc.id)}
                      >
                        {downloadingId === doc.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Download size={14} />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}