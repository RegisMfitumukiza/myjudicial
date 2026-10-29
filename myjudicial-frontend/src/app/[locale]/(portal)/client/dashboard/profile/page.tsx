"use client";

import { useState } from "react";
import {
  Shield,
  Calendar,
  BadgeCheck,
  Pencil,
  Copy,
  Check,
  Globe,
  Briefcase,
  FileText,
  Star,
  ArrowRight,
  ExternalLink,
  Lock,
  MapPin,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { ProfilePhotoCard } from "@/shared/components/photo-upload";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { useGetBookings, useGetFiles, useGetReviewsMyReviews } from "@/api/generated";
import { toast } from "sonner";

export default function ProfilePage() {
  const locale = useLocale();
  const t = useTranslations("clientDashboard.profile");
  const { user, isLoading } = useAuth();
  const [copiedId, setCopiedId] = useState(false);

  // Engagement telemetry from active API queries
  const { data: bookingsData } = useGetBookings({ page: 1, limit: 1 });
  const { data: filesData } = useGetFiles();
  const { data: reviewsData } = useGetReviewsMyReviews({ page: "1", limit: "1" });

  const totalBookings =
    bookingsData?.status === 200
      ? (bookingsData.data.pagination?.total ?? bookingsData.data.data?.length ?? 0)
      : 0;
  const totalFiles =
    filesData?.status === 200 && Array.isArray(filesData.data.data)
      ? filesData.data.data.length
      : 0;
  const totalReviews =
    reviewsData?.status === 200
      ? (reviewsData.data.pagination?.total ?? reviewsData.data.data?.length ?? 0)
      : 0;

  const fullName = user
    ? user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.firstName || user.email || "Citizen User"
    : "Citizen User";

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const roleLabel =
    user?.role === "ADMIN"
      ? t("roles.admin")
      : user?.role === "EXPERT"
      ? t("roles.expert")
      : t("roles.client");

  const roleColor =
    user?.role === "ADMIN"
      ? "bg-brand-alert/10 text-brand-alert"
      : user?.role === "EXPERT"
      ? "bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white"
      : "bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white";

  const citizenRef = user?.id ? `USR-${user.id.replace(/-/g, "").slice(0, 8).toUpperCase()}` : "—";

  const handleCopyId = () => {
    if (!citizenRef || citizenRef === "—") return;
    navigator.clipboard.writeText(citizenRef);
    setCopiedId(true);
    toast.success(t("copied"));
    setTimeout(() => setCopiedId(false), 2500);
  };

  const preferredLanguageLabel =
    user?.preferredLanguage === "rw"
      ? "Ikinyarwanda"
      : user?.preferredLanguage === "fr"
      ? "Français"
      : "English (Default)";

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 p-3 min-[400px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-[22px] font-bold text-gray-900 dark:text-gray-100 break-words">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>
        <Link
          href="/client/dashboard/profile/edit"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-dark px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark/90 dark:bg-white dark:text-black self-start sm:self-auto shrink-0"
        >
          <Pencil size={14} />
          <span>{t("personalInfo.editProfile")}</span>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left Column: Identity Snapshot & Account Credentials */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-brand-border/20 dark:border-white/10 bg-white dark:bg-black p-5 sm:p-6 shadow-sm">
            <ProfilePhotoCard
              currentImageUrl={
                user?.avatarUrl ||
                (user?.avatarObjectKey
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.avatarObjectKey}`
                  : null)
              }
              initials={initials}
              userName={fullName}
              userEmail={user?.email ?? ""}
              roleLabel={roleLabel}
              roleColor={roleColor}
            />

            {/* Non-redundant Identity Metadata */}
            <div className="mt-6 space-y-4 border-t border-brand-border/10 dark:border-white/10 pt-5">
              {/* Citizen Reference ID */}
              <div className="flex items-center justify-between gap-2 rounded-xl bg-brand-dark/[0.02] dark:bg-white/[0.02] p-3 border border-brand-border/10 dark:border-white/10">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {t("referenceId")}
                  </p>
                  <p className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                    {citizenRef}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyId}
                  title={t("copy")}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-border/20 bg-white dark:bg-gray-800 text-gray-500 hover:text-brand-dark dark:hover:text-white transition-colors shrink-0"
                >
                  {copiedId ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </button>
              </div>

              {/* Verified Account Status */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-500 dark:text-gray-400">
                  {t("labels.status")}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 font-bold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {t("activeAccount")}
                </span>
              </div>

              {/* Member Since & Sign-In Timestamps */}
              <div className="space-y-1.5 border-t border-brand-border/10 dark:border-white/10 pt-3 text-xs text-brand-dark/60 dark:text-white/60">
                {user?.createdAt && (
                  <p className="flex items-center justify-between">
                    <span>{t("memberSince", { date: "" }).replace(":", "")}:</span>
                    <span className="font-semibold text-brand-dark dark:text-white">
                      {new Date(user.createdAt).toLocaleDateString(locale, {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                )}
                {user?.lastLoginAt && (
                  <p className="flex items-center justify-between">
                    <span>{t("personalInfo.lastLogin")}:</span>
                    <span className="font-semibold text-brand-dark dark:text-white">
                      {new Date(user.lastLoginAt).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Case Engagement, Verified Credentials & Security */}
        <div className="space-y-6">
          {/* Card 1: Portal Activity & Engagement Summary */}
          <div className="rounded-2xl border border-brand-border/20 dark:border-white/10 bg-white dark:bg-black p-5 sm:p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {t("activityTitle")}
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {t("activitySubtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 min-[440px]:grid-cols-3 gap-3">
              <Link
                href="/client/dashboard/consultations"
                className="group flex flex-col justify-between rounded-xl border border-brand-border/15 p-3.5 hover:border-brand-dark/40 hover:bg-brand-dark/[0.02] dark:border-white/10 dark:hover:border-white/30 dark:hover:bg-white/[0.02] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    <Briefcase size={16} />
                  </div>
                  <ArrowRight size={13} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold text-brand-dark dark:text-white">
                    {totalBookings}
                  </p>
                  <p className="text-xs text-brand-dark/60 dark:text-white/60">
                    {t("statsConsultations")}
                  </p>
                </div>
              </Link>

              <Link
                href="/client/dashboard/documents"
                className="group flex flex-col justify-between rounded-xl border border-brand-border/15 p-3.5 hover:border-brand-dark/40 hover:bg-brand-dark/[0.02] dark:border-white/10 dark:hover:border-white/30 dark:hover:bg-white/[0.02] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <FileText size={16} />
                  </div>
                  <ArrowRight size={13} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold text-brand-dark dark:text-white">
                    {totalFiles}
                  </p>
                  <p className="text-xs text-brand-dark/60 dark:text-white/60">
                    {t("statsDocuments")}
                  </p>
                </div>
              </Link>

              <Link
                href="/client/dashboard/reviews"
                className="group flex flex-col justify-between rounded-xl border border-brand-border/15 p-3.5 hover:border-brand-dark/40 hover:bg-brand-dark/[0.02] dark:border-white/10 dark:hover:border-white/30 dark:hover:bg-white/[0.02] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    <Star size={16} />
                  </div>
                  <ArrowRight size={13} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold text-brand-dark dark:text-white">
                    {totalReviews}
                  </p>
                  <p className="text-xs text-brand-dark/60 dark:text-white/60">
                    {t("statsReviews")}
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Card 2: Contact Credentials & Jurisdiction */}
          <div className="rounded-2xl border border-brand-border/20 dark:border-white/10 bg-white dark:bg-black shadow-sm">
            <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-white/10 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {t("personalInfo.title")}
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {t("personalInfo.subtitle")}
                </p>
              </div>
              <Link
                href="/client/dashboard/profile/edit"
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-dark dark:text-white hover:underline"
              >
                <span>{t("personalInfo.editProfile")}</span>
                <span>&rarr;</span>
              </Link>
            </div>

            <div className="p-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Legal Full Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {t("personalInfo.fullName")}
                  </label>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {fullName}
                  </p>
                </div>

                {/* Primary Email */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {t("personalInfo.emailAddress")}
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-all">
                      {user?.email || "—"}
                    </p>
                    {user?.email && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <BadgeCheck size={11} className="text-emerald-600" />
                        {t("verifiedBadge")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {t("personalInfo.phoneNumber")}
                  </label>
                  {user?.phone ? (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {user.phone}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <BadgeCheck size={11} className="text-emerald-600" />
                        {t("verifiedBadge")}
                      </span>
                    </div>
                  ) : (
                    <Link
                      href="/client/dashboard/profile/edit"
                      className="text-xs font-semibold text-brand-dark dark:text-white underline"
                    >
                      {t("addPhone")}
                    </Link>
                  )}
                </div>

                {/* Preferred Language */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {t("preferredLanguage")}
                  </label>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {preferredLanguageLabel}
                    </p>
                    <Link
                      href="/client/dashboard/settings"
                      className="text-[11px] font-semibold text-brand-dark/70 dark:text-white/70 hover:underline"
                    >
                      {t("viewAll")} &rarr;
                    </Link>
                  </div>
                </div>

                {/* Legal Jurisdiction */}
                <div className="space-y-1 sm:col-span-2 border-t border-brand-border/10 dark:border-white/10 pt-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {t("jurisdiction")}
                  </label>
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-brand-dark/60 dark:text-white/60" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {t("rwandaJurisdiction")} (Central Africa Time · UTC+2)
                    </p>
                  </div>
                </div>

                {/* Preferred Location / Near Me */}
                <div className="space-y-1.5 sm:col-span-2 border-t border-brand-border/10 dark:border-white/10 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Preferred Location
                    </label>
                    <Link
                      href="/client/dashboard/profile/edit"
                      className="text-[11px] font-semibold text-brand-dark/70 dark:text-white/70 hover:underline"
                    >
                      {user?.clientDistrict?.name || (user as any)?.onboarding?.citizen?.district ? "Change" : "Set Location"} &rarr;
                    </Link>
                  </div>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-brand-dark/60 dark:text-white/60 shrink-0" />
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {user?.clientDistrict?.name
                          ? `${user?.clientSector?.name ? `${user.clientSector.name}, ` : ""}${user.clientDistrict.name} District, Rwanda`
                          : (user as any)?.onboarding?.citizen?.district
                          ? `${(user as any).onboarding.citizen.district} District, Rwanda`
                          : "Not specified (Nationwide discovery)"}
                      </p>
                    </div>
                    {(user?.clientDistrict?.name || (user as any)?.onboarding?.citizen?.district) && (
                      <Link
                        href={`/search?q=${encodeURIComponent(user?.clientDistrict?.name || (user as any)?.onboarding?.citizen?.district)}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Find Experts Near Me &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Security & Privacy Governance */}
          <div className="rounded-2xl border border-brand-border/20 dark:border-white/10 bg-white dark:bg-black shadow-sm">
            <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-white/10 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {t("security.title")}
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {t("security.subtitle")}
                </p>
              </div>
              <Link
                href="/client/dashboard/security"
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-dark dark:text-white hover:underline"
              >
                <span>{t("manageSecurity")}</span>
                <span>&rarr;</span>
              </Link>
            </div>

            <div className="p-5">
              <div className="divide-y divide-brand-border/15 dark:divide-white/10 rounded-xl border border-brand-border/20 dark:border-white/10">
                {/* Email OTP Verification (Clean, non-redundant) */}
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="pr-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {t("security.emailOtp")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("security.emailOtpDesc")}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300 shrink-0">
                    {t("security.active")}
                  </span>
                </div>

                {/* Connected Devices & Sessions */}
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="pr-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {t("activeDevicesTitle")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("activeDevicesDesc")}
                    </p>
                  </div>
                  <Link
                    href="/client/dashboard/security"
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-dark dark:text-white hover:underline shrink-0"
                  >
                    <span>{t("manageDevices")}</span>
                    <span>&rarr;</span>
                  </Link>
                </div>

                {/* Data Protection Compliance */}
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="pr-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {t("dataProtection")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("dataProtectionDesc")}
                    </p>
                  </div>
                  <Link
                    href="/client/dashboard/security"
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-dark dark:text-white hover:underline shrink-0"
                  >
                    <span>{t("exportData")}</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
