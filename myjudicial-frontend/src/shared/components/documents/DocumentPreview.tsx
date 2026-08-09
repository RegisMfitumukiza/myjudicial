"use client";

import { useState } from "react";
import { X, Download, Share2, Eye, ZoomIn, ZoomOut, RotateCw, MessageSquare, Clock } from "lucide-react";
import { DocumentAnnotations } from "./DocumentAnnotations";
import { DocumentVersions } from "./DocumentVersions";

interface DocumentPreviewProps {
  file: {
    id: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    createdAt: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreview({ file, isOpen, onClose }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState<"preview" | "comments" | "versions">("preview");

  if (!isOpen) return null;

  const isPDF = file.mimeType === "application/pdf";
  const isImage = file.mimeType.startsWith("image/");
  const isWord = file.mimeType.includes("wordprocessingml");

  // Mock data for annotations and versions
  const mockAnnotations = [
    {
      id: "1",
      content: "This clause needs review - the termination notice period seems too short",
      author: "John Doe",
      authorRole: "CLIENT" as const,
      createdAt: "2026-07-06T10:30:00Z",
      resolved: false
    },
    {
      id: "2", 
      content: "Standard 30-day notice is typical for employment contracts in Rwanda",
      author: "Sarah Uwimana",
      authorRole: "EXPERT" as const,
      createdAt: "2026-07-06T11:15:00Z",
      resolved: true
    }
  ];

  const mockVersions = [
    {
      id: "v1",
      version: "1.0",
      fileName: file.originalName,
      fileSize: file.fileSize,
      createdAt: file.createdAt,
      createdBy: "John Doe",
      createdByRole: "CLIENT" as const,
      changeDescription: "Initial upload",
      isCurrentVersion: true
    }
  ];

  const handleDownload = () => {
    // Implement download functionality
    console.log("Download file:", file.id);
  };

  const handleShare = () => {
    // Implement share functionality
    console.log("Share file:", file.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative h-[90vh] w-[90vw] max-w-6xl rounded-lg bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{file.originalName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {(file.fileSize / (1024 * 1024)).toFixed(1)} MB • {new Date(file.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            {/* Tab Navigation */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 text-sm font-medium ${
                  activeTab === "preview" 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`px-3 py-1 text-sm font-medium ${
                  activeTab === "comments" 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <MessageSquare className="mr-1 inline h-3 w-3" />
                Comments
              </button>
              <button
                onClick={() => setActiveTab("versions")}
                className={`px-3 py-1 text-sm font-medium ${
                  activeTab === "versions" 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <Clock className="mr-1 inline h-3 w-3" />
                Versions
              </button>
            </div>

            {activeTab === "preview" && (isPDF || isImage) && (
              <>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                
                <span className="text-sm text-gray-600 dark:text-gray-400">{zoom}%</span>
                
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
              </>
            )}

            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />

            <button
              onClick={handleDownload}
              className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>

            <button
              onClick={handleShare}
              className="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
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
        <div className="flex h-[calc(100%-4rem)] overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 overflow-auto">
            {activeTab === "preview" && (
              <div className="p-4">
                {/* Document Preview Content */}
                {isPDF ? (
                  <div className="flex h-full items-center justify-center">
                    <div 
                      className="border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800"
                      style={{ 
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                        transformOrigin: 'center center'
                      }}
                    >
                      <div className="flex h-96 w-72 items-center justify-center text-gray-500">
                        <div className="text-center">
                          <Eye className="mx-auto mb-2 h-12 w-12" />
                          <p className="text-sm">PDF Preview</p>
                          <p className="text-xs">Click download to view full document</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isImage ? (
                  <div className="flex h-full items-center justify-center">
                    <img
                      src={`/api/placeholder-image?name=${encodeURIComponent(file.originalName)}`}
                      alt={file.originalName}
                      className="max-h-full max-w-full object-contain"
                      style={{ 
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                        transformOrigin: 'center center'
                      }}
                    />
                  </div>
                ) : isWord ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center text-gray-500">
                      <FileText className="mx-auto mb-4 h-16 w-16" />
                      <p className="text-lg font-medium">Microsoft Word Document</p>
                      <p className="mt-2 text-sm">Click download to view the document</p>
                      <button
                        onClick={handleDownload}
                        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                      >
                        Download to View
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Eye className="mx-auto mb-4 h-16 w-16" />
                      <p className="text-lg font-medium">Preview Not Available</p>
                      <p className="mt-2 text-sm">This file type cannot be previewed</p>
                      <button
                        onClick={handleDownload}
                        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                      >
                        Download File
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "comments" && (
              <DocumentAnnotations
                fileId={file.id}
                annotations={mockAnnotations}
                onAddAnnotation={(content) => console.log("Add annotation:", content)}
                onUpdateAnnotation={(id, content) => console.log("Update annotation:", id, content)}
                onDeleteAnnotation={(id) => console.log("Delete annotation:", id)}
                onResolveAnnotation={(id) => console.log("Resolve annotation:", id)}
              />
            )}

            {activeTab === "versions" && (
              <DocumentVersions
                fileId={file.id}
                versions={mockVersions}
                onDownloadVersion={(id) => console.log("Download version:", id)}
                onPreviewVersion={(id) => console.log("Preview version:", id)}
                onRestoreVersion={(id) => console.log("Restore version:", id)}
                onUploadNewVersion={(file, desc) => console.log("Upload new version:", file.name, desc)}
              />
            )}
          </div>

          {/* Sidebar - Only show for preview tab */}
          {activeTab === "preview" && (
            <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">File Information</h4>
              
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">File Name</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{file.originalName}</p>
                </div>
                
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Size</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Type</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{file.mimeType}</p>
                </div>
                
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Uploaded</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(file.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleDownload}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Download Original
                </button>
                
                <button
                  onClick={handleShare}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Share with Lawyer
                </button>
              </div>

              {/* Quick Stats */}
              <div className="mt-6">
                <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">Activity</h5>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Comments</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{mockAnnotations.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Versions</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{mockVersions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Last Modified</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Import missing FileText component
import { FileText } from "lucide-react";