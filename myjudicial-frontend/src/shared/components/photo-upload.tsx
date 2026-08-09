"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface PhotoUploadProps {
  currentImageUrl?: string | null;
  initials: string;
  userName: string;
  userEmail: string;
  roleLabel: string;
  roleColor: string;
}

export function ProfilePhotoCard({
  currentImageUrl,
  initials,
  userName,
  userEmail,
  roleLabel,
  roleColor,
}: PhotoUploadProps) {
  const t = useTranslations("shared.photoUpload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentImageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(t("selectImage"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t("imageTooLarge"));
      return;
    }

    setError(null);
    setSuccess(false);

    const preview = URL.createObjectURL(file);
    setPhotoUrl(preview);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      await apiFetch("/auth/profile/photo", {
        method: "PUT",
        body: formData,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("uploadFailed"));
      setPhotoUrl(currentImageUrl ?? null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative group">
        <div
          className={`flex h-20 w-20 cursor-pointer items-center justify-center rounded-full overflow-hidden ring-4 ring-white shadow-lg transition-shadow hover:shadow-xl ${
            !photoUrl
              ? "bg-brand-blue text-2xl font-bold text-on-brand"
              : ""
          }`}
          onClick={() => inputRef.current?.click()}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={userName}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-brand-border hover:bg-brand-canvas transition-all hover:scale-105"
        >
          <Camera size={14} className="text-brand-dark" />
        </button>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 size={24} className="animate-spin text-on-brand" />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>

      <h2 className="mt-5 text-xl font-bold text-brand-dark">{userName}</h2>
      <p className="text-sm text-gray-500">{userEmail}</p>
      <span
        className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${roleColor}`}
      >
        {roleLabel}
      </span>

      {error && (
        <div className="mt-4 flex w-full items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
          <XCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 flex w-full items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-600">
          <CheckCircle2 size={13} className="shrink-0" />
          {t("photoUpdated")}
        </div>
      )}
    </div>
  );
}

/**
 * ExpertPhotoUploader — for expert profile pages.
 *
 * Calls POST /experts/photo/profile which atomically saves to:
 *  - expertProfile.profileImageObjectKey  (Setup Checklist + public/client listing)
 *  - user.avatarObjectKey                 (sidebar avatar)
 *
 * After success, call refreshUser() from the auth context via onSuccess callback
 * so the sidebar avatar updates without requiring a page reload.
 */
export function ExpertPhotoUploader({
  currentImageUrl,
  userName,
  size = "sm",
  onSuccess,
}: {
  currentImageUrl?: string | null;
  userName: string;
  size?: "sm" | "md" | "lg";
  onSuccess?: (newUrl: string) => void;
}) {
  const t = useTranslations("shared.photoUpload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentImageUrl ?? null);
  const [uploading, setUploading] = useState(false);

  // Sync when parent provides a new signed URL (e.g. after upload invalidates the query)
  useEffect(() => {
    if (currentImageUrl) setPhotoUrl(currentImageUrl);
  }, [currentImageUrl]);

  const sizeClasses = size === "lg" ? "h-24 w-24" : size === "md" ? "h-16 w-16" : "h-10 w-10";
  const iconSize = size === "lg" ? 14 : 11;
  const buttonSize = size === "lg" ? "h-8 w-8" : "h-7 w-7";

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("selectImage"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("imageTooLarge"));
      return;
    }

    // Optimistic UI — show local preview immediately
    const preview = URL.createObjectURL(file);
    setPhotoUrl(preview);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      // Expert-specific endpoint — also syncs user.avatarObjectKey in backend
      const result = await apiFetch<{ data: { photoUrl: string; objectKey: string } }>(
        "/experts/photo/profile",
        { method: "POST", body: formData }
      );

      const confirmedUrl = (result as any)?.data?.data?.photoUrl ?? preview;
      setPhotoUrl(confirmedUrl);
      toast.success(t("photoUpdated"));
      onSuccess?.(confirmedUrl);
    } catch (err) {
      setPhotoUrl(currentImageUrl ?? null);
      toast.error(err instanceof Error ? err.message : t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <div
        className={`${sizeClasses} cursor-pointer overflow-hidden rounded-full bg-slate-200 ring-2 ring-white shadow-md transition-opacity group-hover:opacity-90`}
        onClick={() => inputRef.current?.click()}
        title={t("clickToChange")}
      >
        {photoUrl ? (
          <img src={photoUrl} alt={userName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-500">
            {userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`absolute -bottom-1 -right-1 flex ${buttonSize} items-center justify-center rounded-full bg-white shadow-md border border-slate-200 hover:bg-slate-50 transition-all hover:scale-110`}
        title={t("uploadNew")}
      >
        <Camera size={iconSize} className="text-slate-600" />
      </button>
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
          <Loader2 size={size === "lg" ? 24 : 18} className="animate-spin text-on-brand" />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/**
 * @deprecated Use ExpertPhotoUploader for expert profile pages.
 * Kept for non-expert pages that use the generic /auth/profile/photo endpoint.
 */
export function UploadableAvatar({
  currentImageUrl,
  userName,
  size = "sm",
}: {
  currentImageUrl?: string | null;
  userName: string;
  size?: "sm" | "md" | "lg";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentImageUrl ?? null);
  const [uploading, setUploading] = useState(false);

  const sizeClasses = size === "lg" ? "h-24 w-24" : size === "md" ? "h-16 w-16" : "h-10 w-10";

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const preview = URL.createObjectURL(file);
    setPhotoUrl(preview);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      await apiFetch("/auth/profile/photo", {
        method: "PUT",
        body: formData,
      });
    } catch {
      setPhotoUrl(currentImageUrl ?? null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <div
        className={`${sizeClasses} cursor-pointer overflow-hidden rounded-full bg-slate-200 ring-2 ring-white shadow-md`}
        onClick={() => inputRef.current?.click()}
      >
        {photoUrl ? (
          <img src={photoUrl} alt={userName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-500">
            {userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md border border-slate-200 hover:bg-slate-50 transition-all hover:scale-105"
      >
        <Camera size={11} className="text-slate-600" />
      </button>
      {uploading && (
        <div className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/40 ${sizeClasses}`}>
          <Loader2 size={18} className="animate-spin text-on-brand" />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
