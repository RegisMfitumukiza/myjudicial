"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { 
  CameraIcon, 
  XMarkIcon, 
  UserCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ArrowUpTrayIcon
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PhotoStatus {
  hasPhoto: boolean;
  needsPhoto: boolean;
  urgency: 'low' | 'medium' | 'high';
  message: string;
}

interface ProfilePhotoReminderProps {
  photoStatus: PhotoStatus;
  onUploadClick: () => void;
  onDismiss?: () => void;
  currentPhotoUrl?: string | null;
  className?: string;
}

export function ProfilePhotoReminder({ 
  photoStatus, 
  onUploadClick, 
  onDismiss,
  currentPhotoUrl,
  className = "" 
}: ProfilePhotoReminderProps) {
  const t = useTranslations("experts");
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || photoStatus.hasPhoto) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const getUrgencyStyles = () => {
    switch (photoStatus.urgency) {
      case 'high':
        return {
          bg: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          button: 'bg-red-600 hover:bg-red-700 text-white',
          text: 'text-red-800 dark:text-red-200'
        };
      case 'medium':
        return {
          bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800',
          icon: 'text-amber-600 dark:text-amber-400',
          button: 'bg-amber-600 hover:bg-amber-700 text-white',
          text: 'text-amber-800 dark:text-amber-200'
        };
      case 'low':
      default:
        return {
          bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          text: 'text-blue-800 dark:text-blue-200'
        };
    }
  };

  const styles = getUrgencyStyles();
  
  const IconComponent = photoStatus.urgency === 'high' 
    ? ExclamationTriangleIcon 
    : photoStatus.urgency === 'medium' 
      ? InformationCircleIcon 
      : CameraIcon;

  return (
    <Card className={`${styles.bg} border-2 p-4 sm:p-5 min-w-0 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 min-w-0">
        {/* Photo Preview or Placeholder */}
        <div className="flex-shrink-0">
          {currentPhotoUrl ? (
            <div className="relative">
              <img 
                src={currentPhotoUrl}
                alt="Current profile"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 p-1">
                <ExclamationTriangleIcon className="h-3 w-3 text-white" />
              </div>
            </div>
          ) : (
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${styles.bg.replace('50', '100')} ring-2 ring-white shadow-sm`}>
              <UserCircleIcon className={`h-8 w-8 ${styles.icon}`} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <IconComponent className={`h-4 w-4 shrink-0 ${styles.icon}`} />
                <h3 className={`text-sm font-semibold break-words ${styles.text}`}>
                  {photoStatus.urgency === 'high' ? t('photoReminder.neededHigh') : 
                   photoStatus.urgency === 'medium' ? t('photoReminder.neededMedium') : 
                   t('photoReminder.neededLow')}
                </h3>
              </div>
              <p className={`text-sm break-words ${styles.text.replace('800', '700').replace('200', '300')}`}>
                {photoStatus.message}
              </p>
            </div>

            {/* Dismiss Button */}
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className={`flex-shrink-0 rounded-full p-1 hover:bg-black/5 transition-colors ${styles.icon}`}
                aria-label="Dismiss"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Button
              onClick={onUploadClick}
              size="sm"
              className={`w-full sm:w-auto ${styles.button}`}
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-1 shrink-0" />
              {currentPhotoUrl ? t('photoReminder.updatePhoto') : t('photoReminder.uploadPhoto')}
            </Button>
            
            {photoStatus.urgency === 'high' && (
              <div className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                <span>{t('photoReminder.urgent')}</span>
              </div>
            )}
          </div>

          {/* Benefits Hint */}
          {photoStatus.urgency !== 'low' && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 break-words">
              💡 <strong>{t('photoReminder.didYouKnowStrong')}</strong> {t('photoReminder.didYouKnow')}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════════ */

/**
 * Compact version for dashboard widgets
 */
interface CompactPhotoReminderProps {
  photoStatus: PhotoStatus;
  onUploadClick: () => void;
  className?: string;
}

export function CompactPhotoReminder({ 
  photoStatus, 
  onUploadClick, 
  className = "" 
}: CompactPhotoReminderProps) {
  const t = useTranslations("experts");
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || photoStatus.hasPhoto || photoStatus.urgency === 'low') return null;

  const isUrgent = photoStatus.urgency === 'high';

  return (
    <div
      role="alert"
      className={`relative rounded-xl border p-3.5 sm:p-4 min-w-0 transition-all ${
        isUrgent
          ? "bg-red-50/90 border-red-200 dark:bg-red-950/30 dark:border-red-800/60"
          : "bg-amber-50/90 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/60"
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
        {/* Left: Icon + Title & Subtitle */}
        <div className="flex items-start gap-3 min-w-0 pr-8 sm:pr-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-full ${
              isUrgent
                ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
            }`}
            aria-hidden="true"
          >
            <CameraIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-0.5">
            <p
              className={`text-sm font-semibold leading-snug break-words ${
                isUrgent ? "text-red-900 dark:text-red-200" : "text-amber-900 dark:text-amber-200"
              }`}
            >
              {t("photoReminder.compactTitle")}
            </p>
            <p
              className={`text-xs leading-normal break-words ${
                isUrgent ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"
              }`}
            >
              {t("photoReminder.compactSubtitle")}
            </p>
          </div>
        </div>

        {/* Right: Upload Action & Desktop Dismiss */}
        <div className="flex items-center gap-2 sm:shrink-0 w-full sm:w-auto">
          <Button
            onClick={onUploadClick}
            size="sm"
            variant="outline"
            className={`w-full sm:w-auto h-8 px-3 text-xs font-semibold shrink-0 shadow-sm ${
              isUrgent
                ? "border-red-300 bg-red-100/50 text-red-800 hover:bg-red-100 hover:text-red-900 dark:border-red-700/80 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-900/50"
                : "border-amber-300 bg-amber-100/50 text-amber-800 hover:bg-amber-100 hover:text-amber-900 dark:border-amber-700/80 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/50"
            }`}
          >
            <ArrowUpTrayIcon className="h-3.5 w-3.5 mr-1.5 shrink-0" aria-hidden="true" />
            {t("photoReminder.compactButton")}
          </Button>

          {/* Desktop dismiss button */}
          <button
            onClick={() => setIsDismissed(true)}
            className={`hidden sm:inline-flex rounded-lg p-1.5 transition-colors ${
              isUrgent
                ? "text-red-500 hover:text-red-700 hover:bg-red-100/60 dark:text-red-400 dark:hover:text-red-200 dark:hover:bg-red-900/40"
                : "text-amber-500 hover:text-amber-700 hover:bg-amber-100/60 dark:text-amber-400 dark:hover:text-amber-200 dark:hover:bg-amber-900/40"
            }`}
            aria-label="Dismiss"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile dismiss button pinned to top-right */}
      <button
        onClick={() => setIsDismissed(true)}
        className={`sm:hidden absolute top-2.5 right-2.5 rounded-lg p-1.5 transition-colors ${
          isUrgent
            ? "text-red-500 hover:text-red-700 hover:bg-red-100/60 dark:text-red-400 dark:hover:text-red-200 dark:hover:bg-red-900/40"
            : "text-amber-500 hover:text-amber-700 hover:bg-amber-100/60 dark:text-amber-400 dark:hover:text-amber-200 dark:hover:bg-amber-900/40"
        }`}
        aria-label="Dismiss"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════════ */

/**
 * Success state component when photo is uploaded
 */
interface PhotoUploadSuccessProps {
  photoUrl: string;
  onChangePhoto?: () => void;
  className?: string;
}

export function PhotoUploadSuccess({ 
  photoUrl, 
  onChangePhoto, 
  className = "" 
}: PhotoUploadSuccessProps) {
  const t = useTranslations("experts");
  return (
    <Card className={`bg-green-50/90 border-green-200 dark:bg-green-950/30 dark:border-green-800/60 p-3.5 sm:p-4 min-w-0 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            <img 
              src={photoUrl}
              alt="Profile photo"
              className="h-11 w-11 rounded-full object-cover ring-2 ring-green-200 dark:ring-green-800 shadow-sm"
            />
            <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-green-500 p-0.5 text-white">
              <CheckCircleIcon className="h-3.5 w-3.5" />
            </div>
          </div>
          
          <div className="min-w-0 flex-1 space-y-0.5">
            <h3 className="text-sm font-semibold text-green-900 dark:text-green-200 leading-snug break-words">
              {t('photoReminder.successTitle')}
            </h3>
            <p className="text-xs text-green-700 dark:text-green-300 leading-normal break-words">
              {t('photoReminder.successSubtitle')}
            </p>
          </div>
        </div>
        
        {onChangePhoto && (
          <Button
            onClick={onChangePhoto}
            size="sm"
            variant="outline"
            className="w-full sm:w-auto h-8 px-3 text-xs font-semibold shrink-0 border-green-300 bg-green-100/40 text-green-800 hover:bg-green-100 hover:text-green-900 dark:border-green-700 dark:bg-green-950/40 dark:text-green-200 dark:hover:bg-green-900/50"
          >
            {t('photoReminder.successChange')}
          </Button>
        )}
      </div>
    </Card>
  );
}