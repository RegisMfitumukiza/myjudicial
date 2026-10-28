"use client";

import { useState } from "react";
import {
  X,
  Download,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  File as FileGenericIcon,
} from "lucide-react";

interface DocumentPreviewProps {
  file: {
    id: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    createdAt: string;
  };
  /** Called by parent to obtain a blob URL for download/preview */
  onDownload: (fileId: string, fileName: string) => void | Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreview({ file, isOpen, onClose, onDownload }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!isOpen) return null;

  const isPDF = file.mimeType === "application/pdf";
  const isImage = file.mimeType.startsWith("image/");
  const isWord =
    file.mimeType.includes("wordprocessingml") ||
    file.mimeType === "application/msword";

  const handleDownload = () => void onDownload(file.id, file.originalName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative h-[90vh] w-[90vw] max-w-5xl rounded-lg bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {file.originalName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {(file.fileSize / (1024 * 1024)).toFixed(1)} MB &bull;{" "}
              {new Date(file.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 ml-4">
            {(isPDF || isImage) && (
              <>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-10 text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setRotation((rotation + 90) % 360)}
                  className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Rotate"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
              </>
            )}

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              title="Download"
            >
              <Download className="h-4 w-4" />
              Download
            </button>

            <button
              onClick={onClose}
              className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(100%-4.5rem)] overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 overflow-auto p-4">
            {isPDF ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-500">
                <div
                  className="flex items-center justify-center border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800 rounded-lg"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transformOrigin: "center center",
                    minHeight: "24rem",
                    width: "18rem",
                  }}
                >
                  <div className="flex flex-col items-center gap-2 p-8">
                    <Eye className="h-12 w-12 text-gray-400" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      PDF document
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                      In-browser PDF rendering is not available. Download to
                      view the full document.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Download PDF
                </button>
              </div>
            ) : isImage ? (
              <div className="flex h-full items-center justify-center">
                {/* Images must be served via the authenticated /files/:id/stream endpoint.
                    The parent is responsible for calling onDownload which opens the blob URL.
                    We show a placeholder with a download CTA here — do NOT use a fake image URL. */}
                <div className="flex flex-col items-center gap-4 text-gray-500">
                  <div
                    className="flex items-center justify-center border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800 rounded-lg"
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transformOrigin: "center center",
                      minHeight: "16rem",
                      width: "16rem",
                    }}
                  >
                    <Eye className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 text-center max-w-xs">
                    Image files open via a secure download. Click below to open
                    the image.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Open Image
                  </button>
                </div>
              </div>
            ) : isWord ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-500">
                <FileText className="h-16 w-16 text-blue-500" />
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Microsoft Word Document
                </p>
                <p className="text-sm text-center text-gray-500 max-w-xs">
                  Word documents cannot be previewed in the browser. Download
                  to open in Microsoft Word or a compatible application.
                </p>
                <button
                  onClick={handleDownload}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Download to View
                </button>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-500">
                <FileGenericIcon className="h-16 w-16 text-gray-400" />
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Preview Not Available
                </p>
                <p className="text-sm text-center text-gray-500 max-w-xs">
                  This file type cannot be previewed directly. Download the
                  file to open it with a compatible application.
                </p>
                <button
                  onClick={handleDownload}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Download File
                </button>
              </div>
            )}
          </div>

          {/* Sidebar — File Information */}
          <div className="w-64 shrink-0 border-l border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 overflow-y-auto">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              File Information
            </h4>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  File Name
                </p>
                <p className="mt-0.5 text-sm text-gray-900 dark:text-gray-100 break-words">
                  {file.originalName}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Size
                </p>
                <p className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
                  {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Type
                </p>
                <p className="mt-0.5 text-sm text-gray-900 dark:text-gray-100 break-words">
                  {file.mimeType}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Uploaded
                </p>
                <p className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">
                  {new Date(file.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6">
              <button
                onClick={handleDownload}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Download Original
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
