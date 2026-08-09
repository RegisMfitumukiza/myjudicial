"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { 
  CameraIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  onPhotoUpload: (file: File) => Promise<void>;
  onPhotoRemove?: () => Promise<void>;
  isUploading?: boolean;
  className?: string;
}

export function ProfilePhotoUpload({
  currentPhotoUrl,
  onPhotoUpload,
  onPhotoRemove,
  isUploading = false,
  className = ""
}: ProfilePhotoUploadProps) {
  const t = useTranslations("experts");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Once the parent provides a real signed URL, clear the local blob preview
  useEffect(() => {
    if (currentPhotoUrl && previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [currentPhotoUrl]);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return t("photo.errorType");
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return t("photo.errorSize");
    }

    // Check image dimensions (optional)
    return null;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create preview immediately so the user sees the photo right away
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      await onPhotoUpload(file);
      // Keep previewUrl — parent will provide currentPhotoUrl (signed URL) after invalidation.
      // We only clear it once the parent has a real URL to show.
    } catch (err) {
      setError(err instanceof Error ? err.message : t("photo.uploadFailed"));
      setPreviewUrl(null);
      URL.revokeObjectURL(objectUrl);
    }
  }, [onPhotoUpload]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = previewUrl || currentPhotoUrl;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("photo.title")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("photo.subtitle")}
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {displayUrl ? (
            /* Current/Preview Photo */
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={displayUrl}
                  alt="Profile photo"
                  className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-lg"
                />
                {previewUrl && (
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-blue-500 p-1">
                    <CheckCircleIcon className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {previewUrl ? t("photo.readyToUpload") : t("photo.currentPhoto")}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("photo.clickToChange")}
                </p>
                
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={openFileDialog}
                    size="sm"
                    variant="outline"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                      <CameraIcon className="h-4 w-4" />
                    )}
                    {previewUrl ? t("photo.chooseDifferent") : t("photo.changePhoto")}
                  </Button>
                  
                  {currentPhotoUrl && onPhotoRemove && (
                    <Button
                      onClick={onPhotoRemove}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      disabled={isUploading}
                    >
                      <XMarkIcon className="h-4 w-4" />
                      {t("photo.remove")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <CameraIcon className="h-8 w-8 text-gray-400" />
              </div>
              
              <div className="mt-4">
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {t("photo.uploadYourPhoto")}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("photo.dragDropHint")}
                </p>
              </div>
              
              <Button
                onClick={openFileDialog}
                className="mt-4"
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                ) : (
                  <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                )}
                {isUploading ? t("photo.uploading") : t("photo.selectPhoto")}
              </Button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-800 dark:bg-red-950/20 dark:text-red-200">
            <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Guidelines */}
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("photo.guidelinesTitle")}
          </p>
          <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <li>• {t("photo.guideline1")}</li>
            <li>• {t("photo.guideline2")}</li>
            <li>• {t("photo.guideline3")}</li>
            <li>• {t("photo.guideline4")}</li>
            <li>• {t("photo.guideline5")}</li>
          </ul>
        </div>

        {/* Benefits Reminder */}
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {t("photo.didYouKnow")}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            {t("photo.benefitHint")}
          </p>
        </div>
      </div>
    </Card>
  );
}