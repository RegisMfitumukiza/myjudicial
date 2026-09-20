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
    <Card className={`${styles.bg} border-2 p-4 ${className}`}>
      <div className="flex items-start gap-4">
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
            <div>
              <div className="flex items-center gap-2 mb-1">
                <IconComponent className={`h-4 w-4 ${styles.icon}`} />
                <h3 className={`text-sm font-semibold ${styles.text}`}>
                  {photoStatus.urgency === 'high' ? t('photoReminder.neededHigh') : 
                   photoStatus.urgency === 'medium' ? t('photoReminder.neededMedium') : 
                   t('photoReminder.neededLow')}
                </h3>
              </div>
              <p className={`text-sm ${styles.text.replace('800', '700').replace('200', '300')}`}>
                {photoStatus.message}
              </p>
            </div>

            {/* Dismiss Button */}
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className={`flex-shrink-0 rounded-full p-1 hover:bg-black/5 transition-colors ${styles.icon}`}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              onClick={onUploadClick}
              size="sm"
              className={styles.button}
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
              {currentPhotoUrl ? t('photoReminder.updatePhoto') : t('photoReminder.uploadPhoto')}
            </Button>
            
            {photoStatus.urgency === 'high' && (
              <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <ExclamationTriangleIcon className="h-3 w-3" />
                <span>{t('photoReminder.urgent')}</span>
              </div>
            )}
          </div>

          {/* Benefits Hint */}
          {photoStatus.urgency !== 'low' && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
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
    <div className={`flex items-center gap-3 rounded-lg p-3 ${
      isUrgent 
        ? 'bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800' 
        : 'bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
    } ${className}`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
        isUrgent ? 'bg-red-100 dark:bg-red-900' : 'bg-amber-100 dark:bg-amber-900'
      }`}>
        <CameraIcon className={`h-4 w-4 ${
          isUrgent ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
        }`} />
      </div>
      
      <div className="flex-1">
        <p className={`text-sm font-medium ${
          isUrgent ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'
        }`}>
          {t('photoReminder.compactTitle')}
        </p>
        <p className={`text-xs ${
          isUrgent ? 'text-red-600 dark:text-red-300' : 'text-amber-600 dark:text-amber-300'
        }`}>
          {t('photoReminder.compactSubtitle')}
        </p>
      </div>
      
      <Button
        onClick={onUploadClick}
        size="sm"
        variant="outline"
        className={`border-current text-xs ${
          isUrgent ? 'text-red-700 hover:bg-red-100 dark:text-red-300' : 'text-amber-700 hover:bg-amber-100 dark:text-amber-300'
        }`}
      >
        {t('photoReminder.compactButton')}
      </Button>
      
      <button
        onClick={() => setIsDismissed(true)}
        className={`rounded-full p-1 hover:bg-black/5 transition-colors ${
          isUrgent ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
        }`}
      >
        <XMarkIcon className="h-3 w-3" />
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
    <Card className={`bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800 p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <img 
            src={photoUrl}
            alt="Profile photo"
            className="h-12 w-12 rounded-full object-cover ring-2 ring-green-200 shadow-sm"
          />
          <div className="absolute -bottom-1 -right-1 rounded-full bg-green-500 p-1">
            <CheckCircleIcon className="h-3 w-3 text-white" />
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">
            {t('photoReminder.successTitle')}
          </h3>
          <p className="text-xs text-green-600 dark:text-green-300">
            {t('photoReminder.successSubtitle')}
          </p>
        </div>
        
        {onChangePhoto && (
          <Button
            onClick={onChangePhoto}
            size="sm"
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-100 dark:text-green-300"
          >
            {t('photoReminder.successChange')}
          </Button>
        )}
      </div>
    </Card>
  );
}