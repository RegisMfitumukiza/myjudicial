"use client";

import { useState } from "react";
import { 
  Clock, Download, Eye, RotateCcw, Plus, 
  FileText, User, Check, AlertCircle, Upload,
  GitBranch, ArrowRight
} from "lucide-react";

interface DocumentVersion {
  id: string;
  version: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  createdBy: string;
  createdByRole: "CLIENT" | "EXPERT" | "SYSTEM";
  changeDescription?: string;
  isCurrentVersion: boolean;
  downloadUrl?: string;
}

interface DocumentVersionsProps {
  fileId: string;
  versions: DocumentVersion[];
  onDownloadVersion: (versionId: string) => void;
  onPreviewVersion: (versionId: string) => void;
  onRestoreVersion: (versionId: string) => void;
  onUploadNewVersion: (file: File, description: string) => void;
  canEdit?: boolean;
}

export function DocumentVersions({
  fileId,
  versions,
  onDownloadVersion,
  onPreviewVersion,
  onRestoreVersion,
  onUploadNewVersion,
  canEdit = true
}: DocumentVersionsProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState("");

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "EXPERT": return "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400";
      case "CLIENT": return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
      case "SYSTEM": return "text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400";
      default: return "text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "EXPERT": return "Lawyer";
      case "CLIENT": return "You";
      case "SYSTEM": return "System";
      default: return "User";
    }
  };

  const handleUploadSubmit = () => {
    if (uploadFile && uploadDescription.trim()) {
      onUploadNewVersion(uploadFile, uploadDescription.trim());
      setShowUpload(false);
      setUploadFile(null);
      setUploadDescription("");
    }
  };

  const sortedVersions = [...versions].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Version History
            </h3>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {versions.length}
            </span>
          </div>
          
          {canEdit && (
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Version
            </button>
          )}
        </div>
      </div>

      {/* Upload New Version Modal */}
      {showUpload && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
            <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Upload New Version
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select File
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description of Changes
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="What changed in this version?"
                />
              </div>
            </div>
            
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleUploadSubmit}
                disabled={!uploadFile || !uploadDescription.trim()}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload Version
              </button>
              <button
                onClick={() => setShowUpload(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Versions List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {sortedVersions.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                No version history
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Upload a new version to start tracking changes
              </p>
            </div>
          ) : (
            sortedVersions.map((version, index) => (
              <div
                key={version.id}
                className={`rounded-lg border p-4 transition-all ${
                  version.isCurrentVersion
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        Version {version.version}
                      </h4>
                      
                      {version.isCurrentVersion && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <Check className="h-3 w-3" />
                          Current
                        </span>
                      )}
                      
                      <div className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRoleColor(version.createdByRole)}`}>
                        {getRoleLabel(version.createdByRole)}
                      </div>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {version.fileName} • {formatFileSize(version.fileSize)}
                    </p>
                    
                    {version.changeDescription && (
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        {version.changeDescription}
                      </p>
                    )}
                    
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(version.createdAt)} by {version.createdBy}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => onPreviewVersion(version.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Eye className="h-3 w-3" />
                    Preview
                  </button>
                  
                  <button
                    onClick={() => onDownloadVersion(version.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                  
                  {!version.isCurrentVersion && canEdit && (
                    <button
                      onClick={() => onRestoreVersion(version.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </button>
                  )}
                </div>
                
                {/* Version Timeline Connector */}
                {index < sortedVersions.length - 1 && (
                  <div className="mt-4 flex justify-center">
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="h-3 w-3" />
          <span>
            Version history is automatically saved and synchronized with your lawyer
          </span>
        </div>
      </div>
    </div>
  );
}